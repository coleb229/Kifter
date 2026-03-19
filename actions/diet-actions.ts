"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDietEntriesCollection, getDailyNutritionSummaryCollection, getMacroTargetsCollection, getBodyWeightCollection } from "@/lib/db";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import type {
  ActionResult,
  CreateDietEntryInput,
  DietDaySummary,
  DietEntry,
  MacroTarget,
  RecentFood,
  UpdateDietEntryInput,
} from "@/types";

// ── helpers ───────────────────────────────────────────────────────────────────

function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function parseDateRange(dateIso: string) {
  const [year, month, day] = dateIso.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return { start: startOfDay(d), end: endOfDay(d) };
}

// ── upsertDailyNutritionSummary ────────────────────────────────────────────────
// Fire-and-forget helper: recomputes and caches the daily macro totals for a user+date.

async function upsertDailyNutritionSummary(userId: string, dateStr: string) {
  try {
    const dietCol = await getDietEntriesCollection();
    const { start, end } = parseDateRange(dateStr);
    const [agg] = await dietCol.aggregate<{
      calories: number; protein: number; carbs: number; fat: number; entryCount: number;
    }>([
      { $match: { userId, date: { $gte: start, $lte: end } } },
      { $group: {
        _id: null,
        calories: { $sum: "$calories" },
        protein: { $sum: "$protein" },
        carbs: { $sum: "$carbs" },
        fat: { $sum: "$fat" },
        entryCount: { $sum: 1 },
      }},
    ]).toArray();

    const summaryCol = await getDailyNutritionSummaryCollection();
    await summaryCol.replaceOne(
      { _id: `${userId}:${dateStr}` },
      {
        userId,
        date: dateStr,
        calories: agg?.calories ?? 0,
        protein: agg?.protein ?? 0,
        carbs: agg?.carbs ?? 0,
        fat: agg?.fat ?? 0,
        entryCount: agg?.entryCount ?? 0,
        updatedAt: new Date(),
      } as unknown as import("@/types").DailyNutritionSummaryDoc,
      { upsert: true }
    );
  } catch {
    // Non-critical cache update — ignore errors
  }
}

// ── getDietEntries ─────────────────────────────────────────────────────────────

export async function getDietEntries(
  date?: string
): Promise<ActionResult<DietEntry[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;
  const dateKey = date ?? todayIso();
  const { start, end } = parseDateRange(dateKey);

  const col = await getDietEntriesCollection();
  const docs = await col
    .find({ userId, date: { $gte: start, $lte: end } })
    .sort({ createdAt: 1 })
    .toArray();

  const entries: DietEntry[] = docs.map((d) => ({
    id: d._id.toHexString(),
    userId: d.userId,
    date: d.date.toISOString(),
    mealType: d.mealType,
    food: d.food,
    calories: d.calories,
    protein: d.protein,
    carbs: d.carbs,
    fat: d.fat,
    notes: d.notes,
    createdAt: d.createdAt.toISOString(),
  }));

  return { success: true, data: entries };
}

// ── addDietEntry ──────────────────────────────────────────────────────────────

export async function addDietEntry(
  data: CreateDietEntryInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const { start } = parseDateRange(data.date);
  const col = await getDietEntriesCollection();
  const id = new ObjectId();
  await col.insertOne({
    _id: id,
    userId,
    date: start,
    mealType: data.mealType,
    food: data.food.trim(),
    calories: data.calories,
    protein: data.protein,
    carbs: data.carbs,
    fat: data.fat,
    notes: data.notes?.trim() || undefined,
    createdAt: new Date(),
  });

  upsertDailyNutritionSummary(userId, data.date);
  return { success: true, data: { id: id.toHexString() } };
}

// ── updateDietEntry ───────────────────────────────────────────────────────────

export async function updateDietEntry(
  id: string,
  data: UpdateDietEntryInput
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return { success: false, error: "Invalid entry ID" };
  }

  const col = await getDietEntriesCollection();
  const update: Record<string, unknown> = {};
  if (data.mealType !== undefined) update.mealType = data.mealType;
  if (data.food !== undefined) update.food = data.food.trim();
  if (data.calories !== undefined) update.calories = data.calories;
  if (data.protein !== undefined) update.protein = data.protein;
  if (data.carbs !== undefined) update.carbs = data.carbs;
  if (data.fat !== undefined) update.fat = data.fat;
  if (data.notes !== undefined) update.notes = data.notes.trim() || undefined;

  const existing = await col.findOne({ _id: objectId, userId });
  if (!existing) return { success: false, error: "Entry not found" };
  const result = await col.updateOne(
    { _id: objectId, userId },
    { $set: update }
  );
  if (result.matchedCount === 0) return { success: false, error: "Entry not found" };
  upsertDailyNutritionSummary(userId, format(existing.date, "yyyy-MM-dd"));
  return { success: true, data: undefined };
}

// ── deleteDietEntry ───────────────────────────────────────────────────────────

export async function deleteDietEntry(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return { success: false, error: "Invalid entry ID" };
  }

  const col = await getDietEntriesCollection();
  const existing = await col.findOne({ _id: objectId, userId });
  await col.deleteOne({ _id: objectId, userId });
  if (existing) upsertDailyNutritionSummary(userId, format(existing.date, "yyyy-MM-dd"));
  return { success: true, data: undefined };
}

// ── getMacroTargets ───────────────────────────────────────────────────────────

export async function getMacroTargets(): Promise<ActionResult<MacroTarget | null>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const col = await getMacroTargetsCollection();
  const doc = await col.findOne({ userId });
  if (!doc) return { success: true, data: null };

  return {
    success: true,
    data: {
      id: doc._id.toHexString(),
      userId: doc.userId,
      calories: doc.calories,
      protein: doc.protein,
      carbs: doc.carbs,
      fat: doc.fat,
      updatedAt: doc.updatedAt.toISOString(),
    },
  };
}

// ── setMacroTargets ───────────────────────────────────────────────────────────

export async function setMacroTargets(data: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const col = await getMacroTargetsCollection();
  await col.updateOne(
    { userId },
    {
      $set: {
        userId,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        updatedAt: new Date(),
      },
      $setOnInsert: { _id: new ObjectId() },
    },
    { upsert: true }
  );

  return { success: true, data: undefined };
}

// ── getDietDataYears ──────────────────────────────────────────────────────────

export async function getDietDataYears(): Promise<ActionResult<number[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const col = await getDietEntriesCollection();
  const docs = await col.find({ userId }, { projection: { date: 1 } }).toArray();
  const years = [...new Set(docs.map((d) => d.date.getFullYear()))].sort((a, b) => b - a);
  return { success: true, data: years };
}

// ── getDietMonthlyHistory ─────────────────────────────────────────────────────

export async function getDietMonthlyHistory(
  year: number
): Promise<ActionResult<DietDaySummary[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);

  const col = await getDietEntriesCollection();
  const docs = await col
    .find({ userId, date: { $gte: start, $lte: end } })
    .sort({ date: 1 })
    .toArray();

  // Group by calendar date first, then by month — returns avg daily values per month
  const byDay = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();
  for (const d of docs) {
    const key = format(d.date, "yyyy-MM-dd");
    const existing = byDay.get(key) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
    existing.calories += d.calories;
    existing.protein += d.protein;
    existing.carbs += d.carbs;
    existing.fat += d.fat;
    byDay.set(key, existing);
  }

  const byMonth = new Map<number, { totalCal: number; totalPro: number; totalCarb: number; totalFat: number; daysLogged: number }>();
  for (const [dateKey, dayData] of byDay) {
    const month = new Date(dateKey).getMonth();
    const existing = byMonth.get(month) ?? { totalCal: 0, totalPro: 0, totalCarb: 0, totalFat: 0, daysLogged: 0 };
    existing.totalCal += dayData.calories;
    existing.totalPro += dayData.protein;
    existing.totalCarb += dayData.carbs;
    existing.totalFat += dayData.fat;
    existing.daysLogged += 1;
    byMonth.set(month, existing);
  }

  const currentYear = new Date().getFullYear();
  const lastMonth = year === currentYear ? new Date().getMonth() : 11;

  const result: DietDaySummary[] = [];
  for (let m = 0; m <= lastMonth; m++) {
    const monthData = byMonth.get(m);
    if (!monthData || monthData.daysLogged === 0) {
      result.push({ date: format(new Date(year, m, 1), "yyyy-MM-dd"), calories: 0, protein: 0, carbs: 0, fat: 0, entryCount: 0 });
    } else {
      result.push({
        date: format(new Date(year, m, 1), "yyyy-MM-dd"),
        calories: monthData.totalCal / monthData.daysLogged,
        protein: monthData.totalPro / monthData.daysLogged,
        carbs: monthData.totalCarb / monthData.daysLogged,
        fat: monthData.totalFat / monthData.daysLogged,
        entryCount: monthData.daysLogged,
      });
    }
  }

  return { success: true, data: result };
}

// ── getDietHistory ────────────────────────────────────────────────────────────

export async function getDietHistory(
  days = 7
): Promise<ActionResult<DietDaySummary[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const now = new Date();
  const since = startOfDay(subDays(now, days - 1));

  const col = await getDietEntriesCollection();
  const docs = await col
    .find({ userId, date: { $gte: since } })
    .sort({ date: 1 })
    .toArray();

  // Group by date key
  const byDay = new Map<string, DietDaySummary>();
  for (const d of docs) {
    const key = format(d.date, "yyyy-MM-dd");
    if (!byDay.has(key)) {
      byDay.set(key, { date: key, calories: 0, protein: 0, carbs: 0, fat: 0, entryCount: 0 });
    }
    const summary = byDay.get(key)!;
    summary.calories += d.calories;
    summary.protein += d.protein;
    summary.carbs += d.carbs;
    summary.fat += d.fat;
    summary.entryCount += 1;
  }

  // Fill all days in range (even empty ones)
  const result: DietDaySummary[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = format(subDays(now, i), "yyyy-MM-dd");
    result.push(byDay.get(key) ?? { date: key, calories: 0, protein: 0, carbs: 0, fat: 0, entryCount: 0 });
  }

  return { success: true, data: result };
}

// ── getMacroAdherenceData ─────────────────────────────────────────────────────

export interface MacroAdherenceData {
  score: number; // 0–100 (% of logged days hitting calorie target ±10%)
  hitDays: number;
  loggedDays: number;
  chartData: { date: string; calories: number; protein: number; carbs: number; fat: number; target: number }[];
  insight: string;
}

export async function getMacroAdherenceData(): Promise<ActionResult<MacroAdherenceData>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const now = new Date();
  const DAYS = 28;
  const since = startOfDay(subDays(now, DAYS - 1));

  // Try precomputed summaries first
  const summaryCol = await getDailyNutritionSummaryCollection();
  const summaries = await summaryCol
    .find({ userId, date: { $gte: format(since, "yyyy-MM-dd") } })
    .sort({ date: 1 })
    .toArray();

  // Build day map from summaries or fall back to diet entries
  const dayMap = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();
  for (const s of summaries) {
    if (s.entryCount > 0) {
      dayMap.set(s.date, { calories: s.calories, protein: s.protein, carbs: s.carbs, fat: s.fat });
    }
  }

  // If summaries are empty (collection not yet populated), fall back to live aggregation
  if (dayMap.size === 0) {
    const dietCol = await getDietEntriesCollection();
    const docs = await dietCol.find({ userId, date: { $gte: since } }).toArray();
    for (const d of docs) {
      const key = format(d.date, "yyyy-MM-dd");
      const existing = dayMap.get(key) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
      existing.calories += d.calories;
      existing.protein += d.protein;
      existing.carbs += d.carbs;
      existing.fat += d.fat;
      dayMap.set(key, existing);
    }
  }

  // Get calorie target
  const macroCol = await getMacroTargetsCollection();
  const macroDoc = await macroCol.findOne({ userId });
  const calorieTarget = macroDoc?.calories ?? 0;

  // Build chart data (28 days)
  const chartData = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const key = format(subDays(now, i), "yyyy-MM-dd");
    const day = dayMap.get(key);
    chartData.push({
      date: key,
      calories: day?.calories ?? 0,
      protein: day?.protein ?? 0,
      carbs: day?.carbs ?? 0,
      fat: day?.fat ?? 0,
      target: calorieTarget,
    });
  }

  // Score: % of logged days hitting calorie target ±10%
  const loggedDays = chartData.filter((d) => d.calories > 0);
  const hitDays = calorieTarget > 0
    ? loggedDays.filter((d) => Math.abs(d.calories - calorieTarget) / calorieTarget <= 0.1).length
    : 0;
  const score = loggedDays.length > 0 && calorieTarget > 0
    ? Math.round((hitDays / loggedDays.length) * 100)
    : 0;

  const insight = calorieTarget === 0
    ? "Set a calorie target to track adherence."
    : loggedDays.length === 0
    ? "No nutrition logged in the past 28 days."
    : score >= 80
    ? `Great consistency — you hit your calorie target on ${hitDays} of ${loggedDays.length} logged days.`
    : score >= 50
    ? `You hit your calorie target on ${hitDays} of ${loggedDays.length} logged days — room to improve.`
    : `You hit your calorie target only ${hitDays} of ${loggedDays.length} logged days this month.`;

  return { success: true, data: { score, hitDays, loggedDays: loggedDays.length, chartData, insight } };
}

// ── getMacroCorrelationData ───────────────────────────────────────────────────
// Returns daily calorie adherence % and body weight for correlating nutrition
// consistency with body composition changes over the last 90 days.

export interface MacroCorrelationPoint {
  date: string;
  calorieAdherence: number | null; // % of target (0–200)
  bodyWeight: number | null;
  weightUnit: string;
}

export async function getMacroCorrelationData(): Promise<ActionResult<MacroCorrelationPoint[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const DAYS = 90;
  const now = new Date();
  const since = subDays(now, DAYS - 1);
  const sinceStr = format(since, "yyyy-MM-dd");

  const [summaryCol, macroCol, bodyCol] = await Promise.all([
    getDailyNutritionSummaryCollection(),
    getMacroTargetsCollection(),
    getBodyWeightCollection(),
  ]);

  const [summaries, macroDoc, bodyDocs] = await Promise.all([
    summaryCol.find({ userId, date: { $gte: sinceStr } }).sort({ date: 1 }).toArray(),
    macroCol.findOne({ userId }),
    bodyCol.find({ userId, date: { $gte: sinceStr } }).sort({ date: 1 }).toArray(),
  ]);

  const calorieTarget = macroDoc?.calories ?? 0;

  const nutritionMap = new Map<string, number>();
  for (const s of summaries) {
    if (s.entryCount > 0 && calorieTarget > 0) {
      nutritionMap.set(s.date, (s.calories / calorieTarget) * 100);
    }
  }

  const weightMap = new Map<string, { weight: number; unit: string }>();
  for (const b of bodyDocs) {
    const key = typeof b.date === "string" ? b.date.slice(0, 10) : format(b.date as Date, "yyyy-MM-dd");
    weightMap.set(key, { weight: b.weight, unit: b.weightUnit ?? "lb" });
  }

  const points: MacroCorrelationPoint[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const key = format(subDays(now, i), "yyyy-MM-dd");
    const adherence = nutritionMap.get(key) ?? null;
    const bw = weightMap.get(key);
    if (adherence !== null || bw) {
      points.push({
        date: key,
        calorieAdherence: adherence,
        bodyWeight: bw?.weight ?? null,
        weightUnit: bw?.unit ?? "lb",
      });
    }
  }

  return { success: true, data: points };
}

// ── getRecentFoods ────────────────────────────────────────────────────────────
// Returns the user's N most recently logged unique foods across all days.

export async function getRecentFoods(limit = 8): Promise<ActionResult<RecentFood[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const col = await getDietEntriesCollection();
  const docs = await col
    .aggregate<{ _id: string; calories: number; protein: number; carbs: number; fat: number; mealType: string; lastUsed: Date }>([
      { $match: { userId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$food",
          calories: { $first: "$calories" },
          protein: { $first: "$protein" },
          carbs: { $first: "$carbs" },
          fat: { $first: "$fat" },
          mealType: { $first: "$mealType" },
          lastUsed: { $first: "$createdAt" },
        },
      },
      { $sort: { lastUsed: -1 } },
      { $limit: limit },
    ])
    .toArray();

  return {
    success: true,
    data: docs.map((d) => ({
      name: d._id,
      calories: d.calories,
      protein: d.protein,
      carbs: d.carbs,
      fat: d.fat,
      mealType: d.mealType as RecentFood["mealType"],
      lastUsed: d.lastUsed.toISOString(),
    })),
  };
}

// ── copyDietDay ────────────────────────────────────────────────────────────────

export async function copyDietDay(
  fromDate: string,
  toDate: string
): Promise<ActionResult<{ copied: number }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const { start: fromStart, end: fromEnd } = parseDateRange(fromDate);
  const { start: toStart } = parseDateRange(toDate);

  const col = await getDietEntriesCollection();
  const sourceDocs = await col
    .find({ userId, date: { $gte: fromStart, $lte: fromEnd } })
    .toArray();

  if (sourceDocs.length === 0) return { success: true, data: { copied: 0 } };

  const now = new Date();
  const clones = sourceDocs.map((d) => ({
    _id: new ObjectId(),
    userId: d.userId,
    date: toStart,
    mealType: d.mealType,
    food: d.food,
    calories: d.calories,
    protein: d.protein,
    carbs: d.carbs,
    fat: d.fat,
    notes: d.notes,
    createdAt: now,
  }));

  await col.insertMany(clones);
  return { success: true, data: { copied: clones.length } };
}
