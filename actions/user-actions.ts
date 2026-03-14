"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getUsersCollection } from "@/lib/db";
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
        preferences: user.preferences,
        bannedAt: user.bannedAt?.toISOString(),
        createdAt: user.createdAt?.toISOString(),
      },
    };
  } catch {
    return { success: false, error: "Failed to fetch user" };
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
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const update: Record<string, string> = {};
  if (data.defaultWeightUnit) {
    update["preferences.defaultWeightUnit"] = data.defaultWeightUnit;
  }

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
