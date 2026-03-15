"use server";

import { ObjectId } from "mongodb";
import { format } from "date-fns";
import { auth } from "@/auth";
import { getSessionsCollection, getSetsCollection } from "@/lib/db";
import type { ActionResult } from "@/types";
import type { WeightUnit } from "@/lib/weight";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SessionDataPoint {
  date: string;           // "Mar 5" — formatted for chart x-axis
  isoDate: string;        // full ISO string for PR date display
  sessionName?: string;
  maxWeightLb: number;    // max weight normalized to lb
  maxWeightRaw: number;   // max weight in its stored unit
  maxWeightUnit: WeightUnit;
  totalVolumeLb: number;  // sum(weightLb × reps) across all sets in session
  totalReps: number;      // sum of reps across all sets
  setCount: number;
  estimated1RM: number;   // Epley: weight × (1 + reps/30), in lb
}

function toLb(weight: number, unit: WeightUnit): number {
  return unit === "kg" ? weight * 2.20462 : weight;
}

// ── getExercisesWithHistory ────────────────────────────────────────────────────

export async function getExercisesWithHistory(): Promise<ActionResult<string[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const setsCol = await getSetsCollection();
  const names = await setsCol.distinct("exercise", { userId: session.user.id });
  names.sort((a, b) => a.localeCompare(b));

  return { success: true, data: names };
}

// ── getExerciseHistory ─────────────────────────────────────────────────────────

export async function getExerciseHistory(
  exerciseName: string
): Promise<ActionResult<SessionDataPoint[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const userId = session.user.id;
  const setsCol = await getSetsCollection();

  // Fetch all sets for this exercise, oldest first
  const sets = await setsCol
    .find({ userId, exercise: exerciseName })
    .sort({ createdAt: 1 })
    .toArray();

  if (sets.length === 0) return { success: true, data: [] };

  // Group by sessionId
  const grouped = new Map<string, typeof sets>();
  for (const set of sets) {
    if (!grouped.has(set.sessionId)) grouped.set(set.sessionId, []);
    grouped.get(set.sessionId)!.push(set);
  }

  // Fetch session docs for dates and names
  const sessionIds = Array.from(grouped.keys()).map((id) => {
    try { return new ObjectId(id); } catch { return null; }
  }).filter(Boolean) as ObjectId[];

  const sessionsCol = await getSessionsCollection();
  const sessionDocs = await sessionsCol
    .find({ _id: { $in: sessionIds } })
    .toArray();

  const sessionMap = new Map(
    sessionDocs.map((d) => [d._id.toHexString(), d])
  );

  // Build data points
  const points: SessionDataPoint[] = [];

  for (const [sessionId, sessionSets] of grouped) {
    const sessionDoc = sessionMap.get(sessionId);
    if (!sessionDoc) continue;

    let maxWeightLb = 0;
    let maxWeightRaw = 0;
    let maxWeightUnit: WeightUnit = "lb";
    let totalVolumeLb = 0;
    let totalReps = 0;
    let best1RM = 0;

    for (const set of sessionSets) {
      const unit: WeightUnit = set.weightUnit ?? "lb";
      const weightLb = toLb(set.weight, unit);
      const volume = weightLb * set.reps;
      const epley = weightLb * (1 + set.reps / 30);

      if (weightLb > maxWeightLb) {
        maxWeightLb = weightLb;
        maxWeightRaw = set.weight;
        maxWeightUnit = unit;
      }
      if (epley > best1RM) best1RM = epley;

      totalVolumeLb += volume;
      totalReps += set.reps;
    }

    points.push({
      date: format(sessionDoc.date, "MMM d"),
      isoDate: sessionDoc.date.toISOString(),
      sessionName: sessionDoc.name,
      maxWeightLb: Math.round(maxWeightLb * 10) / 10,
      maxWeightRaw,
      maxWeightUnit,
      totalVolumeLb: Math.round(totalVolumeLb),
      totalReps,
      setCount: sessionSets.length,
      estimated1RM: Math.round(best1RM * 10) / 10,
    });
  }

  // Sort by session date ascending
  points.sort((a, b) => new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime());

  return { success: true, data: points };
}
