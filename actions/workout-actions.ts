"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getSessionsCollection, getSetsCollection } from "@/lib/db";
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
    reps: set.reps,
    completed: true,
    createdAt: now,
  }));

  await setsCol.insertMany(setDocs);

  return { success: true, data: undefined };
}

// ── getWorkoutSessions ────────────────────────────────────────────────────────

export async function getWorkoutSessions(
  limit = 20
): Promise<ActionResult<WorkoutSession[]>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const userId = session.user.id;
  const sessionsCol = await getSessionsCollection();
  const setsCol = await getSetsCollection();

  const docs = await sessionsCol
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

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
        reps: s.reps,
        completed: s.completed,
        createdAt: s.createdAt.toISOString(),
      })),
    },
  };
}
