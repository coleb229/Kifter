"use server";

import { ObjectId } from "mongodb";
import { format, subDays, parseISO, startOfDay, endOfDay } from "date-fns";
import { auth } from "@/auth";
import { getCardioSessionsCollection } from "@/lib/db";
import type {
  ActionResult,
  CardioSession,
  CardioWeekSummary,
  CreateCardioSessionInput,
  UpdateCardioSessionInput,
} from "@/types";

function serializeSession(doc: {
  _id: ObjectId;
  userId: string;
  date: Date;
  activityType: import("@/types").CardioActivity;
  duration: number;
  distance?: number;
  distanceUnit?: "km" | "mi";
  intensity: import("@/types").CardioIntensity;
  caloriesBurned?: number;
  avgHeartRate?: number;
  notes?: string;
  createdAt: Date;
}): CardioSession {
  return {
    id: doc._id.toHexString(),
    userId: doc.userId,
    date: doc.date.toISOString(),
    activityType: doc.activityType,
    duration: doc.duration,
    distance: doc.distance ?? undefined,
    distanceUnit: doc.distanceUnit ?? undefined,
    intensity: doc.intensity,
    caloriesBurned: doc.caloriesBurned ?? undefined,
    avgHeartRate: doc.avgHeartRate ?? undefined,
    notes: doc.notes ?? undefined,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function getCardioSessions(
  limit = 50
): Promise<ActionResult<CardioSession[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getCardioSessionsCollection();
  const docs = await col
    .find({ userId: session.user.id })
    .sort({ date: -1 })
    .limit(limit)
    .toArray();

  return { success: true, data: docs.map(serializeSession) };
}

export async function getCardioSession(
  id: string
): Promise<ActionResult<CardioSession>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return { success: false, error: "Invalid session ID" };
  }

  const col = await getCardioSessionsCollection();
  const doc = await col.findOne({ _id: objectId, userId: session.user.id });
  if (!doc) return { success: false, error: "Session not found" };

  return { success: true, data: serializeSession(doc) };
}

export async function addCardioSession(
  data: CreateCardioSessionInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getCardioSessionsCollection();
  const id = new ObjectId();
  await col.insertOne({
    _id: id,
    userId: session.user.id,
    date: parseISO(data.date),
    activityType: data.activityType,
    duration: data.duration,
    distance: data.distance,
    distanceUnit: data.distanceUnit,
    intensity: data.intensity,
    caloriesBurned: data.caloriesBurned,
    avgHeartRate: data.avgHeartRate,
    notes: data.notes,
    createdAt: new Date(),
  });

  return { success: true, data: { id: id.toHexString() } };
}

export async function updateCardioSession(
  id: string,
  data: UpdateCardioSessionInput
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return { success: false, error: "Invalid session ID" };
  }

  const update: Partial<{
    date: Date;
    activityType: import("@/types").CardioActivity;
    duration: number;
    distance: number | undefined;
    distanceUnit: "km" | "mi" | undefined;
    intensity: import("@/types").CardioIntensity;
    caloriesBurned: number | undefined;
    avgHeartRate: number | undefined;
    notes: string | undefined;
  }> = {};
  if (data.date !== undefined) update.date = parseISO(data.date);
  if (data.activityType !== undefined) update.activityType = data.activityType;
  if (data.duration !== undefined) update.duration = data.duration;
  if (data.distance !== undefined) update.distance = data.distance;
  if (data.distanceUnit !== undefined) update.distanceUnit = data.distanceUnit;
  if (data.intensity !== undefined) update.intensity = data.intensity;
  if (data.caloriesBurned !== undefined) update.caloriesBurned = data.caloriesBurned;
  if (data.avgHeartRate !== undefined) update.avgHeartRate = data.avgHeartRate;
  if (data.notes !== undefined) update.notes = data.notes;

  const col = await getCardioSessionsCollection();
  const result = await col.updateOne(
    { _id: objectId, userId: session.user.id },
    { $set: update }
  );

  if (result.matchedCount === 0) {
    return { success: false, error: "Session not found" };
  }

  return { success: true, data: undefined };
}

export async function deleteCardioSession(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return { success: false, error: "Invalid session ID" };
  }

  const col = await getCardioSessionsCollection();
  const result = await col.deleteOne({ _id: objectId, userId: session.user.id });
  if (result.deletedCount === 0) {
    return { success: false, error: "Session not found" };
  }

  return { success: true, data: undefined };
}

export async function getCardioHistory(
  days = 7
): Promise<ActionResult<CardioWeekSummary[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const today = new Date();
  const start = startOfDay(subDays(today, days - 1));
  const end = endOfDay(today);

  const col = await getCardioSessionsCollection();
  const docs = await col
    .find({
      userId: session.user.id,
      date: { $gte: start, $lte: end },
    })
    .toArray();

  // Build a map of date → aggregated stats
  const byDay = new Map<string, CardioWeekSummary>();

  // Pre-fill all days
  for (let i = days - 1; i >= 0; i--) {
    const key = format(subDays(today, i), "yyyy-MM-dd");
    byDay.set(key, { date: key, totalMinutes: 0, sessionCount: 0, totalDistance: 0 });
  }

  for (const doc of docs) {
    const key = format(doc.date, "yyyy-MM-dd");
    const entry = byDay.get(key);
    if (!entry) continue;
    entry.totalMinutes += doc.duration;
    entry.sessionCount += 1;
    if (doc.distance) {
      // Normalize to km
      const km = doc.distanceUnit === "mi" ? doc.distance * 1.60934 : doc.distance;
      entry.totalDistance += km;
    }
  }

  return { success: true, data: Array.from(byDay.values()) };
}
