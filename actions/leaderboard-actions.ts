"use server";

import { auth } from "@/auth";
import { getUsersCollection, getSessionsCollection, getSetsCollection } from "@/lib/db";
import type { ActionResult, BodyTarget } from "@/types";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  profileImage?: string;
  weeklyVolumeLb: number; // sum of weight(lb) × reps
  sessionCount: number;
}

function startOfWeek(): Date {
  const d = new Date();
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getLeaderboard(): Promise<ActionResult<LeaderboardEntry[]>> {
  await auth(); // must be authenticated to view

  try {
    const usersCol = await getUsersCollection();
    const sessionsCol = await getSessionsCollection();
    const setsCol = await getSetsCollection();

    // Only opted-in users
    const users = await usersCol
      .find({ "preferences.showOnLeaderboard": true, bannedAt: { $exists: false } })
      .project<{ _id: import("mongodb").ObjectId; displayName?: string; name?: string; profileImage?: string; image?: string }>({
        displayName: 1, name: 1, profileImage: 1, image: 1,
      })
      .toArray();

    if (users.length === 0) return { success: true, data: [] };

    const monday = startOfWeek();
    const userIds = users.map((u) => u._id.toHexString());

    // Sessions this week for opted-in users
    const sessions = await sessionsCol
      .find({ userId: { $in: userIds }, date: { $gte: monday } })
      .project<{ _id: import("mongodb").ObjectId; userId: string }>({ userId: 1 })
      .toArray();

    const sessionIds = sessions.map((s) => s._id.toHexString());
    const sessionCountByUser = new Map<string, number>();
    for (const s of sessions) {
      sessionCountByUser.set(s.userId, (sessionCountByUser.get(s.userId) ?? 0) + 1);
    }

    // Sets for those sessions — calculate volume
    const volumeByUser = new Map<string, number>();
    if (sessionIds.length > 0) {
      const sets = await setsCol
        .find({ sessionId: { $in: sessionIds } })
        .project<{ userId: string; weight: number; weightUnit: string; reps: number }>({
          userId: 1, weight: 1, weightUnit: 1, reps: 1,
        })
        .toArray();

      for (const s of sets) {
        const weightLb = s.weightUnit === "kg" ? s.weight * 2.20462 : (s.weight ?? 0);
        volumeByUser.set(s.userId, (volumeByUser.get(s.userId) ?? 0) + weightLb * s.reps);
      }
    }

    const entries: LeaderboardEntry[] = users.map((u) => {
      const id = u._id.toHexString();
      return {
        rank: 0,
        userId: id,
        displayName: u.displayName ?? u.name ?? "Anonymous",
        profileImage: u.profileImage ?? u.image,
        weeklyVolumeLb: Math.round(volumeByUser.get(id) ?? 0),
        sessionCount: sessionCountByUser.get(id) ?? 0,
      };
    });

    // Sort by volume desc, then session count
    entries.sort((a, b) => b.weeklyVolumeLb - a.weeklyVolumeLb || b.sessionCount - a.sessionCount);
    entries.forEach((e, i) => { e.rank = i + 1; });

    return { success: true, data: entries };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ── getBodyTargetLeaderboard ──────────────────────────────────────────────────

export interface BodyTargetLeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  profileImage?: string;
  weeklyVolumeLb: number;
  sessionCount: number;
  bodyTarget: BodyTarget;
}

export async function getBodyTargetLeaderboard(
  bodyTarget: BodyTarget
): Promise<ActionResult<BodyTargetLeaderboardEntry[]>> {
  await auth();

  try {
    const usersCol = await getUsersCollection();
    const sessionsCol = await getSessionsCollection();
    const setsCol = await getSetsCollection();

    const users = await usersCol
      .find({ "preferences.showOnLeaderboard": true, bannedAt: { $exists: false } })
      .project<{ _id: import("mongodb").ObjectId; displayName?: string; name?: string; profileImage?: string; image?: string }>({
        displayName: 1, name: 1, profileImage: 1, image: 1,
      })
      .toArray();

    if (users.length === 0) return { success: true, data: [] };

    const monday = startOfWeek();
    const userIds = users.map((u) => u._id.toHexString());

    const sessions = await sessionsCol
      .find({ userId: { $in: userIds }, date: { $gte: monday }, bodyTarget })
      .project<{ _id: import("mongodb").ObjectId; userId: string }>({ userId: 1 })
      .toArray();

    const sessionIds = sessions.map((s) => s._id.toHexString());
    const sessionCountByUser = new Map<string, number>();
    for (const s of sessions) {
      sessionCountByUser.set(s.userId, (sessionCountByUser.get(s.userId) ?? 0) + 1);
    }

    const volumeByUser = new Map<string, number>();
    if (sessionIds.length > 0) {
      const sets = await setsCol
        .find({ sessionId: { $in: sessionIds } })
        .project<{ userId: string; weight: number; weightUnit: string; reps: number }>({
          userId: 1, weight: 1, weightUnit: 1, reps: 1,
        })
        .toArray();

      for (const s of sets) {
        const weightLb = s.weightUnit === "kg" ? s.weight * 2.20462 : (s.weight ?? 0);
        volumeByUser.set(s.userId, (volumeByUser.get(s.userId) ?? 0) + weightLb * s.reps);
      }
    }

    const entries: BodyTargetLeaderboardEntry[] = users
      .filter((u) => sessionCountByUser.has(u._id.toHexString()))
      .map((u) => {
        const id = u._id.toHexString();
        return {
          rank: 0,
          userId: id,
          displayName: u.displayName ?? u.name ?? "Anonymous",
          profileImage: u.profileImage ?? u.image,
          weeklyVolumeLb: Math.round(volumeByUser.get(id) ?? 0),
          sessionCount: sessionCountByUser.get(id) ?? 0,
          bodyTarget,
        };
      });

    entries.sort((a, b) => b.weeklyVolumeLb - a.weeklyVolumeLb || b.sessionCount - a.sessionCount);
    entries.forEach((e, i) => { e.rank = i + 1; });

    return { success: true, data: entries };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ── getExercisePRLeaderboard ──────────────────────────────────────────────────

export interface ExercisePREntry {
  rank: number;
  userId: string;
  displayName: string;
  profileImage?: string;
  maxWeightLb: number;
}

export async function getLeaderboardExercises(): Promise<ActionResult<string[]>> {
  await auth();
  try {
    const usersCol = await getUsersCollection();
    const setsCol = await getSetsCollection();

    const users = await usersCol
      .find({ "preferences.showOnLeaderboard": true, bannedAt: { $exists: false } })
      .project<{ _id: import("mongodb").ObjectId }>({ _id: 1 })
      .toArray();

    if (users.length < 2) return { success: true, data: [] };
    const userIds = users.map((u) => u._id.toHexString());

    const pipeline = [
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$exercise", userCount: { $addToSet: "$userId" } } },
      { $match: { "userCount.1": { $exists: true } } }, // at least 2 users
      { $sort: { _id: 1 } },
      { $project: { exercise: "$_id", _id: 0 } },
    ];

    const results = await setsCol.aggregate<{ exercise: string }>(pipeline).toArray();
    return { success: true, data: results.map((r) => r.exercise) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getExercisePRLeaderboard(
  exercise: string
): Promise<ActionResult<ExercisePREntry[]>> {
  await auth();

  try {
    const usersCol = await getUsersCollection();
    const setsCol = await getSetsCollection();

    const users = await usersCol
      .find({ "preferences.showOnLeaderboard": true, bannedAt: { $exists: false } })
      .project<{ _id: import("mongodb").ObjectId; displayName?: string; name?: string; profileImage?: string; image?: string }>({
        displayName: 1, name: 1, profileImage: 1, image: 1,
      })
      .toArray();

    if (users.length === 0) return { success: true, data: [] };
    const userIds = users.map((u) => u._id.toHexString());

    // Max weight (in lb) per user for this exercise
    const pipeline = [
      { $match: { exercise, userId: { $in: userIds } } },
      {
        $group: {
          _id: "$userId",
          maxWeightLb: {
            $max: {
              $cond: [
                { $eq: ["$weightUnit", "kg"] },
                { $multiply: ["$weight", 2.20462] },
                "$weight",
              ],
            },
          },
        },
      },
    ];

    const prResults = await setsCol.aggregate<{ _id: string; maxWeightLb: number }>(pipeline).toArray();
    const prMap = new Map(prResults.map((r) => [r._id, r.maxWeightLb]));

    const entries: ExercisePREntry[] = users
      .filter((u) => prMap.has(u._id.toHexString()))
      .map((u) => {
        const id = u._id.toHexString();
        return {
          rank: 0,
          userId: id,
          displayName: u.displayName ?? u.name ?? "Anonymous",
          profileImage: u.profileImage ?? u.image,
          maxWeightLb: Math.round(prMap.get(id) ?? 0),
        };
      });

    entries.sort((a, b) => b.maxWeightLb - a.maxWeightLb);
    entries.forEach((e, i) => { e.rank = i + 1; });

    return { success: true, data: entries };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
