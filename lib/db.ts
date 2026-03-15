import clientPromise from "@/lib/mongodb";
import type { DietEntryDoc, ExerciseDoc, MacroTargetDoc, PostDoc, UserDoc, WorkoutSessionDoc, WorkoutSetDoc } from "@/types";

const DB_NAME = process.env.MONGODB_DB ?? "Kifted";

export async function getDb() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

export async function getSessionsCollection() {
  const db = await getDb();
  return db.collection<WorkoutSessionDoc>("workoutSessions");
}

export async function getSetsCollection() {
  const db = await getDb();
  return db.collection<WorkoutSetDoc>("workoutSets");
}

export async function getExercisesCollection() {
  const db = await getDb();
  return db.collection<ExerciseDoc>("userExercises");
}

export async function getUsersCollection() {
  const db = await getDb();
  return db.collection<UserDoc>("users");
}

export async function getPostsCollection() {
  const db = await getDb();
  return db.collection<PostDoc>("posts");
}

export async function getDietEntriesCollection() {
  const db = await getDb();
  return db.collection<DietEntryDoc>("dietEntries");
}

export async function getMacroTargetsCollection() {
  const db = await getDb();
  return db.collection<MacroTargetDoc>("macroTargets");
}
