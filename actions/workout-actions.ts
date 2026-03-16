"use server";

import { ObjectId } from "mongodb";
import { format } from "date-fns";
import { auth } from "@/auth";
import { getSessionsCollection, getSetsCollection, getExercisesCollection } from "@/lib/db";
import { updateStreak } from "@/actions/streak-actions";
import { DEFAULT_EXERCISES } from "@/lib/exercises";
import type { WeightUnit } from "@/lib/weight";
import type {
  ActionResult,
  AddExerciseInput,
  BodyTarget,
  CreateSessionInput,
  WorkoutSession,
  WorkoutSet,
} from "@/types";

function toLb(weight: number, unit: WeightUnit): number {
  return unit === "kg" ? weight * 2.20462 : weight;
}

// Recovery thresholds in hours per body target
const RECOVERY_HOURS: Record<BodyTarget, number> = {
  Push: 48,
  Pull: 48,
  Legs: 48,
  "Upper Body": 48,
  "Lower Body": 48,
  "Full Body": 72,
  Core: 24,
  Cardio: 24,
  Other: 24,
};

export interface RestDaySuggestion {
  bodyTarget: BodyTarget;
  lastTrainedDate: string | null; // ISO date or null
  hoursSince: number | null;
  recommendation: "rest" | "ready" | "never";
}

// ── createSession ─────────────────────────────────────────────────────────────

export async function createSession(
  data: CreateSessionInput
): Promise<ActionResult<{ sessionId: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const userId = session.user.id;
  const now = new Date();
  const sessionId = new ObjectId();

  const sessionsCol = await getSessionsCollection();
  await sessionsCol.insertOne({
    _id: sessionId,
    userId,
    date: new Date(data.date),
    name: data.name || undefined,
    bodyTarget: data.bodyTarget,
    notes: data.notes || undefined,
    createdAt: now,
  });

  // Fire-and-forget streak update
  void updateStreak();

  return { success: true, data: { sessionId: sessionId.toHexString() } };
}

// ── addExerciseToSession ──────────────────────────────────────────────────────

export async function addExerciseToSession(
  sessionId: string,
  data: AddExerciseInput
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const userId = session.user.id;

  // Verify the session belongs to this user
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(sessionId);
  } catch {
    return { success: false, error: "Invalid session ID" };
  }

  const sessionsCol = await getSessionsCollection();
  const workoutSession = await sessionsCol.findOne({ _id: objectId, userId });
  if (!workoutSession) {
    return { success: false, error: "Session not found" };
  }

  const setsCol = await getSetsCollection();
  const now = new Date();

  const setDocs = data.sets.map((set, index) => ({
    _id: new ObjectId(),
    sessionId,
    userId,
    exercise: data.exercise,
    setNumber: index + 1,
    weight: set.weight,
    weightUnit: set.weightUnit,
    reps: set.reps,
    completed: true,
    createdAt: now,
  }));

  await setsCol.insertMany(setDocs);

  return { success: true, data: undefined };
}

// ── getWorkoutSessions ────────────────────────────────────────────────────────

export async function getWorkoutSessions(
  limit = 0
): Promise<ActionResult<WorkoutSession[]>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const userId = session.user.id;
  const sessionsCol = await getSessionsCollection();
  const setsCol = await getSetsCollection();

  const query = sessionsCol.find({ userId }).sort({ date: -1 });
  if (limit > 0) query.limit(limit);
  const docs = await query.toArray();

  const sessions = await Promise.all(
    docs.map(async (doc) => {
      const sessionIdStr = doc._id.toHexString();
      const sets = await setsCol.find({ sessionId: sessionIdStr }).toArray();
      const exerciseNames = [...new Set(sets.map((s) => s.exercise))].slice(0, 3);

      return {
        id: sessionIdStr,
        userId: doc.userId,
        date: doc.date.toISOString(),
        name: doc.name,
        bodyTarget: doc.bodyTarget,
        notes: doc.notes,
        appleHealth: doc.appleHealth,
        createdAt: doc.createdAt.toISOString(),
        setCount: sets.length,
        exerciseNames,
      } satisfies WorkoutSession;
    })
  );

  return { success: true, data: sessions };
}

// ── getWorkoutSession ─────────────────────────────────────────────────────────

export async function getWorkoutSession(
  id: string
): Promise<ActionResult<{ session: WorkoutSession; sets: WorkoutSet[] }>> {
  const authSession = await auth();
  if (!authSession?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const userId = authSession.user.id;
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return { success: false, error: "Invalid session ID" };
  }

  const sessionsCol = await getSessionsCollection();
  const doc = await sessionsCol.findOne({ _id: objectId, userId });
  if (!doc) {
    return { success: false, error: "Session not found" };
  }

  const setsCol = await getSetsCollection();
  const setDocs = await setsCol
    .find({ sessionId: id })
    .sort({ createdAt: 1, setNumber: 1 })
    .toArray();

  return {
    success: true,
    data: {
      session: {
        id: doc._id.toHexString(),
        userId: doc.userId,
        date: doc.date.toISOString(),
        name: doc.name,
        bodyTarget: doc.bodyTarget,
        notes: doc.notes,
        appleHealth: doc.appleHealth,
        createdAt: doc.createdAt.toISOString(),
      },
      sets: setDocs.map((s) => ({
        id: s._id.toHexString(),
        sessionId: s.sessionId,
        userId: s.userId,
        exercise: s.exercise,
        setNumber: s.setNumber,
        weight: s.weight,
        weightUnit: s.weightUnit ?? ("lb" as WeightUnit),
        reps: s.reps,
        completed: s.completed,
        createdAt: s.createdAt.toISOString(),
      })),
    },
  };
}

// ── updateSession ─────────────────────────────────────────────────────────────

export async function updateSession(
  id: string,
  data: Partial<CreateSessionInput>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return { success: false, error: "Invalid session ID" };
  }

  const sessionsCol = await getSessionsCollection();
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name || undefined;
  if (data.date) update.date = new Date(data.date);
  if (data.bodyTarget) update.bodyTarget = data.bodyTarget;
  if (data.notes !== undefined) update.notes = data.notes || undefined;

  await sessionsCol.updateOne(
    { _id: objectId, userId: session.user.id },
    { $set: update }
  );

  return { success: true, data: undefined };
}

// ── deleteSession ─────────────────────────────────────────────────────────────

export async function deleteSession(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return { success: false, error: "Invalid session ID" };
  }

  const sessionsCol = await getSessionsCollection();
  await sessionsCol.deleteOne({ _id: objectId, userId: session.user.id });

  const setsCol = await getSetsCollection();
  await setsCol.deleteMany({ sessionId: id });

  return { success: true, data: undefined };
}

// ── updateSet ─────────────────────────────────────────────────────────────────

export async function updateSet(
  setId: string,
  data: { weight: number; weightUnit: WeightUnit; reps: number }
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(setId);
  } catch {
    return { success: false, error: "Invalid set ID" };
  }

  const setsCol = await getSetsCollection();
  await setsCol.updateOne(
    { _id: objectId, userId: session.user.id },
    { $set: { weight: data.weight, weightUnit: data.weightUnit, reps: data.reps } }
  );

  return { success: true, data: undefined };
}

// ── deleteSet ─────────────────────────────────────────────────────────────────

export async function deleteSet(setId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(setId);
  } catch {
    return { success: false, error: "Invalid set ID" };
  }

  const setsCol = await getSetsCollection();
  await setsCol.deleteOne({ _id: objectId, userId: session.user.id });

  return { success: true, data: undefined };
}

// ── toggleSetCompleted ────────────────────────────────────────────────────────

export async function toggleSetCompleted(setId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(setId);
  } catch {
    return { success: false, error: "Invalid set ID" };
  }

  const setsCol = await getSetsCollection();
  const set = await setsCol.findOne({ _id: objectId, userId: session.user.id });
  if (!set) return { success: false, error: "Set not found" };

  await setsCol.updateOne(
    { _id: objectId, userId: session.user.id },
    { $set: { completed: !set.completed } }
  );
  return { success: true, data: undefined };
}

// ── renameExercise ────────────────────────────────────────────────────────────

export async function renameExercise(
  sessionId: string,
  oldName: string,
  newName: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const trimmed = newName.trim();
  if (!trimmed) return { success: false, error: "Exercise name required" };

  const setsCol = await getSetsCollection();
  await setsCol.updateMany(
    { sessionId, userId: session.user.id, exercise: oldName },
    { $set: { exercise: trimmed } }
  );

  return { success: true, data: undefined };
}

// ── deleteExerciseFromSession ─────────────────────────────────────────────────

export async function deleteExerciseFromSession(
  sessionId: string,
  exerciseName: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const setsCol = await getSetsCollection();
  await setsCol.deleteMany({
    sessionId,
    userId: session.user.id,
    exercise: exerciseName,
  });

  return { success: true, data: undefined };
}

// ── getUserExercises ──────────────────────────────────────────────────────────

export async function getUserExercises(): Promise<ActionResult<string[]>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const exercisesCol = await getExercisesCollection();
  const custom = await exercisesCol
    .find({ userId: session.user.id })
    .sort({ name: 1 })
    .toArray();

  const customNames = custom.map((e) => e.name);
  const merged = [
    ...DEFAULT_EXERCISES,
    ...customNames.filter((n) => !DEFAULT_EXERCISES.includes(n)),
  ];

  return { success: true, data: merged };
}

// ── addUserExercise ───────────────────────────────────────────────────────────

export async function addUserExercise(
  name: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Exercise name required" };

  const exercisesCol = await getExercisesCollection();
  const existing = await exercisesCol.findOne({
    userId: session.user.id,
    name: { $regex: new RegExp(`^${trimmed}$`, "i") },
  });
  if (existing) return { success: false, error: "Exercise already exists" };

  await exercisesCol.insertOne({
    _id: new ObjectId(),
    userId: session.user.id,
    name: trimmed,
    createdAt: new Date(),
  });

  return { success: true, data: undefined };
}

// ── deleteUserExercise ────────────────────────────────────────────────────────

export async function deleteUserExercise(
  name: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const exercisesCol = await getExercisesCollection();
  await exercisesCol.deleteOne({ userId: session.user.id, name });

  return { success: true, data: undefined };
}

// ── getLastWeightForExercise ──────────────────────────────────────────────────

export async function getLastWeightForExercise(
  exerciseName: string
): Promise<ActionResult<{ weight: number; unit: WeightUnit } | null>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const setsCol = await getSetsCollection();
  const lastSet = await setsCol.findOne(
    { userId: session.user.id, exercise: exerciseName },
    { sort: { weight: -1 } }
  );

  if (!lastSet) return { success: true, data: null };

  return {
    success: true,
    data: { weight: lastSet.weight, unit: lastSet.weightUnit ?? "lb" },
  };
}

// ── getRestDaySuggestions ──────────────────────────────────────────────────────

export async function getRestDaySuggestions(): Promise<ActionResult<RestDaySuggestion[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const userId = session.user.id;
  const sessionsCol = await getSessionsCollection();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const docs = await sessionsCol
    .find({ userId, date: { $gte: cutoff } })
    .sort({ date: -1 })
    .toArray();

  // Find most recent session per body target
  const lastByTarget = new Map<BodyTarget, Date>();
  for (const doc of docs) {
    if (!lastByTarget.has(doc.bodyTarget)) {
      lastByTarget.set(doc.bodyTarget, doc.date);
    }
  }

  const now = Date.now();
  const suggestions: RestDaySuggestion[] = (Object.keys(RECOVERY_HOURS) as BodyTarget[]).map((target) => {
    const lastDate = lastByTarget.get(target) ?? null;
    if (!lastDate) {
      return { bodyTarget: target, lastTrainedDate: null, hoursSince: null, recommendation: "never" };
    }
    const hoursSince = (now - lastDate.getTime()) / 3_600_000;
    const threshold = RECOVERY_HOURS[target];
    return {
      bodyTarget: target,
      lastTrainedDate: lastDate.toISOString(),
      hoursSince: Math.round(hoursSince * 10) / 10,
      recommendation: hoursSince >= threshold ? "ready" : "rest",
    };
  });

  // Cascade: if sub-groups are recovering, parent groups must also show as recovering.
  // e.g. if Push is still on rest, Upper Body cannot be shown as ready.
  const byTarget = new Map(suggestions.map((s) => [s.bodyTarget, s]));
  const forceRest = (target: BodyTarget) => {
    const s = byTarget.get(target);
    if (s && s.recommendation === "ready") s.recommendation = "rest";
  };
  const pushRec      = byTarget.get("Push")?.recommendation;
  const pullRec      = byTarget.get("Pull")?.recommendation;
  const legsRec      = byTarget.get("Legs")?.recommendation;
  const upperBodyRec = byTarget.get("Upper Body")?.recommendation;
  const lowerBodyRec = byTarget.get("Lower Body")?.recommendation;

  if (pushRec === "rest" || pullRec === "rest") forceRest("Upper Body");
  if (legsRec === "rest") forceRest("Lower Body");
  if (
    pushRec === "rest" || pullRec === "rest" ||
    legsRec === "rest" || upperBodyRec === "rest" || lowerBodyRec === "rest"
  ) forceRest("Full Body");

  return { success: true, data: suggestions };
}

// ── setExerciseVideoUrl ────────────────────────────────────────────────────────

const YOUTUBE_REGEX = /^https:\/\/(www\.)?(youtube\.com\/watch|youtu\.be\/)/;

export async function setExerciseVideoUrl(
  exerciseName: string,
  videoUrl: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const trimmed = videoUrl.trim();
  if (trimmed && !YOUTUBE_REGEX.test(trimmed)) {
    return { success: false, error: "Only YouTube URLs are supported" };
  }

  const exercisesCol = await getExercisesCollection();
  if (trimmed) {
    await exercisesCol.updateOne(
      { userId: session.user.id, name: exerciseName },
      { $set: { videoUrl: trimmed }, $setOnInsert: { _id: new ObjectId(), createdAt: new Date() } },
      { upsert: true }
    );
  } else {
    await exercisesCol.updateOne(
      { userId: session.user.id, name: exerciseName },
      { $unset: { videoUrl: "" } }
    );
  }

  return { success: true, data: undefined };
}

// ── getExerciseVideos ──────────────────────────────────────────────────────────

export async function getExerciseVideos(): Promise<ActionResult<Record<string, string>>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const exercisesCol = await getExercisesCollection();
  const docs = await exercisesCol
    .find({ userId: session.user.id, videoUrl: { $exists: true } })
    .project<{ name: string; videoUrl: string }>({ name: 1, videoUrl: 1 })
    .toArray();

  const map: Record<string, string> = {};
  for (const doc of docs) {
    if (doc.videoUrl) map[doc.name] = doc.videoUrl;
  }

  return { success: true, data: map };
}

// ── getProgressiveOverloadSuggestions ─────────────────────────────────────────

export interface ProgressiveOverloadSuggestion {
  exercise: string;
  currentWeightUnit: WeightUnit;
  currentWeightDisplay: number;
  suggestedWeightDisplay: number;
  consecutiveSessions: number;
}

export async function getProgressiveOverloadSuggestions(): Promise<ActionResult<ProgressiveOverloadSuggestion[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const userId = session.user.id;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const setsCol = await getSetsCollection();
  const sets = await setsCol
    .find({ userId, completed: true, createdAt: { $gte: cutoff } })
    .sort({ createdAt: -1 })
    .toArray();

  // Group by exercise → group by sessionId (preserving order = descending by date)
  const byExercise = new Map<string, Map<string, { maxLb: number; unit: WeightUnit; maxRaw: number }>>();
  for (const s of sets) {
    if (!byExercise.has(s.exercise)) byExercise.set(s.exercise, new Map());
    const bySess = byExercise.get(s.exercise)!;
    const lb = toLb(s.weight, s.weightUnit ?? "lb");
    const existing = bySess.get(s.sessionId);
    if (!existing || lb > existing.maxLb) {
      bySess.set(s.sessionId, { maxLb: lb, unit: s.weightUnit ?? "lb", maxRaw: s.weight });
    }
  }

  const suggestions: ProgressiveOverloadSuggestion[] = [];

  for (const [exercise, sessMap] of byExercise) {
    const sessions = Array.from(sessMap.values()); // already sorted desc by insertion order
    if (sessions.length < 2) continue;

    const ref = sessions[0].maxLb;
    let consecutive = 1;
    for (let i = 1; i < sessions.length; i++) {
      if (Math.abs(sessions[i].maxLb - ref) < 0.01) consecutive++;
      else break;
    }
    if (consecutive < 2) continue;

    const unit = sessions[0].unit;
    const currentRaw = sessions[0].maxRaw;
    const currentLb = sessions[0].maxLb;

    let suggestedDisplay: number;
    if (unit === "kg") {
      const suggestedKg = Math.round((currentLb * 1.05 / 2.20462) / 1.25) * 1.25;
      suggestedDisplay = suggestedKg === currentRaw ? currentRaw + 1.25 : suggestedKg;
    } else {
      const suggestedLb = Math.round(currentLb * 1.05 / 2.5) * 2.5;
      suggestedDisplay = suggestedLb === currentRaw ? currentRaw + 2.5 : suggestedLb;
    }

    suggestions.push({
      exercise,
      currentWeightUnit: unit,
      currentWeightDisplay: currentRaw,
      suggestedWeightDisplay: suggestedDisplay,
      consecutiveSessions: consecutive,
    });
  }

  suggestions.sort((a, b) => b.consecutiveSessions - a.consecutiveSessions);
  return { success: true, data: suggestions };
}

// ── getDeloadRecommendation ────────────────────────────────────────────────────

export interface DeloadRecommendation {
  shouldDeload: boolean;
  reason: string;
  intensity: "low" | "moderate" | "high";
  weeklyVolumes: { label: string; volume: number }[];
}

export async function getDeloadRecommendation(): Promise<ActionResult<DeloadRecommendation>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const userId = session.user.id;

  // Compute Monday-aligned week start for the current week
  function getWeekStart(d: Date): Date {
    const day = d.getUTCDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(d);
    mon.setUTCDate(d.getUTCDate() + diff);
    mon.setUTCHours(0, 0, 0, 0);
    return mon;
  }

  const now = new Date();
  const currentWeekStart = getWeekStart(now);

  // Build boundaries for 6 complete weeks before the current week
  const weeks: { start: Date; end: Date; label: string }[] = [];
  for (let i = 6; i >= 1; i--) {
    const start = new Date(currentWeekStart);
    start.setUTCDate(currentWeekStart.getUTCDate() - i * 7);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 7);
    weeks.push({ start, end, label: `Wk of ${format(start, "MMM d")}` });
  }

  const sixWeeksAgo = weeks[0].start;

  const setsCol = await getSetsCollection();
  const allSets = await setsCol
    .find({ userId, completed: true, createdAt: { $gte: sixWeeksAgo } })
    .toArray();

  // Bucket sets by completed week
  const weeklyVolumes = weeks.map(({ start, end, label }) => {
    const volume = allSets
      .filter((s) => s.createdAt >= start && s.createdAt < end)
      .reduce((sum, s) => sum + toLb(s.weight, s.weightUnit ?? "lb") * s.reps, 0);
    return { label, volume: Math.round(volume) };
  });

  const currentWeekVolume = allSets
    .filter((s) => s.createdAt >= currentWeekStart)
    .reduce((sum, s) => sum + toLb(s.weight, s.weightUnit ?? "lb") * s.reps, 0);

  const weeksWithData = weeklyVolumes.filter((w) => w.volume > 0).length;

  if (weeksWithData < 3) {
    return {
      success: true,
      data: {
        shouldDeload: false,
        reason: "Not enough training history yet",
        intensity: "low",
        weeklyVolumes,
      },
    };
  }

  const avg6 = weeklyVolumes.reduce((s, w) => s + w.volume, 0) / weeksWithData;

  // Condition A: current week already 30%+ above average
  if (currentWeekVolume > avg6 * 1.3) {
    return {
      success: true,
      data: {
        shouldDeload: true,
        reason: "Current week is already 30%+ above your recent average — consider a lighter week",
        intensity: "high",
        weeklyVolumes,
      },
    };
  }

  // Condition B: 4+ consecutive complete weeks above average (most recent first)
  let consecutive = 0;
  for (let i = weeklyVolumes.length - 1; i >= 0; i--) {
    if (weeklyVolumes[i].volume > avg6) consecutive++;
    else break;
  }
  if (consecutive >= 4) {
    return {
      success: true,
      data: {
        shouldDeload: true,
        reason: `${consecutive} consecutive high-volume weeks detected — your body will benefit from a recovery week`,
        intensity: "moderate",
        weeklyVolumes,
      },
    };
  }

  return {
    success: true,
    data: { shouldDeload: false, reason: "Volume looks balanced", intensity: "low", weeklyVolumes },
  };
}

// ── getPersonalRecords ────────────────────────────────────────────────────────

export interface PersonalRecord {
  exercise: string;
  weight: number;
  weightUnit: WeightUnit;
  reps: number;
  estimated1RM: number; // Epley, in lb
  sessionDate: string;  // ISO string
  sessionId: string;
}

export async function getPersonalRecords(): Promise<ActionResult<PersonalRecord[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const userId = session.user.id;
  const setsCol = await getSetsCollection();

  const allSets = await setsCol.find({ userId, completed: true }).toArray();

  // Group by exercise, keep set with highest Epley 1RM
  const bestByExercise = new Map<string, typeof allSets[0]>();
  for (const s of allSets) {
    const epley = toLb(s.weight, s.weightUnit ?? "lb") * (1 + s.reps / 30);
    const best = bestByExercise.get(s.exercise);
    if (!best) {
      bestByExercise.set(s.exercise, s);
    } else {
      const bestEpley = toLb(best.weight, best.weightUnit ?? "lb") * (1 + best.reps / 30);
      if (epley > bestEpley) bestByExercise.set(s.exercise, s);
    }
  }

  if (bestByExercise.size === 0) return { success: true, data: [] };

  // Batch-fetch sessions for dates
  const sessionIds = [...new Set([...bestByExercise.values()].map((s) => s.sessionId))];
  const sessionsCol = await getSessionsCollection();
  const sessionDocs = await sessionsCol
    .find({ _id: { $in: sessionIds.map((id) => new ObjectId(id)) } })
    .project<{ _id: import("mongodb").ObjectId; date: Date }>({ date: 1 })
    .toArray();
  const sessionDateMap = new Map(sessionDocs.map((d) => [d._id.toHexString(), d.date.toISOString()]));

  const records: PersonalRecord[] = [...bestByExercise.entries()].map(([exercise, s]) => ({
    exercise,
    weight: s.weight,
    weightUnit: (s.weightUnit ?? "lb") as WeightUnit,
    reps: s.reps,
    estimated1RM: Math.round(toLb(s.weight, s.weightUnit ?? "lb") * (1 + s.reps / 30) * 10) / 10,
    sessionDate: sessionDateMap.get(s.sessionId) ?? new Date(0).toISOString(),
    sessionId: s.sessionId,
  }));

  records.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());

  return { success: true, data: records };
}

// ── getBodyTargetDistribution ─────────────────────────────────────────────────

export interface BodyTargetVolume {
  target: BodyTarget;
  volume: number;
  sessionCount: number;
  percentage: number;
}

export async function getBodyTargetDistribution(): Promise<ActionResult<BodyTargetVolume[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const userId = session.user.id;
  const cutoff = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

  const sessionsCol = await getSessionsCollection();
  const sessionDocs = await sessionsCol.find({ userId, date: { $gte: cutoff } }).toArray();

  if (sessionDocs.length === 0) return { success: true, data: [] };

  const sessionTargetMap = new Map<string, BodyTarget>();
  for (const doc of sessionDocs) {
    sessionTargetMap.set(doc._id.toHexString(), doc.bodyTarget);
  }

  const sessionIds = sessionDocs.map((d) => d._id.toHexString());
  const setsCol = await getSetsCollection();
  const sets = await setsCol.find({ userId, sessionId: { $in: sessionIds }, completed: true }).toArray();

  const volumeMap = new Map<BodyTarget, { volume: number; sessions: Set<string> }>();
  for (const s of sets) {
    const target = sessionTargetMap.get(s.sessionId);
    if (!target) continue;
    const entry = volumeMap.get(target) ?? { volume: 0, sessions: new Set() };
    entry.volume += toLb(s.weight, s.weightUnit ?? "lb") * s.reps;
    entry.sessions.add(s.sessionId);
    volumeMap.set(target, entry);
  }

  const totalVolume = [...volumeMap.values()].reduce((sum, e) => sum + e.volume, 0);
  if (totalVolume === 0) return { success: true, data: [] };

  const result: BodyTargetVolume[] = [...volumeMap.entries()]
    .map(([target, { volume, sessions }]) => ({
      target,
      volume: Math.round(volume),
      sessionCount: sessions.size,
      percentage: Math.round((volume / totalVolume) * 100),
    }))
    .sort((a, b) => b.volume - a.volume);

  return { success: true, data: result };
}

// ── replaySession ─────────────────────────────────────────────────────────────

export async function replaySession(
  sessionId: string,
  newDate: string
): Promise<ActionResult<{ newSessionId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const userId = session.user.id;
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(sessionId);
  } catch {
    return { success: false, error: "Invalid session ID" };
  }

  const [sessionsCol, setsCol] = await Promise.all([
    getSessionsCollection(),
    getSetsCollection(),
  ]);

  const source = await sessionsCol.findOne({ _id: objectId, userId });
  if (!source) return { success: false, error: "Session not found" };

  const sourceSets = await setsCol
    .find({ sessionId, userId })
    .sort({ exercise: 1, setNumber: 1 })
    .toArray();

  const newSessionId = new ObjectId();
  const now = new Date();

  await sessionsCol.insertOne({
    _id: newSessionId,
    userId,
    date: new Date(newDate + "T00:00:00.000Z"),
    name: source.name,
    bodyTarget: source.bodyTarget,
    notes: source.notes,
    createdAt: now,
  });

  if (sourceSets.length > 0) {
    await setsCol.insertMany(
      sourceSets.map((s) => ({
        _id: new ObjectId(),
        sessionId: newSessionId.toHexString(),
        userId,
        exercise: s.exercise,
        setNumber: s.setNumber,
        weight: s.weight,
        weightUnit: s.weightUnit,
        reps: s.reps,
        completed: s.completed,
        createdAt: now,
      }))
    );
  }

  return { success: true, data: { newSessionId: newSessionId.toHexString() } };
}

// ── getSessionDates ────────────────────────────────────────────────────────────
// Lightweight: returns only date strings for the heatmap (no set details)

export async function getSessionDates(
  days = 365
): Promise<ActionResult<string[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const userId = session.user.id;
  const sessionsCol = await getSessionsCollection();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const docs = await sessionsCol
    .find({ userId, date: { $gte: cutoff } })
    .project<{ date: Date }>({ date: 1 })
    .toArray();

  return {
    success: true,
    data: docs.map((d) => d.date.toISOString().slice(0, 10)),
  };
}

// ── getLastSessionSetsForExercise ─────────────────────────────────────────────

export async function getLastSessionSetsForExercise(
  exerciseName: string
): Promise<ActionResult<{ date: string; sets: { setNumber: number; weight: number; weightUnit: string; reps: number }[] } | null>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const setsCol = await getSetsCollection();
  const lastSet = await setsCol.findOne(
    { userId, exercise: exerciseName },
    { sort: { createdAt: -1 } }
  );
  if (!lastSet) return { success: true, data: null };

  const sessionSets = await setsCol
    .find({ userId, exercise: exerciseName, sessionId: lastSet.sessionId })
    .sort({ setNumber: 1 })
    .toArray();

  return {
    success: true,
    data: {
      date: lastSet.createdAt.toISOString().slice(0, 10),
      sets: sessionSets.map((s) => ({
        setNumber: s.setNumber,
        weight: s.weight,
        weightUnit: s.weightUnit ?? "lb",
        reps: s.reps,
      })),
    },
  };
}

// ── getRecentSessionsForExercise ──────────────────────────────────────────────

export async function getRecentSessionsForExercise(
  exerciseName: string,
  limit = 3
): Promise<ActionResult<{ date: string; maxWeight: number; weightUnit: string }[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const setsCol = await getSetsCollection();
  const sets = await setsCol
    .find({ userId, exercise: exerciseName })
    .sort({ createdAt: -1 })
    .toArray();

  // Group by sessionId, take last `limit` distinct sessions
  const bySession = new Map<string, { date: string; maxWeight: number; weightUnit: string }>();
  for (const s of sets) {
    const key = s.sessionId.toString();
    if (!bySession.has(key)) {
      bySession.set(key, {
        date: s.createdAt.toISOString().slice(0, 10),
        maxWeight: s.weight,
        weightUnit: s.weightUnit ?? "lb",
      });
    } else {
      const existing = bySession.get(key)!;
      if (s.weight > existing.maxWeight) existing.maxWeight = s.weight;
    }
    if (bySession.size >= limit) break;
  }

  return { success: true, data: Array.from(bySession.values()) };
}
