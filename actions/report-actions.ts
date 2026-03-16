"use server";

import { auth } from "@/auth";
import { getSessionsCollection, getSetsCollection, getCardioSessionsCollection } from "@/lib/db";
import type { ActionResult, BodyTarget } from "@/types";

export interface BodyTargetStat {
  sessions: number;
  volumeLb: number;
}

export interface TopExercise {
  name: string;
  volumeLb: number;
  sets: number;
}

export interface MonthlyReport {
  year: number;
  month: number;          // 1-based
  daysInMonth: number;
  activeDays: number;
  consistencyPct: number;
  totalSessions: number;
  totalVolumeLb: number;
  totalSets: number;
  byBodyTarget: Partial<Record<BodyTarget, BodyTargetStat>>;
  topExercises: TopExercise[];
  totalCardioSessions: number;
  totalCardioMinutes: number;
  totalCaloriesBurned: number;
}

function toLb(weight: number, unit: string): number {
  return unit === "kg" ? weight * 2.20462 : weight;
}

export async function getMonthlyReport(
  year: number,
  month: number // 1-based
): Promise<ActionResult<MonthlyReport>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const userId = session.user.id;

  // UTC month boundaries
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end   = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  try {
    const [sessionsCol, setsCol, cardioCol] = await Promise.all([
      getSessionsCollection(),
      getSetsCollection(),
      getCardioSessionsCollection(),
    ]);

    const [sessionDocs, cardioDocs] = await Promise.all([
      sessionsCol.find({ userId, date: { $gte: start, $lt: end } }).toArray(),
      cardioCol.find({ userId, date: { $gte: start, $lt: end } }).toArray(),
    ]);

    const sessionIds = sessionDocs.map((d) => d._id.toHexString());
    const setDocs = sessionIds.length > 0
      ? await setsCol.find({ sessionId: { $in: sessionIds }, completed: true }).toArray()
      : [];

    // Active days (unique calendar dates with a workout or cardio session)
    const activeDateSet = new Set<string>();
    for (const s of sessionDocs) activeDateSet.add(s.date.toISOString().slice(0, 10));
    for (const c of cardioDocs) activeDateSet.add(c.date.toISOString().slice(0, 10));
    const activeDays = activeDateSet.size;

    // Volume by session
    const sessionTargetMap = new Map(sessionDocs.map((d) => [d._id.toHexString(), d.bodyTarget]));
    const byBodyTarget: Partial<Record<BodyTarget, BodyTargetStat>> = {};
    const byExercise = new Map<string, { volumeLb: number; sets: number }>();
    let totalVolumeLb = 0;

    for (const s of setDocs) {
      const lb = toLb(s.weight, s.weightUnit ?? "lb") * s.reps;
      totalVolumeLb += lb;

      const target = sessionTargetMap.get(s.sessionId);
      if (target) {
        const entry = byBodyTarget[target] ?? { sessions: 0, volumeLb: 0 };
        entry.volumeLb += lb;
        byBodyTarget[target] = entry;
      }

      const ex = byExercise.get(s.exercise) ?? { volumeLb: 0, sets: 0 };
      ex.volumeLb += lb;
      ex.sets++;
      byExercise.set(s.exercise, ex);
    }

    // Count unique sessions per body target
    for (const doc of sessionDocs) {
      const entry = byBodyTarget[doc.bodyTarget] ?? { sessions: 0, volumeLb: 0 };
      entry.sessions++;
      byBodyTarget[doc.bodyTarget] = entry;
    }

    // Round volumes
    for (const key of Object.keys(byBodyTarget) as BodyTarget[]) {
      byBodyTarget[key]!.volumeLb = Math.round(byBodyTarget[key]!.volumeLb);
    }

    const topExercises: TopExercise[] = [...byExercise.entries()]
      .map(([name, { volumeLb, sets }]) => ({ name, volumeLb: Math.round(volumeLb), sets }))
      .sort((a, b) => b.volumeLb - a.volumeLb)
      .slice(0, 5);

    // Cardio totals
    const totalCardioMinutes = cardioDocs.reduce((s, c) => s + c.duration, 0);
    const totalCaloriesBurned = cardioDocs.reduce((s, c) => s + (c.caloriesBurned ?? 0), 0);

    return {
      success: true,
      data: {
        year,
        month,
        daysInMonth,
        activeDays,
        consistencyPct: Math.round((activeDays / daysInMonth) * 100),
        totalSessions: sessionDocs.length,
        totalVolumeLb: Math.round(totalVolumeLb),
        totalSets: setDocs.length,
        byBodyTarget,
        topExercises,
        totalCardioSessions: cardioDocs.length,
        totalCardioMinutes,
        totalCaloriesBurned: Math.round(totalCaloriesBurned),
      },
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
