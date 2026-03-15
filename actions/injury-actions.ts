"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getInjuriesCollection } from "@/lib/db";
import type { ActionResult, Injury, InjuryDoc, MuscleGroup, SeverityLevel } from "@/types";

interface LogInjuryInput {
  muscleGroup: MuscleGroup;
  severity: SeverityLevel;
  startDate: string;
  expectedRecoveryDate?: string;
  notes?: string;
}

export async function logInjury(data: LogInjuryInput): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  if (!data.muscleGroup) return { success: false, error: "Muscle group is required" };
  if (!data.severity) return { success: false, error: "Severity is required" };
  if (!data.startDate) return { success: false, error: "Start date is required" };

  const col = await getInjuriesCollection();
  const _id = new ObjectId();
  await col.insertOne({
    _id,
    userId: session.user.id,
    muscleGroup: data.muscleGroup,
    severity: data.severity,
    startDate: data.startDate,
    expectedRecoveryDate: data.expectedRecoveryDate || undefined,
    notes: data.notes || undefined,
    createdAt: new Date(),
  } as InjuryDoc);

  return { success: true, data: { id: _id.toHexString() } };
}

export async function getInjuries(): Promise<ActionResult<Injury[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const userId = session.user.id;
  const col = await getInjuriesCollection();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const docs = await col
    .find({
      userId,
      $or: [{ resolvedAt: { $exists: false } }, { resolvedAt: { $gte: thirtyDaysAgo } }],
    })
    .sort({ createdAt: -1 })
    .toArray();

  return {
    success: true,
    data: docs.map((d) => ({
      id: d._id.toHexString(),
      userId: d.userId,
      muscleGroup: d.muscleGroup,
      severity: d.severity,
      notes: d.notes,
      startDate: d.startDate,
      expectedRecoveryDate: d.expectedRecoveryDate,
      resolvedAt: d.resolvedAt?.toISOString(),
      createdAt: d.createdAt.toISOString(),
    })),
  };
}

export async function resolveInjury(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return { success: false, error: "Invalid injury ID" };
  }

  const col = await getInjuriesCollection();
  await col.updateOne(
    { _id: objectId, userId: session.user.id },
    { $set: { resolvedAt: new Date() } }
  );

  return { success: true, data: undefined };
}

export async function deleteInjury(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return { success: false, error: "Invalid injury ID" };
  }

  const col = await getInjuriesCollection();
  await col.deleteOne({ _id: objectId, userId: session.user.id });

  return { success: true, data: undefined };
}
