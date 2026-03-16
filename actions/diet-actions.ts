"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDietEntriesCollection, getMacroTargetsCollection } from "@/lib/db";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import type {
  ActionResult,
  CreateDietEntryInput,
  DietDaySummary,
  DietEntry,
  MacroTarget,
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

  const result = await col.updateOne(
    { _id: objectId, userId },
    { $set: update }
  );
  if (result.matchedCount === 0) return { success: false, error: "Entry not found" };
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
  await col.deleteOne({ _id: objectId, userId });
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
