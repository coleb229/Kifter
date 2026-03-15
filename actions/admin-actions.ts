"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getUsersCollection, getSessionsCollection, getSetsCollection, getDietEntriesCollection, getPostsCollection, getCardioSessionsCollection, getAiUsageCollection } from "@/lib/db";
import type { ActionResult, UserRole, UserSummary } from "@/types";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  if (session.user.role !== "admin") throw new Error("Forbidden");
  return session;
}

// ── Get all users ─────────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<ActionResult<UserSummary[]>> {
  try {
    await requireAdmin();
    const col = await getUsersCollection();
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();

    const users: UserSummary[] = docs.map((u) => ({
      id: u._id.toHexString(),
      name: u.name,
      email: u.email,
      image: u.image,
      role: u.role ?? "member",
      bio: u.bio,
      displayName: u.displayName,
      profileImage: u.profileImage,
      restrictions: u.restrictions,
      aiRateLimit: u.aiRateLimit,
      bannedAt: u.bannedAt?.toISOString(),
      createdAt: u.createdAt?.toISOString(),
    }));

    return { success: true, data: users };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ── Set user role ─────────────────────────────────────────────────────────────

export async function setUserRole(
  userId: string,
  role: UserRole
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    if (userId === session.user.id) {
      return { success: false, error: "Cannot change your own role" };
    }
    const col = await getUsersCollection();
    await col.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role } }
    );
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ── Toggle ban ────────────────────────────────────────────────────────────────

export async function toggleBan(userId: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    if (userId === session.user.id) {
      return { success: false, error: "Cannot ban yourself" };
    }
    const col = await getUsersCollection();
    const user = await col.findOne(
      { _id: new ObjectId(userId) },
      { projection: { bannedAt: 1 } }
    );
    if (!user) return { success: false, error: "User not found" };

    if (user.bannedAt) {
      await col.updateOne(
        { _id: new ObjectId(userId) },
        { $unset: { bannedAt: "" } }
      );
    } else {
      await col.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { bannedAt: new Date() } }
      );
    }
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ── Set user restrictions ──────────────────────────────────────────────────────

export async function setUserRestrictions(
  userId: string,
  restrictions: { training?: boolean; nutrition?: boolean; cardio?: boolean; community?: boolean }
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const col = await getUsersCollection();
    await col.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { restrictions } }
    );
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ── Get user data summary ──────────────────────────────────────────────────────

export async function getUserData(userId: string): Promise<ActionResult<{
  workoutSessions: number;
  dietEntries: number;
  cardioSessions: number;
  posts: number;
  todayAiUsage: number;
}>> {
  try {
    await requireAdmin();
    const today = new Date().toISOString().slice(0, 10);
    const [sessionsCol, dietCol, cardioCol, postsCol, usageCol] = await Promise.all([
      getSessionsCollection(),
      getDietEntriesCollection(),
      getCardioSessionsCollection(),
      getPostsCollection(),
      getAiUsageCollection(),
    ]);
    const [workoutSessions, dietEntries, cardioSessions, posts, usageDoc] = await Promise.all([
      sessionsCol.countDocuments({ userId }),
      dietCol.countDocuments({ userId }),
      cardioCol.countDocuments({ userId }),
      postsCol.countDocuments({ userId }),
      usageCol.findOne({ _id: `${userId}:${today}` }),
    ]);
    return { success: true, data: { workoutSessions, dietEntries, cardioSessions, posts, todayAiUsage: usageDoc?.count ?? 0 } };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ── AI rate limit controls ─────────────────────────────────────────────────────

export async function setUserAiRateLimit(
  userId: string,
  config: { dailyLimit?: number; disabled?: boolean }
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    if (userId === session.user.id) {
      return { success: false, error: "Cannot modify your own AI rate limit" };
    }
    const col = await getUsersCollection();
    await col.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { aiRateLimit: config } }
    );
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function resetUserAiUsage(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const today = new Date().toISOString().slice(0, 10);
    const usageCol = await getAiUsageCollection();
    await usageCol.deleteOne({ _id: `${userId}:${today}` });
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getAiUsageToday(): Promise<ActionResult<Array<{ userId: string; count: number }>>> {
  try {
    await requireAdmin();
    const today = new Date().toISOString().slice(0, 10);
    const usageCol = await getAiUsageCollection();
    const docs = await usageCol
      .find({ date: today })
      .sort({ count: -1 })
      .toArray();
    return {
      success: true,
      data: docs.map((d) => ({ userId: d.userId, count: d.count })),
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
