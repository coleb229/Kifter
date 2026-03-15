"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import {
  getGoalsCollection,
  getSessionsCollection,
  getCardioSessionsCollection,
  getSetsCollection,
  getBodyWeightCollection,
} from "@/lib/db";
import type { ActionResult, Goal, GoalAlert, GoalDoc, GoalStatus, GoalType } from "@/types";

interface CreateGoalInput {
  type: GoalType;
  title: string;
  targetValue: number;
  unit: string;
  exerciseName?: string;
  targetDate?: string;
}

export async function createGoal(input: CreateGoalInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getGoalsCollection();
  const doc: GoalDoc = {
    _id: new ObjectId(),
    userId: session.user.id,
    type: input.type,
    title: input.title,
    targetValue: input.targetValue,
    unit: input.unit,
    exerciseName: input.exerciseName,
    status: "active",
    targetDate: input.targetDate,
    createdAt: new Date(),
  };
  await col.insertOne(doc);
  return { success: true, data: undefined };
}

export async function getGoals(): Promise<ActionResult<Goal[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getGoalsCollection();
  const docs = await col
    .find({ userId: session.user.id, status: { $in: ["active", "achieved"] } })
    .sort({ createdAt: -1 })
    .toArray();

  return {
    success: true,
    data: docs.map((d) => ({
      id: d._id.toHexString(),
      type: d.type,
      title: d.title,
      targetValue: d.targetValue,
      unit: d.unit,
      exerciseName: d.exerciseName,
      currentValue: d.currentValue,
      status: d.status,
      targetDate: d.targetDate,
      achievedAt: d.achievedAt?.toISOString(),
      createdAt: d.createdAt.toISOString(),
    })),
  };
}

export async function cancelGoal(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getGoalsCollection();
  await col.updateOne(
    { _id: new ObjectId(id), userId: session.user.id },
    { $set: { status: "cancelled" as GoalStatus } }
  );
  return { success: true, data: undefined };
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getGoalsCollection();
  await col.deleteOne({ _id: new ObjectId(id), userId: session.user.id });
  return { success: true, data: undefined };
}

export async function checkGoalProgress(): Promise<ActionResult<{ alerts: GoalAlert[] }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const userId = session.user.id;
  const col = await getGoalsCollection();
  const activeGoals = await col.find({ userId, status: "active" }).toArray();

  if (!activeGoals.length) return { success: true, data: { alerts: [] } };

  // Collect current values in parallel
  const [sessionsCol, cardioCol, setsCol, bodyCol] = await Promise.all([
    getSessionsCollection(),
    getCardioSessionsCollection(),
    getSetsCollection(),
    getBodyWeightCollection(),
  ]);

  const [workoutCount, cardioSessions, latestBodyWeight] = await Promise.all([
    sessionsCol.countDocuments({ userId }),
    cardioCol.find({ userId }).toArray(),
    bodyCol.findOne({ userId }, { sort: { date: -1 } }),
  ]);

  const totalCardioKm = cardioSessions.reduce((sum, s) => {
    if (!s.distance) return sum;
    return sum + (s.distanceUnit === "mi" ? s.distance * 1.60934 : s.distance);
  }, 0);

  const alerts: GoalAlert[] = [];

  for (const goal of activeGoals) {
    let current = 0;

    if (goal.type === "workout_count") {
      current = workoutCount;
    } else if (goal.type === "cardio_distance") {
      current = Math.round(totalCardioKm * 10) / 10;
    } else if (goal.type === "body_weight") {
      current = latestBodyWeight?.weight ?? 0;
    } else if (goal.type === "exercise_1rm" && goal.exerciseName) {
      const sets = await setsCol.find({ userId, exercise: goal.exerciseName }).toArray();
      let best = 0;
      for (const s of sets) {
        const wLb = s.weightUnit === "kg" ? s.weight * 2.20462 : s.weight;
        const epley = wLb * (1 + s.reps / 30);
        if (epley > best) best = epley;
      }
      current = Math.round(best * 10) / 10;
    }

    // Update cached value and potentially mark achieved
    const pct = goal.targetValue > 0 ? current / goal.targetValue : 0;
    const isAchieved = goal.type === "body_weight"
      ? current <= goal.targetValue  // weight loss goal: achieve when <= target
      : pct >= 1;

    if (isAchieved) {
      await col.updateOne(
        { _id: goal._id },
        { $set: { status: "achieved" as GoalStatus, currentValue: current, achievedAt: new Date() } }
      );
      alerts.push({ goalId: goal._id.toHexString(), title: goal.title, type: "achieved", progressPct: 1 });
    } else {
      await col.updateOne({ _id: goal._id }, { $set: { currentValue: current } });
      const displayPct = goal.type === "body_weight"
        ? Math.min(1, (goal.targetValue > 0 ? 1 - (current - goal.targetValue) / goal.targetValue : 0))
        : pct;
      if (displayPct >= 0.9) {
        alerts.push({ goalId: goal._id.toHexString(), title: goal.title, type: "approaching", progressPct: Math.round(displayPct * 100) / 100 });
      }
    }
  }

  return { success: true, data: { alerts } };
}
