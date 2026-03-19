"use server";

import Anthropic from "@anthropic-ai/sdk";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getClaudeIdeasCollection } from "@/lib/db";
import { getIntegrationSettings } from "@/actions/settings-actions";
import type { ActionResult, ClaudeIdea, ClaudeIdeaStatus } from "@/types";

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("AI features are not configured.");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function getDefaultAiModel(): Promise<string> {
  const integrations = await getIntegrationSettings();
  return integrations?.anthropic?.defaultModel ?? "claude-sonnet-4-6";
}

const CATEGORY_PROMPTS: Record<string, string> = {
  "UI/UX": "Focus on user interface improvements, visual design, layout, accessibility, mobile responsiveness, and overall user experience.",
  "Performance": "Focus on page load times, server response times, database query optimization, caching strategies, and bundle size reduction.",
  "New Features": "Focus on new functionality that would add significant value for fitness tracking users, such as new tracking capabilities, integrations, or social features.",
  "Mobile": "Focus on mobile-specific improvements for the iOS/Android experience, including native app features, offline support, and touch interactions.",
  "Data & Analytics": "Focus on new charts, metrics, data visualizations, insights, and analytics that would help users better understand their fitness progress.",
};

interface GeneratedIdea {
  title: string;
  description: string;
}

export async function generateSiteIdeas(
  category: string,
  customMessage?: string
): Promise<ActionResult<GeneratedIdea[]>> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { success: false, error: "Unauthorized" };

  try {
    const client = getClient();
    const model = await getDefaultAiModel();
    const categoryContext = CATEGORY_PROMPTS[category] ?? "Focus on general improvements to the fitness tracking app.";

    const prompt = [
      `You are a senior product engineer reviewing a fitness tracking web app called Kifted. The app includes:`,
      `- Training session logging (exercises, sets, reps, weight)`,
      `- Cardio tracking with Apple Health integration`,
      `- Diet/nutrition logging with macro tracking`,
      `- Body measurements and progress photos`,
      `- Community feed, challenges, and leaderboards`,
      `- Dashboard with drag-and-drop widgets`,
      `- Admin panel with user management, bug reports, and feature suggestions`,
      ``,
      `Generate exactly 6 concrete, actionable improvement ideas for the following focus area:`,
      `**${category}**: ${categoryContext}`,
      customMessage ? `\nAdditional context from admin: ${customMessage}` : "",
      ``,
      `Return ONLY a JSON array (no markdown, no explanation) with exactly 6 objects, each with:`,
      `- "title": concise name (5-8 words)`,
      `- "description": specific implementation idea (2-3 sentences)`,
    ].join("\n");

    const response = await client.messages.create({
      model,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const ideas = JSON.parse(cleaned) as GeneratedIdea[];

    if (!Array.isArray(ideas) || ideas.length === 0) {
      return { success: false, error: "No ideas returned from AI." };
    }

    return { success: true, data: ideas };
  } catch (err) {
    console.error("Claude ideas generation error:", err);
    return { success: false, error: "Failed to generate ideas. Check your API key and try again." };
  }
}

export async function acceptClaudeIdea(
  title: string,
  description: string,
  category: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { success: false, error: "Unauthorized" };

  const col = await getClaudeIdeasCollection();
  const now = new Date();
  const result = await col.insertOne({
    _id: new ObjectId(),
    title,
    description,
    category,
    status: "accepted" as ClaudeIdeaStatus,
    generatedAt: now,
    acceptedAt: now,
  });

  return { success: true, data: { id: result.insertedId.toString() } };
}

export async function getClaudeIdeas(): Promise<ActionResult<ClaudeIdea[]>> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { success: false, error: "Unauthorized" };

  const col = await getClaudeIdeasCollection();
  const docs = await col.find({}).sort({ acceptedAt: -1 }).toArray();

  return {
    success: true,
    data: docs.map((d) => ({
      id: d._id.toString(),
      title: d.title,
      description: d.description,
      category: d.category,
      status: d.status,
      generatedAt: d.generatedAt.toISOString(),
      acceptedAt: d.acceptedAt?.toISOString(),
    })),
  };
}

export async function deleteClaudeIdea(id: string): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { success: false, error: "Unauthorized" };

  const col = await getClaudeIdeasCollection();
  await col.deleteOne({ _id: new ObjectId(id) });

  return { success: true, data: undefined };
}

export async function updateClaudeIdeaStatus(
  id: string,
  status: ClaudeIdeaStatus
): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { success: false, error: "Unauthorized" };

  const col = await getClaudeIdeasCollection();
  await col.updateOne({ _id: new ObjectId(id) }, { $set: { status } });

  return { success: true, data: undefined };
}
