"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getWorkoutProgramsCollection, getSessionsCollection, getSetsCollection } from "@/lib/db";
import type { ActionResult, ProgramDay, WorkoutProgram, WorkoutSessionDoc, WorkoutSetDoc } from "@/types";

export async function getPrograms(): Promise<ActionResult<WorkoutProgram[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const col = await getWorkoutProgramsCollection();
    const docs = await col
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return {
      success: true,
      data: docs.map((d) => ({
        id: d._id.toHexString(),
        name: d.name,
        description: d.description,
        days: d.days,
        createdAt: d.createdAt.toISOString(),
      })),
    };
  } catch {
    return { success: false, error: "Failed to fetch programs" };
  }
}

export async function createProgram(
  name: string,
  description: string,
  days: ProgramDay[]
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const trimmedName = name.trim().slice(0, 80);
  if (!trimmedName) return { success: false, error: "Program name is required" };
  if (!days.length) return { success: false, error: "Add at least one day" };

  try {
    const col = await getWorkoutProgramsCollection();
    const doc = {
      _id: new ObjectId(),
      userId: session.user.id,
      name: trimmedName,
      description: description.trim().slice(0, 300) || undefined,
      days,
      createdAt: new Date(),
    };
    await col.insertOne(doc);
    return { success: true, data: { id: doc._id.toHexString() } };
  } catch {
    return { success: false, error: "Failed to create program" };
  }
}

export async function deleteProgram(programId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const col = await getWorkoutProgramsCollection();
    await col.deleteOne({ _id: new ObjectId(programId), userId: session.user.id });
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete program" };
  }
}

export async function applyProgram(
  programId: string,
  startDate: string // "YYYY-MM-DD"
): Promise<ActionResult<{ sessions: number }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const col = await getWorkoutProgramsCollection();
    const program = await col.findOne({
      _id: new ObjectId(programId),
      userId: session.user.id,
    });
    if (!program) return { success: false, error: "Program not found" };

    const sessionsCol = await getSessionsCollection();
    const setsCol = await getSetsCollection();
    const userId = session.user.id;

    for (let i = 0; i < program.days.length; i++) {
      const day = program.days[i];
      const date = new Date(startDate + "T00:00:00");
      date.setDate(date.getDate() + i);

      const sessionDoc: WorkoutSessionDoc = {
        _id: new ObjectId(),
        userId,
        date,
        name: day.dayLabel || undefined,
        bodyTarget: day.bodyTarget,
        createdAt: new Date(),
      };
      await sessionsCol.insertOne(sessionDoc);

      const sessionId = sessionDoc._id.toHexString();
      const setDocs: WorkoutSetDoc[] = [];

      for (let j = 0; j < day.exercises.length; j++) {
        const ex = day.exercises[j];
        for (let s = 1; s <= ex.sets; s++) {
          setDocs.push({
            _id: new ObjectId(),
            sessionId,
            userId,
            exercise: ex.exercise,
            setNumber: s,
            weight: ex.weight ?? 0,
            weightUnit: ex.weightUnit ?? "lb",
            reps: ex.reps,
            completed: false,
            createdAt: new Date(),
          });
        }
      }

      if (setDocs.length) await setsCol.insertMany(setDocs);
    }

    return { success: true, data: { sessions: program.days.length } };
  } catch {
    return { success: false, error: "Failed to apply program" };
  }
}
