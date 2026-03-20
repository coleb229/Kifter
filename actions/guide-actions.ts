"use server";

import Anthropic from "@anthropic-ai/sdk";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { YoutubeTranscript } from "youtube-transcript";
import { auth } from "@/auth";
import { getTrainingGuidesCollection } from "@/lib/db";
import { getIntegrationSettings } from "@/actions/settings-actions";
import type { ActionResult, TrainingGuide, GuideType, ExtractedGuideContent } from "@/types";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("AI features are not configured.");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function getDefaultAiModel(): Promise<string> {
  const integrations = await getIntegrationSettings();
  return integrations?.anthropic?.defaultModel ?? "claude-sonnet-4-6";
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i,
    /^([a-zA-Z0-9_-]{11})$/, // bare video ID
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// youtube-transcript's InnerTube constants (same values the library uses)
const INNERTUBE_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";
const INNERTUBE_UA = "com.google.android.youtube/20.10.38 (Linux; U; Android 14)";
const INNERTUBE_BODY = { context: { client: { clientName: "ANDROID", clientVersion: "20.10.38" } } };

// One InnerTube call gives us both caption tracks AND shortDescription.
// Try CC captions first; fall back to the creator's written description.
async function fetchVideoContent(videoId: string): Promise<{ text: string; source: "captions" | "description" }> {
  const res = await fetch(INNERTUBE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": INNERTUBE_UA },
    body: JSON.stringify({ ...INNERTUBE_BODY, videoId }),
  });

  if (!res.ok) throw new Error(`YouTube API returned ${res.status}. Try again in a moment.`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();

  // 1. Caption tracks available → use YoutubeTranscript to fetch formatted text
  const captionTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (Array.isArray(captionTracks) && captionTracks.length > 0) {
    try {
      const segments = await YoutubeTranscript.fetchTranscript(videoId);
      if (segments && segments.length > 0) {
        return { text: segments.map((s) => s.text).join(" "), source: "captions" };
      }
    } catch {
      // caption tracks exist but failed to parse — fall through to description
    }
  }

  // 2. No caption tracks → use the creator's written description (transcript in bio)
  const description: string | undefined = data?.videoDetails?.shortDescription;
  if (description && description.trim().length > 80) {
    return { text: description.trim(), source: "description" };
  }

  throw new Error(
    "No captions or description content found. Ensure the video either has YouTube CC captions enabled, " +
    "or has the transcript pasted into the video description."
  );
}

function serializeGuide(doc: {
  _id: ObjectId;
  type: GuideType;
  exerciseName?: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  addedBy: string;
  status: "ready" | "failed";
  content?: ExtractedGuideContent;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}): TrainingGuide {
  return {
    id: doc._id.toHexString(),
    type: doc.type,
    exerciseName: doc.exerciseName,
    title: doc.title,
    youtubeUrl: doc.youtubeUrl,
    youtubeId: doc.youtubeId,
    addedBy: doc.addedBy,
    status: doc.status,
    content: doc.content,
    errorMessage: doc.errorMessage,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function buildExtractionPrompt(type: GuideType, exerciseName: string | undefined, transcript: string, source: "captions" | "description" | "manual"): string {
  const jsonSchema = `{
  "title": "string (concise descriptive title for this content)",
  "summary": "string (2–3 sentence overview of what this routine/guide covers)",
  "keyPoints": ["string", "..."],
  "steps": [{ "step": 1, "instruction": "string", "cues": ["string"] }],
  "targetMuscles": ["string"],
  "equipment": ["string (list 'None' if bodyweight only)"],
  "difficulty": "beginner | intermediate | advanced",
  "commonMistakes": ["string"],
  "duration": "string (e.g. '8–10 minutes' or omit if not mentioned)"
}`;

  const sourceNote =
    source === "manual"     ? "The input below is the transcript pasted directly by the admin." :
    source === "description" ? "The input below is the video's written description/transcript posted by the creator." :
                               "The input below is the auto-generated spoken transcript from the video.";

  const typeInstructions: Record<GuideType, string> = {
    stability: `Extract a complete stability and mobility routine from the content below.
Focus on: drill names and execution, coaching cues, muscles targeted, repetitions/holds, and sequencing.`,
    warmup: `Extract a complete warmup routine from the content below.
Focus on: exercise sequence, reps/duration per movement, purpose of each drill, and total time.`,
    form_guide: `Extract a detailed form and technique guide for "${exerciseName}" from the content below.
Focus on: setup and positioning, movement cues, common mistakes, breathing, and progressions.`,
  };

  return `${typeInstructions[type]}
${sourceNote}
Return ONLY valid JSON — no markdown fences, no commentary — matching this schema exactly:
${jsonSchema}

CONTENT:
${transcript.slice(0, 12000)}`; // cap at ~12k chars to stay within token budget
}

// ── processYouTubeGuide ────────────────────────────────────────────────────────

export async function processYouTubeGuide(
  url: string,
  type: GuideType,
  exerciseName?: string,
  manualTranscript?: string
): Promise<ActionResult<TrainingGuide>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== "admin") return { success: false, error: "Admin access required" };

  if (!url.trim()) return { success: false, error: "YouTube URL is required" };
  if (type === "form_guide" && !exerciseName?.trim()) {
    return { success: false, error: "Exercise name is required for form guides" };
  }

  const videoId = extractYoutubeId(url.trim());
  if (!videoId) return { success: false, error: "Could not parse a valid YouTube video ID from that URL" };

  try {
    // 1. Resolve content: manual paste takes priority, then auto-fetch
    let videoContent: { text: string; source: "captions" | "description" | "manual" };
    const pastedText = manualTranscript?.trim();
    if (pastedText && pastedText.length > 50) {
      videoContent = { text: pastedText, source: "manual" };
    } else {
      try {
        videoContent = await fetchVideoContent(videoId);
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }

    // 2. Extract structured data via Claude
    const client = getClient();
    const model = await getDefaultAiModel();
    const prompt = buildExtractionPrompt(type, exerciseName, videoContent.text, videoContent.source);

    const message = await client.messages.create({
      model,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const parsed = JSON.parse(cleaned) as ExtractedGuideContent & { title?: string };

    const title = parsed.title ?? (type === "form_guide" ? `${exerciseName} Form Guide` : `${type.replace("_", " ")} Routine`);
    delete (parsed as { title?: string }).title; // store title separately on the doc

    // 3. Persist to MongoDB
    const col = await getTrainingGuidesCollection();
    const now = new Date();
    const insertResult = await col.insertOne({
      _id: new ObjectId(),
      type,
      exerciseName: exerciseName?.trim(),
      title,
      youtubeUrl: url.trim(),
      youtubeId: videoId,
      addedBy: session.user.id,
      status: "ready",
      content: parsed,
      createdAt: now,
      updatedAt: now,
    });

    const doc = await col.findOne({ _id: insertResult.insertedId });
    if (!doc) return { success: false, error: "Failed to retrieve saved guide" };

    revalidatePath("/admin");
    return { success: true, data: serializeGuide(doc) };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "Failed to process video" };
  }
}

// ── getTrainingGuides ──────────────────────────────────────────────────────────

export async function getTrainingGuides(): Promise<ActionResult<TrainingGuide[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== "admin") return { success: false, error: "Admin access required" };

  try {
    const col = await getTrainingGuidesCollection();
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    return { success: true, data: docs.map(serializeGuide) };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "Failed to load guides" };
  }
}

// ── deleteTrainingGuide ────────────────────────────────────────────────────────

export async function deleteTrainingGuide(id: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== "admin") return { success: false, error: "Admin access required" };

  try {
    const col = await getTrainingGuidesCollection();
    await col.deleteOne({ _id: new ObjectId(id) });
    revalidatePath("/admin");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "Failed to delete guide" };
  }
}
