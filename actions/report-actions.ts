"use server";

import { auth } from "@/auth";
import { getSessionsCollection, getSetsCollection, getCardioSessionsCollection, getDietEntriesCollection } from "@/lib/db";
import type { ActionResult, BodyTarget, MealType } from "@/types";

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

// ── Diet weekly report ────────────────────────────────────────────────────────

export interface DietDaySummary {
  date: string; // "YYYY-MM-DD"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: { mealType: MealType; food: string; calories: number; protein: number; carbs: number; fat: number }[];
}

export interface DietWeekReport {
  year: number;
  weekNumber: number;
  startDate: string; // "YYYY-MM-DD" Monday
  endDate: string;   // "YYYY-MM-DD" Sunday
  days: DietDaySummary[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  avgCalories: number;
}

export async function getDietWeekReport(
  year: number,
  weekNumber: number // ISO week number 1–53
): Promise<ActionResult<DietWeekReport>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const userId = session.user.id;

  // Compute Mon–Sun for this ISO week
  const jan4 = new Date(Date.UTC(year, 0, 4)); // Jan 4 is always in week 1
  const weekStart = new Date(jan4);
  weekStart.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7) + (weekNumber - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

  const startDate = weekStart.toISOString().slice(0, 10);
  const endDate = new Date(weekEnd.getTime() - 1).toISOString().slice(0, 10);

  try {
    const col = await getDietEntriesCollection();
    const docs = await col.find({ userId, date: { $gte: weekStart, $lt: weekEnd } })
      .sort({ date: 1 })
      .toArray();

    // Group by day
    const byDay = new Map<string, DietDaySummary>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setUTCDate(weekStart.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, { date: key, calories: 0, protein: 0, carbs: 0, fat: 0, meals: [] });
    }

    for (const doc of docs) {
      const key = doc.date instanceof Date ? doc.date.toISOString().slice(0, 10) : String(doc.date).slice(0, 10);
      const day = byDay.get(key);
      if (!day) continue;
      day.calories += doc.calories;
      day.protein += doc.protein;
      day.carbs += doc.carbs;
      day.fat += doc.fat;
      day.meals.push({
        mealType: doc.mealType as MealType,
        food: doc.food,
        calories: doc.calories,
        protein: doc.protein,
        carbs: doc.carbs,
        fat: doc.fat,
      });
    }

    const days = [...byDay.values()];
    const loggedDays = days.filter((d) => d.meals.length > 0);
    const totalCalories = days.reduce((s, d) => s + d.calories, 0);
    const totalProtein = days.reduce((s, d) => s + d.protein, 0);
    const totalCarbs = days.reduce((s, d) => s + d.carbs, 0);
    const totalFat = days.reduce((s, d) => s + d.fat, 0);

    return {
      success: true,
      data: {
        year,
        weekNumber,
        startDate,
        endDate,
        days,
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein * 10) / 10,
        totalCarbs: Math.round(totalCarbs * 10) / 10,
        totalFat: Math.round(totalFat * 10) / 10,
        avgCalories: loggedDays.length > 0 ? Math.round(totalCalories / loggedDays.length) : 0,
      },
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
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
