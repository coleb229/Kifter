"use server";

import { gunzipSync } from "node:zlib";
import AdmZip from "adm-zip";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getSessionsCollection, getSetsCollection, getDietEntriesCollection, getCardioSessionsCollection } from "@/lib/db";
import { getIntegrationSettings } from "@/actions/settings-actions";
import type { ActionResult, BodyTarget, CardioActivity, CardioSessionDoc, MealType, ParsedAppleHealthWorkout, WorkoutSessionAppleHealth, WorkoutSessionDoc, WorkoutSetDoc, DietEntryDoc } from "@/types";
import { BODY_TARGETS, MEAL_TYPES } from "@/types";

// ── Apple Health training activity map ────────────────────────────────────────

const AH_TRAINING_MAP: Record<string, { bodyTarget: BodyTarget; label: string }> = {
  HKWorkoutActivityTypeFunctionalStrengthTraining:  { bodyTarget: "Full Body", label: "Functional Strength" },
  HKWorkoutActivityTypeTraditionalStrengthTraining: { bodyTarget: "Full Body", label: "Strength Training" },
  HKWorkoutActivityTypeCoreTraining:                { bodyTarget: "Core",      label: "Core Training" },
  HKWorkoutActivityTypeHighIntensityIntervalTraining: { bodyTarget: "Cardio",  label: "HIIT" },
  HKWorkoutActivityTypeCrossTraining:               { bodyTarget: "Full Body", label: "Cross Training" },
  HKWorkoutActivityTypePilates:                     { bodyTarget: "Core",      label: "Pilates" },
  HKWorkoutActivityTypeYoga:                        { bodyTarget: "Other",     label: "Yoga" },
};

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

// Extract value+unit from a <WorkoutStatistics> block whose type contains `typeSubstr`
function getWorkoutStat(
  block: string,
  typeSubstr: string
): { value: number; unit: string } | undefined {
  // Use quote-aware attribute capture so > inside device/other attrs won't truncate
  const wsRe = /<WorkoutStatistics\s((?:"[^"]*"|[^>])*)\/>/g;
  let m: RegExpExecArray | null;
  while ((m = wsRe.exec(block)) !== null) {
    const attrs = m[1];
    if (!getAttr(attrs, "type").includes(typeSubstr)) continue;
    const val = parseFloat(getAttr(attrs, "sum"));
    if (!isNaN(val) && val > 0) {
      return { value: val, unit: getAttr(attrs, "unit") };
    }
  }
  return undefined;
}

// Extract heart rate stats from a <WorkoutStatistics> block (uses average/minimum/maximum, not sum)
function getWorkoutStatHR(
  block: string
): { avg: number; min: number; max: number } | undefined {
  const wsRe = /<WorkoutStatistics\s((?:"[^"]*"|[^>])*)\/>/g;
  let m: RegExpExecArray | null;
  while ((m = wsRe.exec(block)) !== null) {
    const attrs = m[1];
    if (!getAttr(attrs, "type").includes("HeartRate")) continue;
    const avg = parseFloat(getAttr(attrs, "average"));
    if (isNaN(avg) || avg <= 0) continue;
    const min = parseFloat(getAttr(attrs, "minimum"));
    const max = parseFloat(getAttr(attrs, "maximum"));
    return {
      avg: Math.round(avg),
      min: isNaN(min) ? Math.round(avg) : Math.round(min),
      max: isNaN(max) ? Math.round(avg) : Math.round(max),
    };
  }
  return undefined;
}

function normalizeDistanceToKm(raw: number, unit: string): { distance: number; distanceUnit: "km" | "mi" } {
  if (unit === "mi") return { distance: raw, distanceUnit: "mi" };
  if (unit === "m") return { distance: raw / 1000, distanceUnit: "km" };
  if (unit === "yd") return { distance: raw * 0.0009144, distanceUnit: "km" };
  return { distance: raw, distanceUnit: "km" }; // default km
}

// ── Shared decompression helper ───────────────────────────────────────────────

function decompressAppleHealthXMLFromBuffer(
  buf: Buffer
): { xmlText: string } | { error: string } {
  try {
    const isZip = buf[0] === 0x50 && buf[1] === 0x4b; // PK
    const isGzip = buf[0] === 0x1f && buf[1] === 0x8b;
    if (isZip) {
      const zip = new AdmZip(buf);
      const entry =
        zip.getEntry("apple_health_export/export.xml") ??
        zip.getEntries().find((e) => e.entryName.endsWith("export.xml"));
      if (!entry) return { error: "Could not find export.xml inside the zip file." };
      return { xmlText: entry.getData().toString("utf-8") };
    } else if (isGzip) {
      return { xmlText: gunzipSync(buf).toString("utf-8") };
    } else {
      // Raw XML file uploaded directly
      const xmlText = buf.toString("utf-8");
      if (!xmlText.includes("<HealthData")) {
        return { error: "Unrecognized file format. Please upload export.xml or the Apple Health .zip export." };
      }
      return { xmlText };
    }
  } catch {
    return { error: "Failed to decompress file. Please re-export and try again." };
  }
}

// ── importAppleHealthXML ──────────────────────────────────────────────────────

export async function importAppleHealthXML(
  formData: FormData
): Promise<ActionResult<{ cardio: number; training: number; skipped: number }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const integrations = await getIntegrationSettings();
  const cfg = integrations?.appleHealth;

  if (cfg?.enabled === false) {
    return { success: false, error: "Apple Health import is currently disabled." };
  }

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided." };
  const buf = Buffer.from(await file.arrayBuffer());

  const decompressed = decompressAppleHealthXMLFromBuffer(buf);
  if ("error" in decompressed) return { success: false, error: decompressed.error };
  const { xmlText } = decompressed;

  const maxBytes = (cfg?.maxFileSizeMb ?? 50) * 1024 * 1024;
  if (xmlText.length > maxBytes) {
    return { success: false, error: `File exceeds the ${cfg?.maxFileSizeMb ?? 50} MB limit.` };
  }

  const sessionsCol = await getSessionsCollection();

  // Quote-aware regex: handles > inside quoted attribute values (e.g. device="<<iPhone>>")
  const workoutTagRe = /<Workout\s((?:"[^"]*"|[^>])*)(\s*\/?>)/g;
  const cardioCandidates: CardioSessionDoc[] = [];
  let trainingEnriched = 0;
  let match: RegExpExecArray | null;

  while ((match = workoutTagRe.exec(xmlText)) !== null) {
    const attrs = match[1];
    const isSelfClosing = match[2].trimStart().startsWith("/");
    const tagEnd = match.index + match[0].length;

    const activityType = getAttr(attrs, "workoutActivityType");
    const cardioMapped = AH_CARDIO_MAP[activityType];
    const trainingMapped = AH_TRAINING_MAP[activityType];

    if (!cardioMapped && !trainingMapped) continue;

    const startDateStr = getAttr(attrs, "startDate");
    if (!startDateStr) continue;
    const startDate = new Date(startDateStr);
    if (isNaN(startDate.getTime())) continue;

    const durationRaw = parseFloat(getAttr(attrs, "duration") || "0");
    const durationUnit = getAttr(attrs, "durationUnit") || "min";
    const durationMin = durationUnit === "s" ? durationRaw / 60 : durationRaw;
    if (durationMin <= 0) continue;

    // Get block content between opening tag and </Workout> for WorkoutStatistics fallback
    let blockContent = "";
    if (!isSelfClosing) {
      const closeIdx = xmlText.indexOf("</Workout>", tagEnd);
      if (closeIdx !== -1) blockContent = xmlText.slice(tagEnd, closeIdx);
    }

    // Calories — try opening tag attrs first, then WorkoutStatistics child elements
    let calRaw = parseFloat(getAttr(attrs, "totalEnergyBurned") || "");
    if ((isNaN(calRaw) || calRaw <= 0) && blockContent) {
      const stat = getWorkoutStat(blockContent, "EnergyBurned");
      if (stat) calRaw = stat.value;
    }
    const caloriesBurned = !isNaN(calRaw) && calRaw > 0 ? Math.round(calRaw) : undefined;

    // ── Cardio path ───────────────────────────────────────────────────────────
    if (cardioMapped) {
      let distRaw = parseFloat(getAttr(attrs, "totalDistance") || "");
      let distUnit = getAttr(attrs, "totalDistanceUnit");
      if ((isNaN(distRaw) || distRaw <= 0) && blockContent) {
        const stat = getWorkoutStat(blockContent, "Distance");
        if (stat) { distRaw = stat.value; distUnit = stat.unit; }
      }
      let distance: number | undefined;
      let distanceUnit: "km" | "mi" | undefined;
      if (!isNaN(distRaw) && distRaw > 0) {
        const norm = normalizeDistanceToKm(distRaw, distUnit || "km");
        distance = norm.distance;
        distanceUnit = norm.distanceUnit;
      }

      cardioCandidates.push({
        _id: new ObjectId(),
        userId,
        date: startDate,
        activityType: cardioMapped,
        duration: Math.round(durationMin),
        distance,
        distanceUnit,
        intensity: "moderate",
        caloriesBurned,
        notes: "Imported from Apple Health",
        createdAt: new Date(),
      });
    }

    // ── Training path — enrich existing sessions on the same calendar date ────
    if (trainingMapped) {
      const hr = blockContent ? getWorkoutStatHR(blockContent) : undefined;
      const ahData: WorkoutSessionAppleHealth = {
        activityType,
        label: trainingMapped.label,
        duration: Math.round(durationMin),
        caloriesBurned,
        heartRateAvg: hr?.avg,
        heartRateMin: hr?.min,
        heartRateMax: hr?.max,
      };

      const dateStr = startDateStr.slice(0, 10); // "YYYY-MM-DD" in the user's local timezone
      const dayStart = new Date(dateStr + "T00:00:00.000Z");
      const dayEnd   = new Date(dateStr + "T23:59:59.999Z");

      const updateResult = await sessionsCol.updateMany(
        { userId, date: { $gte: dayStart, $lte: dayEnd } },
        { $set: { appleHealth: ahData } }
      );
      trainingEnriched += updateResult.modifiedCount;
    }
  }

  const shouldDedupe = cfg?.deduplicateByDate !== false;
  let cardioInserted = 0;
  let skipped = 0;

  // ── Insert cardio ─────────────────────────────────────────────────────────
  if (cardioCandidates.length > 0) {
    const cardioCol = await getCardioSessionsCollection();

    if (shouldDedupe) {
      const minDate = cardioCandidates.reduce((m, c) => (c.date < m ? c.date : m), cardioCandidates[0].date);
      const maxDate = cardioCandidates.reduce((m, c) => (c.date > m ? c.date : m), cardioCandidates[0].date);

      const existing = await cardioCol
        .find({ userId, date: { $gte: minDate, $lte: new Date(maxDate.getTime() + 5 * 60 * 1000) } })
        .project<{ date: Date; activityType: string }>({ date: 1, activityType: 1 })
        .toArray();

      const toInsert: CardioSessionDoc[] = [];
      for (const c of cardioCandidates) {
        const isDuplicate = existing.some(
          (e) =>
            e.activityType === c.activityType &&
            Math.abs(e.date.getTime() - c.date.getTime()) <= 5 * 60 * 1000
        );
        if (isDuplicate) { skipped++; } else { toInsert.push(c); }
      }
      if (toInsert.length) await cardioCol.insertMany(toInsert);
      cardioInserted = toInsert.length;
    } else {
      await cardioCol.insertMany(cardioCandidates);
      cardioInserted = cardioCandidates.length;
    }
  }

  return { success: true, data: { cardio: cardioInserted, training: trainingEnriched, skipped } };
}

// ── importAppleHealthParsed ───────────────────────────────────────────────────
// Accepts pre-parsed workout data from the client-side parser so we never
// send the raw (potentially 10 MB+) zip/xml through Vercel's 4.5 MB limit.

export async function importAppleHealthParsed(
  workouts: ParsedAppleHealthWorkout[]
): Promise<ActionResult<{ cardio: number; training: number; skipped: number }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const integrations = await getIntegrationSettings();
  const cfg = integrations?.appleHealth;

  if (cfg?.enabled === false) {
    return { success: false, error: "Apple Health import is currently disabled." };
  }

  if (!workouts?.length) {
    return { success: true, data: { cardio: 0, training: 0, skipped: 0 } };
  }

  const sessionsCol = await getSessionsCollection();
  const cardioCandidates: CardioSessionDoc[] = [];
  let trainingEnriched = 0;

  for (const w of workouts) {
    const cardioMapped = AH_CARDIO_MAP[w.activityType];
    const trainingMapped = AH_TRAINING_MAP[w.activityType];

    if (!cardioMapped && !trainingMapped) continue;

    const startDate = new Date(w.startDate);
    if (isNaN(startDate.getTime())) continue;

    if (cardioMapped) {
      let distance: number | undefined;
      let distanceUnit: "km" | "mi" | undefined;
      if (w.distance != null && w.distanceUnit) {
        const norm = normalizeDistanceToKm(w.distance, w.distanceUnit);
        distance = norm.distance;
        distanceUnit = norm.distanceUnit;
      }

      cardioCandidates.push({
        _id: new ObjectId(),
        userId,
        date: startDate,
        activityType: cardioMapped,
        duration: w.durationMin,
        distance,
        distanceUnit,
        intensity: "moderate",
        caloriesBurned: w.caloriesBurned,
        notes: "Imported from Apple Health",
        createdAt: new Date(),
      });
    }

    if (trainingMapped) {
      const ahData: WorkoutSessionAppleHealth = {
        activityType: w.activityType,
        label: trainingMapped.label,
        duration: w.durationMin,
        caloriesBurned: w.caloriesBurned,
        heartRateAvg: w.heartRateAvg,
        heartRateMin: w.heartRateMin,
        heartRateMax: w.heartRateMax,
      };

      const dateStr = w.startDate.slice(0, 10);
      const dayStart = new Date(dateStr + "T00:00:00.000Z");
      const dayEnd   = new Date(dateStr + "T23:59:59.999Z");

      const updateResult = await sessionsCol.updateMany(
        { userId, date: { $gte: dayStart, $lte: dayEnd } },
        { $set: { appleHealth: ahData } }
      );
      trainingEnriched += updateResult.modifiedCount;
    }
  }

  const shouldDedupe = cfg?.deduplicateByDate !== false;
  let cardioInserted = 0;
  let skipped = 0;

  if (cardioCandidates.length > 0) {
    const cardioCol = await getCardioSessionsCollection();

    if (shouldDedupe) {
      const minDate = cardioCandidates.reduce((m, c) => (c.date < m ? c.date : m), cardioCandidates[0].date);
      const maxDate = cardioCandidates.reduce((m, c) => (c.date > m ? c.date : m), cardioCandidates[0].date);

      const existing = await cardioCol
        .find({ userId, date: { $gte: minDate, $lte: new Date(maxDate.getTime() + 5 * 60 * 1000) } })
        .project<{ date: Date; activityType: string }>({ date: 1, activityType: 1 })
        .toArray();

      const toInsert: CardioSessionDoc[] = [];
      for (const c of cardioCandidates) {
        const isDuplicate = existing.some(
          (e) =>
            e.activityType === c.activityType &&
            Math.abs(e.date.getTime() - c.date.getTime()) <= 5 * 60 * 1000
        );
        if (isDuplicate) { skipped++; } else { toInsert.push(c); }
      }
      if (toInsert.length) await cardioCol.insertMany(toInsert);
      cardioInserted = toInsert.length;
    } else {
      await cardioCol.insertMany(cardioCandidates);
      cardioInserted = cardioCandidates.length;
    }
  }

  return { success: true, data: { cardio: cardioInserted, training: trainingEnriched, skipped } };
}
