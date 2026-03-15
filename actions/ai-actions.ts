"use server";

import Anthropic from "@anthropic-ai/sdk";
import { subDays, format } from "date-fns";
import { auth } from "@/auth";
import { getSessionsCollection, getSetsCollection } from "@/lib/db";
import { getAllUsers } from "@/actions/admin-actions";
import { getPosts } from "@/actions/post-actions";
import type { ActionResult, AIInsight } from "@/types";

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

// ── generateWorkoutInsights ───────────────────────────────────────────────────

export async function generateWorkoutInsights(): Promise<ActionResult<AIInsight[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

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

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
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
    const posts = postsResult.success ? postsResult.data : [];

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

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
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
