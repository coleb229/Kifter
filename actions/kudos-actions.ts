"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getPostKudosCollection } from "@/lib/db";
import type { ActionResult, KudosType } from "@/types";

export async function toggleKudos(
  postId: string,
  kudosType: KudosType
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const userId = session.user.id;
  const col = await getPostKudosCollection();

  const existing = await col.findOne({ postId, userId });

  if (existing) {
    if (existing.kudosType === kudosType) {
      // Same reaction → remove it
      await col.deleteOne({ _id: existing._id });
    } else {
      // Different reaction → replace it
      await col.updateOne({ _id: existing._id }, { $set: { kudosType, createdAt: new Date() } });
    }
  } else {
    await col.insertOne({
      _id: new ObjectId(),
      postId,
      userId,
      kudosType,
      createdAt: new Date(),
    });
  }

  return { success: true, data: undefined };
}
