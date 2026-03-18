"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getUsersCollection, getBodyWeightCollection } from "@/lib/db";
import type { ActionResult, UserSummary } from "@/types";

// ── Get current user (for settings prefill) ───────────────────────────────────

export async function getCurrentUser(): Promise<ActionResult<UserSummary>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const col = await getUsersCollection();
    const user = await col.findOne({ _id: new ObjectId(session.user.id) });
    if (!user) return { success: false, error: "User not found" };

    return {
      success: true,
      data: {
        id: user._id.toHexString(),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role ?? "member",
        bio: user.bio,
        displayName: user.displayName,
        profileImage: user.profileImage,
        profileImages: user.profileImages,
        preferences: user.preferences,
        restrictions: user.restrictions,
        bannedAt: user.bannedAt?.toISOString(),
        createdAt: user.createdAt?.toISOString(),
      },
    };
  } catch {
    return { success: false, error: "Failed to fetch user" };
  }
}

// ── Update last seen ─────────────────────────────────────────────────────────

export async function updateLastSeen(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  try {
    const col = await getUsersCollection();
    await col.updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { lastSeenAt: new Date() } }
    );
  } catch {
    // Non-critical — ignore errors
  }
}

// ── Update profile ────────────────────────────────────────────────────────────

export async function updateProfile(data: {
  displayName?: string;
  bio?: string;
  profileImage?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const update: Record<string, string> = {};
  if (data.displayName !== undefined) update.displayName = data.displayName.trim();
  if (data.bio !== undefined) update.bio = data.bio.trim().slice(0, 280);
  if (data.profileImage !== undefined) update.profileImage = data.profileImage;

  try {
    const col = await getUsersCollection();
    await col.updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: update }
    );
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to update profile" };
  }
}

// ── Update preferences ────────────────────────────────────────────────────────

export async function updatePreferences(data: {
  defaultWeightUnit?: "lb" | "kg";
  theme?: "light" | "dark" | "system";
  accentColor?: "indigo" | "violet" | "rose" | "emerald" | "amber";
  profileVisibility?: {
    showTraining?: boolean;
    showNutrition?: boolean;
    showCardio?: boolean;
    showBodyMetrics?: boolean;
  };
  showOnLeaderboard?: boolean;
  dashboardWidgets?: string[];
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const update: Record<string, unknown> = {};
  if (data.defaultWeightUnit) update["preferences.defaultWeightUnit"] = data.defaultWeightUnit;
  if (data.theme) update["preferences.theme"] = data.theme;
  if (data.accentColor) update["preferences.accentColor"] = data.accentColor;
  if (data.profileVisibility !== undefined) update["preferences.profileVisibility"] = data.profileVisibility;
  if (data.showOnLeaderboard !== undefined) update["preferences.showOnLeaderboard"] = data.showOnLeaderboard;
  if (data.dashboardWidgets !== undefined) update["preferences.dashboardWidgets"] = data.dashboardWidgets;

  if (Object.keys(update).length === 0) return { success: true, data: undefined };

  try {
    const col = await getUsersCollection();
    await col.updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: update }
    );
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to update preferences" };
  }
}

// ── Add profile image to history ──────────────────────────────────────────────

export async function addProfileImageToHistory(url: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const col = await getUsersCollection();
    const user = await col.findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { profileImages: 1 } }
    );
    const existing: string[] = user?.profileImages ?? [];
    const updated = [url, ...existing.filter((u) => u !== url)].slice(0, 10);
    await col.updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { profileImages: updated } }
    );
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to update image history" };
  }
}

// ── Get public profile ────────────────────────────────────────────────────────

export async function getPublicProfile(userId: string): Promise<ActionResult<{
  id: string;
  displayName?: string;
  name?: string;
  profileImage?: string;
  image?: string;
  bio?: string;
  role: import("@/types").UserRole;
  createdAt?: string;
  preferences?: {
    profileVisibility?: { showTraining?: boolean; showNutrition?: boolean; showCardio?: boolean; showBodyMetrics?: boolean };
  };
  latestWeight?: { weight: number; weightUnit: string; date: string };
}>> {
  try {
    const col = await getUsersCollection();
    const user = await col.findOne(
      { _id: new ObjectId(userId) },
      { projection: { name: 1, displayName: 1, bio: 1, profileImage: 1, image: 1, role: 1, createdAt: 1, "preferences.profileVisibility": 1 } }
    );
    if (!user) return { success: false, error: "User not found" };

    let latestWeight: { weight: number; weightUnit: string; date: string } | undefined;
    if (user.preferences?.profileVisibility?.showBodyMetrics) {
      const bwCol = await getBodyWeightCollection();
      const entry = await bwCol.findOne({ userId }, { sort: { date: -1 } });
      if (entry) {
        latestWeight = { weight: entry.weight, weightUnit: entry.weightUnit, date: String(entry.date).slice(0, 10) };
      }
    }

    return {
      success: true,
      data: {
        id: user._id.toHexString(),
        displayName: user.displayName,
        name: user.name,
        profileImage: user.profileImage,
        image: user.image,
        bio: user.bio,
        role: user.role ?? "member",
        createdAt: user.createdAt?.toISOString(),
        preferences: user.preferences ? { profileVisibility: user.preferences.profileVisibility } : undefined,
        latestWeight,
      },
    };
  } catch {
    return { success: false, error: "Failed to fetch profile" };
  }
}
