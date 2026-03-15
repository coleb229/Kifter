"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getBodyWeightCollection } from "@/lib/db";
import type { ActionResult, BodyWeightEntry } from "@/types";
import type { WeightUnit } from "@/lib/weight";

export async function addBodyWeight(
  date: string,
  weight: number,
  weightUnit: WeightUnit,
  notes?: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getBodyWeightCollection();
  await col.insertOne({
    _id: new ObjectId(),
    userId: session.user.id,
    date,
    weight,
    weightUnit,
    notes,
    createdAt: new Date(),
  });
  return { success: true, data: undefined };
}

export async function getBodyWeightHistory(): Promise<ActionResult<BodyWeightEntry[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getBodyWeightCollection();
  const docs = await col
    .find({ userId: session.user.id })
    .sort({ date: 1 })
    .limit(90)
    .toArray();

  return {
    success: true,
    data: docs.map((d) => ({
      id: d._id.toHexString(),
      date: d.date,
      weight: d.weight,
      weightUnit: d.weightUnit,
      notes: d.notes,
      createdAt: d.createdAt.toISOString(),
    })),
  };
}

export async function deleteBodyWeight(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getBodyWeightCollection();
  await col.deleteOne({ _id: new ObjectId(id), userId: session.user.id });
  return { success: true, data: undefined };
}

export async function updateBodyWeight(
  id: string,
  weight: number,
  notes?: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getBodyWeightCollection();
  await col.updateOne(
    { _id: new ObjectId(id), userId: session.user.id },
    { $set: { weight, notes } }
  );
  return { success: true, data: undefined };
}
