"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getProgressPhotosCollection } from "@/lib/db";
import type { ActionResult, ProgressPhoto } from "@/types";

export async function addProgressPhoto(
  photoUrl: string,
  date: string,
  notes?: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  if (!photoUrl) return { success: false, error: "Photo URL required" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, error: "Invalid date" };

  const col = await getProgressPhotosCollection();
  const _id = new ObjectId();
  await col.insertOne({
    _id,
    userId: session.user.id,
    photoUrl,
    date,
    notes: notes || undefined,
    createdAt: new Date(),
  });

  return { success: true, data: { id: _id.toHexString() } };
}

export async function deleteProgressPhoto(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return { success: false, error: "Invalid photo ID" };
  }

  const col = await getProgressPhotosCollection();
  await col.deleteOne({ _id: objectId, userId: session.user.id });

  return { success: true, data: undefined };
}

export async function getProgressPhotos(): Promise<ActionResult<ProgressPhoto[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getProgressPhotosCollection();
  const docs = await col
    .find({ userId: session.user.id })
    .sort({ date: -1 })
    .toArray();

  return {
    success: true,
    data: docs.map((d) => ({
      id: d._id.toHexString(),
      photoUrl: d.photoUrl,
      date: d.date,
      notes: d.notes,
      createdAt: d.createdAt.toISOString(),
    })),
  };
}
