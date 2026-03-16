"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getSessionsCollection, getSetsCollection, getDietEntriesCollection, getCardioSessionsCollection } from "@/lib/db";
import { getIntegrationSettings } from "@/actions/settings-actions";
import type { ActionResult, BodyTarget, CardioActivity, CardioSessionDoc, MealType, WorkoutSessionDoc, WorkoutSetDoc, DietEntryDoc } from "@/types";
import { BODY_TARGETS, MEAL_TYPES } from "@/types";

function parseCsvRows(csv: string): string[][] {
  const lines = csv.trim().split("\n");
  return lines.map((line) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

export async function importWorkoutsCSV(
  csvText: string
): Promise<ActionResult<{ imported: number }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const rows = parseCsvRows(csvText);
  if (rows.length < 2) return { success: false, error: "CSV has no data rows" };

  const header = rows[0].map((h) => h.toLowerCase());
  const idx = (name: string) => header.indexOf(name);

  const iDate = idx("date");
  const iName = idx("sessionname");
  const iTarget = idx("bodytarget");
  const iExercise = idx("exercise");
  const iSetNum = idx("setnumber");
  const iWeight = idx("weight");
  const iUnit = idx("weightunit");
  const iReps = idx("reps");

  if ([iDate, iExercise, iWeight, iReps].some((i) => i === -1)) {
    return { success: false, error: "Missing required columns: date, exercise, weight, reps" };
  }

  const sessionsCol = await getSessionsCollection();
  const setsCol = await getSetsCollection();

  // Group rows by (date + sessionName)
  const sessionMap = new Map<string, { date: string; name: string; bodyTarget: string }>();
  for (const r of rows.slice(1)) {
    const key = `${r[iDate]}|${r[iName] ?? ""}`;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, { date: r[iDate], name: r[iName] ?? "", bodyTarget: r[iTarget] ?? "Other" });
    }
  }

  // Insert sessions, collect id map
  const sessionIdMap = new Map<string, string>();
  for (const [key, { date, name, bodyTarget }] of sessionMap) {
    const target = (BODY_TARGETS as readonly string[]).includes(bodyTarget)
      ? (bodyTarget as BodyTarget)
      : "Other";
    const doc: WorkoutSessionDoc = {
      _id: new ObjectId(),
      userId,
      date: new Date(date + "T00:00:00"),
      name: name || undefined,
      bodyTarget: target,
      createdAt: new Date(),
    };
    await sessionsCol.insertOne(doc);
    sessionIdMap.set(key, doc._id.toHexString());
  }

  // Insert sets
  const setDocs: WorkoutSetDoc[] = [];
  for (const r of rows.slice(1)) {
    const key = `${r[iDate]}|${r[iName] ?? ""}`;
    const sessionId = sessionIdMap.get(key);
    if (!sessionId) continue;
    const weight = parseFloat(r[iWeight]);
    const reps = parseInt(r[iReps]);
    if (isNaN(weight) || isNaN(reps)) continue;
    setDocs.push({
      _id: new ObjectId(),
      sessionId,
      userId,
      exercise: r[iExercise] ?? "Unknown",
      setNumber: parseInt(r[iSetNum]) || 1,
      weight,
      weightUnit: r[iUnit] === "kg" ? "kg" : "lb",
      reps,
      completed: true,
      createdAt: new Date(),
    });
  }
  if (setDocs.length) await setsCol.insertMany(setDocs);

  return { success: true, data: { imported: sessionMap.size } };
}

export async function importDietCSV(
  csvText: string
): Promise<ActionResult<{ imported: number }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const rows = parseCsvRows(csvText);
  if (rows.length < 2) return { success: false, error: "CSV has no data rows" };

  const header = rows[0].map((h) => h.toLowerCase());
  const idx = (name: string) => header.indexOf(name);

  const iDate = idx("date");
  const iMeal = idx("mealtype");
  const iFood = idx("food");
  const iCal = idx("calories");
  const iPro = idx("protein");
  const iCarb = idx("carbs");
  const iFat = idx("fat");
  const iNotes = idx("notes");

  if ([iDate, iFood, iCal].some((i) => i === -1)) {
    return { success: false, error: "Missing required columns: date, food, calories" };
  }

  const col = await getDietEntriesCollection();
  const docs: DietEntryDoc[] = [];

  for (const r of rows.slice(1)) {
    const calories = parseFloat(r[iCal]);
    if (!r[iDate] || !r[iFood] || isNaN(calories)) continue;
    const mealType = (MEAL_TYPES as readonly string[]).includes(r[iMeal])
      ? (r[iMeal] as MealType)
      : "snack";
    docs.push({
      _id: new ObjectId(),
      userId,
      date: new Date(r[iDate] + "T00:00:00"),
      mealType,
      food: r[iFood],
      calories,
      protein: parseFloat(r[iPro]) || 0,
      carbs: parseFloat(r[iCarb]) || 0,
      fat: parseFloat(r[iFat]) || 0,
      notes: iNotes >= 0 && r[iNotes] ? r[iNotes] : undefined,
      createdAt: new Date(),
    });
  }

  if (docs.length) await col.insertMany(docs);
  return { success: true, data: { imported: docs.length } };
}

// ── Apple Health XML import ────────────────────────────────────────────────────

const AH_CARDIO_MAP: Record<string, CardioActivity> = {
  HKWorkoutActivityTypeRunning:                       "Run",
  HKWorkoutActivityTypeCycling:                       "Cycle",
  HKWorkoutActivityTypeWalking:                       "Walk",
  HKWorkoutActivityTypeHiking:                        "Walk",
  HKWorkoutActivityTypeSwimming:                      "Swim",
  HKWorkoutActivityTypeRowing:                        "Row",
  HKWorkoutActivityTypeHighIntensityIntervalTraining: "HIIT",
  HKWorkoutActivityTypeElliptical:                    "Elliptical",
  HKWorkoutActivityTypeStairClimbing:                 "Stairs",
};

function getAttr(tag: string, name: string): string {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : "";
}

export async function importAppleHealthXML(
  xmlText: string
): Promise<ActionResult<{ cardio: number; skipped: number }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const integrations = await getIntegrationSettings();
  const cfg = integrations?.appleHealth;

  if (cfg?.enabled === false) {
    return { success: false, error: "Apple Health import is currently disabled." };
  }

  const maxBytes = (cfg?.maxFileSizeMb ?? 50) * 1024 * 1024;
  if (xmlText.length > maxBytes) {
    return { success: false, error: `File exceeds the ${cfg?.maxFileSizeMb ?? 50} MB limit.` };
  }

  // Parse <Workout ...> opening tags (self-closing or with children)
  const workoutTagRe = /<Workout\s([^>]+?)(?:\/?>)/g;
  const candidates: CardioSessionDoc[] = [];
  let match: RegExpExecArray | null;

  while ((match = workoutTagRe.exec(xmlText)) !== null) {
    const attrs = match[1];
    const activityType = getAttr(attrs, "workoutActivityType");
    const mapped = AH_CARDIO_MAP[activityType];
    if (!mapped) continue;

    const startDateStr = getAttr(attrs, "startDate");
    if (!startDateStr) continue;
    const startDate = new Date(startDateStr);
    if (isNaN(startDate.getTime())) continue;

    const durationRaw = parseFloat(getAttr(attrs, "duration") || "0");
    const durationUnit = getAttr(attrs, "durationUnit") || "min";
    const durationMin = durationUnit === "s" ? durationRaw / 60 : durationRaw;
    if (durationMin <= 0) continue;

    const distRaw = parseFloat(getAttr(attrs, "totalDistance") || "");
    const distUnit = getAttr(attrs, "totalDistanceUnit") || "km";
    const distance = isNaN(distRaw) ? undefined : distRaw;
    const distanceUnit = (distUnit === "mi" ? "mi" : "km") as "km" | "mi";

    const calRaw = parseFloat(getAttr(attrs, "totalEnergyBurned") || "");
    const caloriesBurned = isNaN(calRaw) ? undefined : Math.round(calRaw);

    candidates.push({
      _id: new ObjectId(),
      userId,
      date: startDate,
      activityType: mapped,
      duration: Math.round(durationMin),
      distance,
      distanceUnit: distance !== undefined ? distanceUnit : undefined,
      intensity: "moderate",
      caloriesBurned,
      notes: "Imported from Apple Health",
      createdAt: new Date(),
    });
  }

  if (candidates.length === 0) {
    return { success: true, data: { cardio: 0, skipped: 0 } };
  }

  const cardioCol = await getCardioSessionsCollection();
  const shouldDedupe = cfg?.deduplicateByDate !== false;

  let inserted = 0;
  let skipped = 0;

  if (shouldDedupe) {
    const minDate = candidates.reduce((m, c) => (c.date < m ? c.date : m), candidates[0].date);
    const maxDate = candidates.reduce((m, c) => (c.date > m ? c.date : m), candidates[0].date);

    const existing = await cardioCol
      .find({ userId, date: { $gte: minDate, $lte: new Date(maxDate.getTime() + 5 * 60 * 1000) } })
      .project<{ date: Date; activityType: string }>({ date: 1, activityType: 1 })
      .toArray();

    const toInsert: CardioSessionDoc[] = [];
    for (const c of candidates) {
      const isDuplicate = existing.some(
        (e) =>
          e.activityType === c.activityType &&
          Math.abs(e.date.getTime() - c.date.getTime()) <= 5 * 60 * 1000
      );
      if (isDuplicate) { skipped++; } else { toInsert.push(c); }
    }
    if (toInsert.length) await cardioCol.insertMany(toInsert);
    inserted = toInsert.length;
  } else {
    await cardioCol.insertMany(candidates);
    inserted = candidates.length;
  }

  return { success: true, data: { cardio: inserted, skipped } };
}
