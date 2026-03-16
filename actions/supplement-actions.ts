"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getSupplementLogsCollection } from "@/lib/db";
import type { ActionResult, SupplementLog, SupplementTiming } from "@/types";

export async function addSupplementLog(data: {
  date: string;
  name: string;
  dosage: string;
  timing: SupplementTiming;
  notes?: string;
}): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getSupplementLogsCollection();
  const id = new ObjectId();
  await col.insertOne({
    _id: id,
    userId: session.user.id,
    ...data,
    createdAt: new Date(),
  });
  return { success: true, data: { id: id.toHexString() } };
}

export async function getSupplementLogs(date?: string): Promise<ActionResult<SupplementLog[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getSupplementLogsCollection();
  const query: Record<string, unknown> = { userId: session.user.id };
  if (date) query.date = date;

  const docs = await col
    .find(query)
    .sort({ date: -1, createdAt: -1 })
    .limit(500)
    .toArray();

  return {
    success: true,
    data: docs.map((d) => ({
      id: d._id.toHexString(),
      date: d.date,
      name: d.name,
      dosage: d.dosage,
      timing: d.timing,
      notes: d.notes,
      createdAt: d.createdAt.toISOString(),
    })),
  };
}

export async function deleteSupplementLog(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getSupplementLogsCollection();
  await col.deleteOne({ _id: new ObjectId(id), userId: session.user.id });
  return { success: true, data: undefined };
}

export async function getUniqueSupplementNames(): Promise<ActionResult<string[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getSupplementLogsCollection();
  const names = await col.distinct("name", { userId: session.user.id });
  return { success: true, data: names as string[] };
}
