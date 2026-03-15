"use server";

import { auth } from "@/auth";
import { getUsersCollection, getSessionsCollection, getSetsCollection } from "@/lib/db";
import type { ActionResult } from "@/types";

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
