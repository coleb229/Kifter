"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getSessionsCollection, getSetsCollection, getExercisesCollection } from "@/lib/db";
import { DEFAULT_EXERCISES } from "@/lib/exercises";
import type { WeightUnit } from "@/lib/weight";
import type {
  ActionResult,
  AddExerciseInput,
  CreateSessionInput,
  WorkoutSession,
  WorkoutSet,
} from "@/types";

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
    .sort({ exercise: 1, setNumber: 1 })
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
    { sort: { createdAt: -1 } }
  );

  if (!lastSet) return { success: true, data: null };

  return {
    success: true,
    data: { weight: lastSet.weight, unit: lastSet.weightUnit ?? "lb" },
  };
}
