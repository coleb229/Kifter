"use server";

import Anthropic from "@anthropic-ai/sdk";
import { ObjectId } from "mongodb";
import { subDays, format } from "date-fns";
import { auth } from "@/auth";
import { getSessionsCollection, getSetsCollection, getSiteSettingsCollection, getUsersCollection, getAiUsageCollection } from "@/lib/db";
import { getAllUsers } from "@/actions/admin-actions";
import { getPosts } from "@/actions/post-actions";
import { getDietHistory, getMacroTargets } from "@/actions/diet-actions";
import { getIntegrationSettings } from "@/actions/settings-actions";
import type { ActionResult, AIInsight } from "@/types";

// ── Rate limiting ──────────────────────────────────────────────────────────────

async function checkAndIncrementAiUsage(userId: string): Promise<{ allowed: boolean; error?: string }> {
  const today = new Date().toISOString().slice(0, 10);
  const [settingsCol, usersCol, usageCol] = await Promise.all([
    getSiteSettingsCollection(),
    getUsersCollection(),
    getAiUsageCollection(),
  ]);

  const settings = await settingsCol.findOne({ _id: "global" });
  const rateLimits = settings?.aiRateLimits;

  // Rate limiting not configured or disabled — allow
  if (!rateLimits?.enabled) return { allowed: true };

  const userDoc = await usersCol.findOne(
    { _id: new ObjectId(userId) },
    { projection: { aiRateLimit: 1 } }
  );

  if (userDoc?.aiRateLimit?.disabled) {
    return { allowed: false, error: "AI features are disabled for your account." };
  }

  const usageDoc = await usageCol.findOne({ _id: `${userId}:${today}` });
  const userCount = usageDoc?.count ?? 0;

  // Check per-user limit (user override takes precedence over site default)
  const userLimit = userDoc?.aiRateLimit?.dailyLimit ?? rateLimits.defaultUserDailyLimit ?? 0;
  if (userLimit > 0 && userCount >= userLimit) {
    return { allowed: false, error: `Daily AI limit reached (${userLimit}/day). Resets at midnight.` };
  }

  // Check site-wide daily limit
  const siteLimit = rateLimits.sitewideDailyLimit ?? 0;
  if (siteLimit > 0) {
    const siteAgg = await usageCol.aggregate<{ total: number }>([
      { $match: { date: today } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]).next();
    if ((siteAgg?.total ?? 0) >= siteLimit) {
      return { allowed: false, error: "Site-wide AI limit reached for today. Try again tomorrow." };
    }
  }

  // Increment counter atomically
  await usageCol.updateOne(
    { _id: `${userId}:${today}` },
    { $inc: { count: 1 }, $set: { userId, date: today, updatedAt: new Date() } },
    { upsert: true }
  );

  return { allowed: true };
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function parseInsightsJSON(text: string): AIInsight[] {
  const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("No insights returned");
  return parsed as AIInsight[];
}

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("AI features are not configured.");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function getDefaultAiModel(): Promise<string> {
  const integrations = await getIntegrationSettings();
  return integrations?.anthropic?.defaultModel ?? "claude-sonnet-4-6";
}

// ── generateWorkoutInsights ───────────────────────────────────────────────────

export async function generateWorkoutInsights(): Promise<ActionResult<AIInsight[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const rateCheck = await checkAndIncrementAiUsage(session.user.id);
  if (!rateCheck.allowed) return { success: false, error: rateCheck.error ?? "AI request blocked." };

  try {
    const client = getClient();
    const userId = session.user.id;
    const cutoff = subDays(new Date(), 60);

    const sessionsCol = await getSessionsCollection();
    const setsCol = await getSetsCollection();

    const sessionDocs = await sessionsCol
      .find({ userId, date: { $gte: cutoff } })
      .sort({ date: -1 })
      .toArray();

    if (sessionDocs.length === 0) {
      return {
        success: false,
        error: "No workouts logged in the last 60 days. Log some sessions to unlock AI coaching.",
      };
    }

    // Build compact summary — minimize tokens
    const sessionSummaries = await Promise.all(
      sessionDocs.map(async (doc) => {
        const sessionId = doc._id.toHexString();
        const sets = await setsCol.find({ sessionId }).toArray();

        const exercises: Record<string, { sets: number; maxWeightLb: number; totalReps: number }> =
          {};
        for (const s of sets) {
          const weightLb = s.weightUnit === "kg" ? s.weight * 2.20462 : (s.weight ?? 0);
          if (!exercises[s.exercise]) {
            exercises[s.exercise] = { sets: 0, maxWeightLb: 0, totalReps: 0 };
          }
          exercises[s.exercise].sets++;
          exercises[s.exercise].totalReps += s.reps;
          exercises[s.exercise].maxWeightLb = Math.max(
            exercises[s.exercise].maxWeightLb,
            Math.round(weightLb * 10) / 10
          );
        }

        return {
          date: format(doc.date, "yyyy-MM-dd"),
          bodyTarget: doc.bodyTarget,
          ...(doc.name ? { name: doc.name } : {}),
          exercises,
        };
      })
    );

    const model = await getDefaultAiModel();
    const message = await client.messages.create({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a personal fitness coach analyzing a user's workout history.
Generate exactly 5 coaching insights as a JSON array — no markdown fences, no commentary.
Each object must have: { "type": "progress"|"suggestion"|"warning"|"achievement", "title": "5-8 words max", "body": "2-3 sentences referencing specific exercises and numbers from the data." }
Use "achievement" for PRs or milestones, "progress" for positive trends, "suggestion" for actionable advice, "warning" for imbalances or inactivity.

Today: ${format(new Date(), "yyyy-MM-dd")}
Workout data (last 60 days, most recent first, weights in lb):
${JSON.stringify(sessionSummaries, null, 2)}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return { success: true, data: parseInsightsJSON(text) };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "Failed to generate insights" };
  }
}

// ── generateAdminInsights ─────────────────────────────────────────────────────

export async function generateAdminInsights(): Promise<ActionResult<AIInsight[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== "admin") return { success: false, error: "Forbidden" };

  try {
    const client = getClient();

    const [usersResult, postsResult] = await Promise.all([getAllUsers(), getPosts()]);
    if (!usersResult.success) return { success: false, error: usersResult.error };

    const users = usersResult.data;
    const posts = postsResult.success ? postsResult.data.posts : [];

    const sessionsCol = await getSessionsCollection();
    const setsCol = await getSetsCollection();
    const last30 = subDays(new Date(), 30);

    const [totalSessions, sessionsLast30Days, totalSets] = await Promise.all([
      sessionsCol.countDocuments(),
      sessionsCol.countDocuments({ date: { $gte: last30 } }),
      setsCol.countDocuments(),
    ]);

    // Signups by month (last 6 months)
    const signupsByMonth: Record<string, number> = {};
    for (const u of users) {
      if (!u.createdAt) continue;
      const key = format(new Date(u.createdAt), "yyyy-MM");
      signupsByMonth[key] = (signupsByMonth[key] ?? 0) + 1;
    }

    const postsLast30Days = posts.filter(
      (p) => new Date(p.createdAt) >= last30
    ).length;

    const roleBreakdown = users.reduce(
      (acc, u) => { acc[u.role] = (acc[u.role] ?? 0) + 1; return acc; },
      {} as Record<string, number>
    );

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter((u) => !u.bannedAt).length,
      bannedUsers: users.filter((u) => !!u.bannedAt).length,
      roleBreakdown,
      signupsByMonth,
      totalPosts: posts.length,
      progressPosts: posts.filter((p) => p.type === "progress").length,
      generalPosts: posts.filter((p) => p.type === "general").length,
      postsLast30Days,
      totalSessions,
      sessionsLast30Days,
      totalSets,
    };

    const model = await getDefaultAiModel();
    const message = await client.messages.create({
      model,
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: `You are an app analytics expert analyzing platform usage for a fitness tracking app called Kifted.
Generate exactly 6 admin insights as a JSON array — no markdown fences, no commentary.
Each object must have: { "type": "progress"|"suggestion"|"warning"|"achievement", "title": "5-8 words max", "body": "2-3 sentences with specific numbers." }
Cover: user growth trends, engagement health, content activity, workout adoption, any concerns (churn, bans, low activity), and one forward-looking recommendation.
Do not reference individual users by name or email.

Today: ${format(new Date(), "yyyy-MM-dd")}
Platform stats:
${JSON.stringify(stats, null, 2)}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return { success: true, data: parseInsightsJSON(text) };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "Failed to generate insights" };
  }
}

// ── generateNutritionRecommendations ──────────────────────────────────────────

export async function generateNutritionRecommendations(): Promise<ActionResult<AIInsight[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const rateCheck = await checkAndIncrementAiUsage(session.user.id);
  if (!rateCheck.allowed) return { success: false, error: rateCheck.error ?? "AI request blocked." };

  try {
    const client = getClient();
    const userId = session.user.id;
    const cutoff = subDays(new Date(), 14);

    const [historyResult, targetsResult, sessionsResult] = await Promise.all([
      getDietHistory(14),
      getMacroTargets(),
      getSessionsCollection().then((col) =>
        col.find({ userId, date: { $gte: cutoff } }).sort({ date: -1 }).toArray()
      ),
    ]);

    if (!historyResult.success || historyResult.data.length === 0) {
      return {
        success: false,
        error: "No diet data found in the last 14 days. Log some meals to unlock AI nutrition tips.",
      };
    }

    const dietData = historyResult.data.map((d) => ({
      date: d.date,
      calories: Math.round(d.calories),
      protein: Math.round(d.protein),
      carbs: Math.round(d.carbs),
      fat: Math.round(d.fat),
    }));

    const targets = targetsResult.success ? targetsResult.data : null;
    const workoutDates = sessionsResult.map((s) => format(s.date, "yyyy-MM-dd"));

    const model = await getDefaultAiModel();
    const message = await client.messages.create({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a registered dietitian analyzing a user's recent nutrition and workout data.
Generate exactly 5 nutrition insights as a JSON array — no markdown fences, no commentary.
Each object must have: { "type": "progress"|"suggestion"|"warning"|"achievement", "title": "5-8 words max", "body": "2-3 sentences referencing specific numbers from the data." }
Focus on: calorie consistency, macro balance vs targets, protein adequacy relative to training days, hydration/micronutrient reminders, actionable meal improvements.

Today: ${format(new Date(), "yyyy-MM-dd")}
${targets ? `Macro targets: ${targets.calories} kcal, ${targets.protein}g protein, ${targets.carbs}g carbs, ${targets.fat}g fat` : "No macro targets set."}
Training days this period: ${workoutDates.join(", ") || "none"}
Diet history (last 14 days):
${JSON.stringify(dietData, null, 2)}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return { success: true, data: parseInsightsJSON(text) };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "Failed to generate nutrition tips" };
  }
}

// ── getExerciseSubstitutions ──────────────────────────────────────────────────

export interface ExerciseSubstitute {
  name: string;
  reason: string;
}

export async function getExerciseSubstitutions(
  exerciseName: string
): Promise<ActionResult<ExerciseSubstitute[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const rateCheck = await checkAndIncrementAiUsage(session.user.id);
  if (!rateCheck.allowed) return { success: false, error: rateCheck.error ?? "AI request blocked." };

  try {
    const client = getClient();
    const model = await getDefaultAiModel();
    const message = await client.messages.create({
      model,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are a fitness coach. The user wants alternatives to "${exerciseName}".
List 4 substitute exercises that work similar muscle groups.
For each, respond in exactly this format:
1. Exercise Name: One sentence explaining why it's a good substitute.
Be concise. No extra commentary.`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const lines = text.split("\n").filter((l) => /^\d+\./.test(l.trim()));
    const substitutes: ExerciseSubstitute[] = lines
      .map((line) => {
        const withoutNum = line.replace(/^\d+\.\s*/, "").trim();
        const colonIdx = withoutNum.indexOf(":");
        if (colonIdx === -1) return null;
        const name = withoutNum.slice(0, colonIdx).trim();
        const reason = withoutNum.slice(colonIdx + 1).trim();
        return name && reason ? { name, reason } : null;
      })
      .filter((s): s is ExerciseSubstitute => s !== null);

    if (substitutes.length === 0) return { success: false, error: "Could not parse substitutions" };
    return { success: true, data: substitutes };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "Failed to get substitutions" };
  }
}

// ── FormPrompt (shared) ───────────────────────────────────────────────────────

export interface FormPrompt {
  label: string;       // Short chip label shown in the UI
  text: string;        // Suggested text the user can append to the field
  targetField: string; // Form field key to append to
}

// ── generateBugReportPrompts ──────────────────────────────────────────────────

export async function generateBugReportPrompts(input: {
  title: string;
  category?: string;
  page?: string;
  description?: string;
}): Promise<ActionResult<FormPrompt[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const rateCheck = await checkAndIncrementAiUsage(session.user.id);
  if (!rateCheck.allowed) return { success: false, error: rateCheck.error ?? "AI request blocked." };

  try {
    const client = getClient();
    const model = await getDefaultAiModel();
    const message = await client.messages.create({
      model,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are helping a user fill out a bug report for a fitness tracking app called Kifted (Next.js/React/MongoDB).
IMPORTANT: This report will be read and acted on by Claude Code, an AI coding assistant. The text the user appends to each field will be fed directly into Claude Code as context when it goes to fix the bug. Write prompts that elicit technically precise, developer-useful information — specific component names, routes, data states, browser/device conditions, reproduction steps with exact actions, and observable vs expected behavior. Avoid vague filler; prefer concrete detail Claude Code can act on.
Given the bug title and context below, generate exactly 4 helpful prompts the user can append to specific fields to better describe the bug.
Respond ONLY with a JSON array — no markdown fences, no commentary.
Each object: { "label": "2-4 word chip label", "text": "Suggested text to append (1-3 sentences, first-person, technically specific)", "targetField": one of "description"|"steps"|"expectedBehavior"|"actualBehavior"|"impact"|"workaround" }

Bug title: ${input.title}
${input.category ? `Category: ${input.category}` : ""}
${input.page ? `Page/route: ${input.page}` : ""}
${input.description ? `Description so far: ${input.description}` : ""}`,
        },
      ],
    });
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("No prompts returned");
    return { success: true, data: parsed as FormPrompt[] };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "Failed to generate prompts" };
  }
}

// ── generateSuggestionPrompts ─────────────────────────────────────────────────

export async function generateSuggestionPrompts(input: {
  title: string;
  description?: string;
}): Promise<ActionResult<FormPrompt[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const rateCheck = await checkAndIncrementAiUsage(session.user.id);
  if (!rateCheck.allowed) return { success: false, error: rateCheck.error ?? "AI request blocked." };

  try {
    const client = getClient();
    const model = await getDefaultAiModel();
    const message = await client.messages.create({
      model,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are helping a user submit a feature suggestion for a fitness tracking app called Kifted (Next.js/React/MongoDB).
IMPORTANT: This suggestion will be read and implemented by Claude Code, an AI coding assistant. The text the user appends will be fed directly into Claude Code as implementation context. Write prompts that elicit technically actionable detail — specific UI flows, data shapes, API behavior, edge cases, and measurable success criteria that Claude Code can use to build the feature correctly. Avoid abstract wishes; prefer concrete specs, interaction patterns, and "done" definitions.
Given the suggestion title and context below, generate exactly 4 helpful prompts the user can append to specific fields to better articulate their idea.
Respond ONLY with a JSON array — no markdown fences, no commentary.
Each object: { "label": "2-4 word chip label", "text": "Suggested text to append (1-3 sentences, first-person, technically specific)", "targetField": one of "description"|"currentPainPoint"|"proposedSolution"|"useCase"|"successCriteria" }

Suggestion title: ${input.title}
${input.description ? `Description so far: ${input.description}` : ""}`,
        },
      ],
    });
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("No prompts returned");
    return { success: true, data: parsed as FormPrompt[] };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "Failed to generate prompts" };
  }
}

// ── generateGroceryList ───────────────────────────────────────────────────────

export interface GroceryCategory {
  category: string;
  items: string[];
}

export async function generateGroceryList(): Promise<ActionResult<GroceryCategory[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const rateCheck = await checkAndIncrementAiUsage(session.user.id);
  if (!rateCheck.allowed) return { success: false, error: rateCheck.error ?? "AI request blocked." };

  try {
    const client = getClient();
    const model = await getDefaultAiModel();

    const [targetsResult, historyResult] = await Promise.all([
      getMacroTargets(),
      getDietHistory(7),
    ]);

    const targets = targetsResult.success ? targetsResult.data : null;
    const history = historyResult.success ? historyResult.data : [];

    const avgCalories = history.length
      ? Math.round(history.reduce((s, d) => s + d.calories, 0) / history.length)
      : null;

    const targetSummary = targets
      ? `Daily targets: ${targets.calories} kcal, ${targets.protein}g protein, ${targets.carbs}g carbs, ${targets.fat}g fat.`
      : avgCalories
      ? `No explicit targets set; user averages ~${avgCalories} kcal/day based on recent logs.`
      : "No nutrition targets or history available.";

    const message = await client.messages.create({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a nutrition coach building a weekly grocery list.
${targetSummary}
Generate a practical grocery list organized by category that supports these macro targets.
Respond ONLY with a JSON array — no markdown fences, no commentary.
Each object: { "category": "string", "items": ["item1", "item2", ...] }
Use 6-8 categories (e.g. Proteins, Produce, Grains, Dairy, Fats & Oils, Snacks, Spices & Condiments).
Each category should have 4-7 specific items. Keep items concise (e.g. "Chicken breast (2 lbs)").`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const parsed: GroceryCategory[] = JSON.parse(cleaned);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty grocery list returned");
    return { success: true, data: parsed };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "Failed to generate grocery list" };
  }
}
