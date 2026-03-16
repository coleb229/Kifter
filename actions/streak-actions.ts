"use server";

import { auth } from "@/auth";
import { getStreaksCollection } from "@/lib/db";
import type { ActionResult, Streak } from "@/types";

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00.000Z").getTime() - new Date(a + "T00:00:00.000Z").getTime()) /
      86_400_000
  );
}

export async function getStreak(): Promise<ActionResult<Streak>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getStreaksCollection();
  const doc = await col.findOne({ userId: session.user.id });

  if (!doc) {
    return {
      success: true,
      data: { currentStreak: 0, longestStreak: 0, lastWorkoutDate: "", freezeTokens: 0 },
    };
  }

  return {
    success: true,
    data: {
      currentStreak: doc.currentStreak,
      longestStreak: doc.longestStreak,
      lastWorkoutDate: doc.lastWorkoutDate,
      freezeTokens: doc.freezeTokens,
    },
  };
}

export async function updateStreak(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const userId = session.user.id;
  const today = todayUTC();
  const col = await getStreaksCollection();
  const doc = await col.findOne({ userId });

  if (!doc) {
    await col.insertOne({
      _id: new (await import("mongodb")).ObjectId(),
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastWorkoutDate: today,
      freezeTokens: 0,
      updatedAt: new Date(),
    });
    return;
  }

  if (doc.lastWorkoutDate === today) return; // already counted today

  const gap = daysBetween(doc.lastWorkoutDate, today);
  let { currentStreak, longestStreak, freezeTokens } = doc;

  if (gap === 1) {
    // Consecutive day
    currentStreak++;
    // Award a freeze token at every 7-day milestone (max 3)
    if (currentStreak % 7 === 0 && freezeTokens < 3) freezeTokens++;
  } else if (freezeTokens > 0) {
    // Use a freeze token to survive the gap
    freezeTokens--;
    currentStreak++;
  } else {
    // Streak broken
    currentStreak = 1;
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  await col.updateOne(
    { userId },
    { $set: { currentStreak, longestStreak, lastWorkoutDate: today, freezeTokens, updatedAt: new Date() } }
  );
}

export async function useStreakFreeze(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getStreaksCollection();
  const doc = await col.findOne({ userId: session.user.id });
  if (!doc || doc.freezeTokens <= 0) {
    return { success: false, error: "No freeze tokens available" };
  }

  // Extend lastWorkoutDate to today so streak won't break until tomorrow
  const today = todayUTC();
  await col.updateOne(
    { userId: session.user.id },
    { $inc: { freezeTokens: -1 }, $set: { lastWorkoutDate: today, updatedAt: new Date() } }
  );

  return { success: true, data: undefined };
}
