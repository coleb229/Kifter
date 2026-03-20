"use server";

import Anthropic from "@anthropic-ai/sdk";
import { jsonrepair } from "jsonrepair";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getTrainingGuidesCollection, getPublishedGuidesCollection } from "@/lib/db";
import { getIntegrationSettings } from "@/actions/settings-actions";
import type { ActionResult, PublishedGuide, PublishedGuideContent, PublishedGuideDoc } from "@/types";

// ── Helpers ─────────────────────────────────────────────────────────────────

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("AI features are not configured.");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function getDefaultAiModel(): Promise<string> {
  const integrations = await getIntegrationSettings();
  return integrations?.anthropic?.defaultModel ?? "claude-sonnet-4-6";
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uniqueSlug(baseSlug: string): Promise<string> {
  const col = await getPublishedGuidesCollection();
  let slug = baseSlug;
  let n = 1;
  while (await col.findOne({ slug })) {
    n++;
    slug = `${baseSlug}-${n}`;
  }
  return slug;
}

function serializeGuide(doc: PublishedGuideDoc): PublishedGuide {
  return {
    id: doc._id.toHexString(),
    slug: doc.slug,
    title: doc.title,
    type: doc.type,
    exerciseName: doc.exerciseName,
    sourceGuideIds: doc.sourceGuideIds.map((id) => id.toHexString()),
    sourceYoutubeIds: doc.sourceYoutubeIds,
    content: doc.content,
    status: doc.status,
    publishedAt: doc.publishedAt?.toISOString(),
    createdBy: doc.createdBy,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function buildSynthesisPrompt(sources: { title: string; type: string; exerciseName?: string; content: object }[]): string {
  const jsonSchema = `{
  "title": "string (concise, compelling title for this guide)",
  "slug": "string (kebab-case URL slug derived from title)",
  "intro": "string (2–3 rich paragraphs introducing the guide — context, benefits, who it's for)",
  "sections": [
    {
      "heading": "string",
      "body": "string (detailed paragraph for this section)",
      "tips": ["string (optional coaching tips or cues)"]
    }
  ],
  "keyPoints": ["string"],
  "steps": [{ "step": 1, "instruction": "string", "cues": ["string"] }],
  "targetMuscles": ["string"],
  "equipment": ["string"],
  "difficulty": "beginner | intermediate | advanced",
  "commonMistakes": ["string"],
  "duration": "string (e.g. '10–15 minutes' or omit if unknown)",
  "tags": ["string (3–6 relevant fitness tags)"]
}`;

  const sourcesText = sources
    .map((s, i) => `--- Source ${i + 1}: ${s.title} (${s.type}${s.exerciseName ? `, ${s.exerciseName}` : ""}) ---\n${JSON.stringify(s.content, null, 2)}`)
    .join("\n\n");

  return `You are a fitness coach writing for people who are completely new to the gym. Synthesise the source material below into a single, beginner-friendly training guide.

TONE & LANGUAGE RULES:
- Write like you are explaining to someone on their first week at the gym — clear, warm, encouraging, never condescending
- Use everyday language. Avoid or briefly explain any jargon (e.g. "hip flexors (the muscles at the front of your hips)")
- Keep sentences short. Aim for 8th-grade reading level
- Sections should be 3–5 sentences — substantive but scannable
- The steps section should feel like a coach standing next to the person, talking them through it

Do NOT just concatenate the sources — produce a cohesive, well-written guide that integrates insights from all sources.
If multiple sources cover the same topic, merge them into the clearest, most beginner-friendly advice.

Return ONLY valid JSON — no markdown fences, no commentary — matching this schema exactly:
${jsonSchema}

SOURCE MATERIAL:
${sourcesText}`;
}

// ── generateGuideDraft ───────────────────────────────────────────────────────

export async function generateGuideDraft(sourceGuideIds: string[]): Promise<ActionResult<PublishedGuide>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== "admin") return { success: false, error: "Admin access required" };
  if (!sourceGuideIds.length) return { success: false, error: "Select at least one source guide" };

  try {
    const trainingCol = await getTrainingGuidesCollection();
    const objectIds = sourceGuideIds.map((id) => new ObjectId(id));
    const sources = await trainingCol.find({ _id: { $in: objectIds } }).toArray();

    if (!sources.length) return { success: false, error: "No matching source guides found" };

    const ready = sources.filter((s) => s.status === "ready" && s.content);
    if (!ready.length) return { success: false, error: "Selected guides have no extracted content" };

    const client = getClient();
    const model = await getDefaultAiModel();
    const prompt = buildSynthesisPrompt(
      ready.map((s) => ({
        title: s.title,
        type: s.type,
        exerciseName: s.exerciseName,
        content: s.content!,
      }))
    );

    const message = await client.messages.create({
      model,
      max_tokens: 6000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const block = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1) || raw;
    const parsed = JSON.parse(jsonrepair(block)) as PublishedGuideContent & { title?: string; slug?: string };

    const title = parsed.title ?? ready[0].title;
    const baseSlug = parsed.slug ?? toSlug(title);
    delete (parsed as { title?: string }).title;
    const slug = await uniqueSlug(baseSlug.includes("-") ? baseSlug : toSlug(title));
    delete (parsed as { slug?: string }).slug;

    const col = await getPublishedGuidesCollection();
    const now = new Date();
    const insertResult = await col.insertOne({
      _id: new ObjectId(),
      slug,
      title,
      type: ready[0].type,
      exerciseName: ready[0].exerciseName,
      sourceGuideIds: ready.map((s) => s._id),
      sourceYoutubeIds: ready.map((s) => s.youtubeId),
      content: parsed as PublishedGuideContent,
      status: "draft",
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    });

    const doc = await col.findOne({ _id: insertResult.insertedId });
    if (!doc) return { success: false, error: "Failed to retrieve saved draft" };

    revalidatePath("/admin");
    revalidatePath("/training/guides");
    return { success: true, data: serializeGuide(doc) };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "Failed to generate guide" };
  }
}

// ── getPublishedGuides ───────────────────────────────────────────────────────

export async function getPublishedGuides(includeDrafts = false): Promise<ActionResult<PublishedGuide[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const col = await getPublishedGuidesCollection();
    const isAdmin = session.user.role === "admin";
    const query = isAdmin && includeDrafts ? {} : { status: "published" as const };
    const docs = await col.find(query).sort({ createdAt: -1 }).toArray();
    return { success: true, data: docs.map(serializeGuide) };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "Failed to load guides" };
  }
}

// ── getPublishedGuideBySlug ──────────────────────────────────────────────────

export async function getPublishedGuideBySlug(slug: string): Promise<ActionResult<PublishedGuide | null>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const col = await getPublishedGuidesCollection();
    const doc = await col.findOne({ slug });
    if (!doc) return { success: true, data: null };

    // Non-admins cannot see drafts
    if (doc.status === "draft" && session.user.role !== "admin") {
      return { success: true, data: null };
    }

    return { success: true, data: serializeGuide(doc) };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "Failed to load guide" };
  }
}

// ── updatePublishedGuide ─────────────────────────────────────────────────────

export async function updatePublishedGuide(
  id: string,
  updates: { title?: string; content?: PublishedGuideContent }
): Promise<ActionResult<PublishedGuide>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== "admin") return { success: false, error: "Admin access required" };

  try {
    const col = await getPublishedGuidesCollection();
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (updates.title !== undefined) set.title = updates.title;
    if (updates.content !== undefined) set.content = updates.content;

    await col.updateOne({ _id: new ObjectId(id) }, { $set: set });
    const doc = await col.findOne({ _id: new ObjectId(id) });
    if (!doc) return { success: false, error: "Guide not found" };

    revalidatePath("/admin");
    revalidatePath(`/training/guides/${doc.slug}`);
    return { success: true, data: serializeGuide(doc) };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "Failed to update guide" };
  }
}

// ── publishGuide ─────────────────────────────────────────────────────────────

export async function publishGuide(id: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== "admin") return { success: false, error: "Admin access required" };

  try {
    const col = await getPublishedGuidesCollection();
    const doc = await col.findOne({ _id: new ObjectId(id) });
    if (!doc) return { success: false, error: "Guide not found" };

    await col.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "published", publishedAt: new Date(), updatedAt: new Date() } }
    );

    revalidatePath("/admin");
    revalidatePath("/training/guides");
    revalidatePath(`/training/guides/${doc.slug}`);
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "Failed to publish guide" };
  }
}

// ── unpublishGuide ───────────────────────────────────────────────────────────

export async function unpublishGuide(id: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== "admin") return { success: false, error: "Admin access required" };

  try {
    const col = await getPublishedGuidesCollection();
    const doc = await col.findOne({ _id: new ObjectId(id) });
    if (!doc) return { success: false, error: "Guide not found" };

    await col.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "draft", updatedAt: new Date() }, $unset: { publishedAt: "" } }
    );

    revalidatePath("/admin");
    revalidatePath("/training/guides");
    revalidatePath(`/training/guides/${doc.slug}`);
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "Failed to unpublish guide" };
  }
}

// ── deletePublishedGuide ─────────────────────────────────────────────────────

export async function deletePublishedGuide(id: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== "admin") return { success: false, error: "Admin access required" };

  try {
    const col = await getPublishedGuidesCollection();
    await col.deleteOne({ _id: new ObjectId(id) });

    revalidatePath("/admin");
    revalidatePath("/training/guides");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "Failed to delete guide" };
  }
}
