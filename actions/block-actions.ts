"use server";

import { auth } from "@/auth";
import { getUserBlocksCollection } from "@/lib/db";
import type { ActionResult } from "@/types";

export async function blockUser(blockedId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.id === blockedId) return { success: false, error: "Cannot block yourself" };

  try {
    const col = await getUserBlocksCollection();
    await col.updateOne(
      { blockerId: session.user.id, blockedId },
      { $setOnInsert: { blockerId: session.user.id, blockedId, createdAt: new Date() } },
      { upsert: true }
    );
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to block user" };
  }
}

export async function unblockUser(blockedId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const col = await getUserBlocksCollection();
    await col.deleteOne({ blockerId: session.user.id, blockedId });
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to unblock user" };
  }
}

export async function getBlockedUserIds(): Promise<string[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    const col = await getUserBlocksCollection();
    const blocks = await col.find({ blockerId: session.user.id }, { projection: { blockedId: 1 } }).toArray();
    return blocks.map((b) => b.blockedId);
  } catch {
    return [];
  }
}
