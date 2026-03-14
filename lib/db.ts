import clientPromise from "@/lib/mongodb";
import type { WorkoutSessionDoc, WorkoutSetDoc } from "@/types";

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
