import clientPromise from "@/lib/mongodb";
import type { CardioSessionDoc, CommunityFoodDoc, DietEntryDoc, ExerciseDoc, MacroTargetDoc, PostDoc, UserDoc, WorkoutSessionDoc, WorkoutSetDoc, UserBlockDoc, SiteSettingsDoc } from "@/types";

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

export async function getCommunityFoodsCollection() {
  const db = await getDb();
  return db.collection<CommunityFoodDoc>("communityFoods");
}

export async function getCardioSessionsCollection() {
  const db = await getDb();
  return db.collection<CardioSessionDoc>("cardioSessions");
}

export async function getUserBlocksCollection() {
  const db = await getDb();
  return db.collection<UserBlockDoc>("userBlocks");
}

export async function getSiteSettingsCollection() {
  const db = await getDb();
  return db.collection<SiteSettingsDoc>("siteSettings");
}
