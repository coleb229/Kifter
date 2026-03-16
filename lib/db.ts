import clientPromise from "@/lib/mongodb";
import type { AiUsageDoc, BodyWeightDoc, BugReportDoc, CardioSessionDoc, ChallengeDoc, CommunityFoodDoc, DietEntryDoc, ExerciseDoc, FavoriteFoodDoc, GoalDoc, InjuryDoc, MacroTargetDoc, MealTemplateDoc, PhysiqueMeasurementDoc, PostDoc, PostKudosDoc, PostLikeDoc, PostCommentDoc, ProgressPhotoDoc, StreakDoc, SupplementLogDoc, UserDoc, WorkoutProgramDoc, WorkoutSessionDoc, WorkoutSetDoc, UserBlockDoc, SiteSettingsDoc } from "@/types";

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

export async function getBodyWeightCollection() {
  const db = await getDb();
  return db.collection<BodyWeightDoc>("bodyWeight");
}

export async function getMealTemplatesCollection() {
  const db = await getDb();
  return db.collection<MealTemplateDoc>("mealTemplates");
}

export async function getGoalsCollection() {
  const db = await getDb();
  return db.collection<GoalDoc>("goals");
}

export async function getPostLikesCollection() {
  const db = await getDb();
  return db.collection<PostLikeDoc>("postLikes");
}

export async function getPostCommentsCollection() {
  const db = await getDb();
  return db.collection<PostCommentDoc>("postComments");
}

export async function getWorkoutProgramsCollection() {
  const db = await getDb();
  return db.collection<WorkoutProgramDoc>("workoutPrograms");
}

export async function getAiUsageCollection() {
  const db = await getDb();
  return db.collection<AiUsageDoc>("aiUsage");
}

export async function getProgressPhotosCollection() {
  const db = await getDb();
  return db.collection<ProgressPhotoDoc>("progressPhotos");
}

export async function getInjuriesCollection() {
  const db = await getDb();
  return db.collection<InjuryDoc>("injuries");
}

export async function getChallengesCollection() {
  const db = await getDb();
  return db.collection<ChallengeDoc>("challenges");
}

export async function getPhysiqueMeasurementsCollection() {
  const db = await getDb();
  return db.collection<PhysiqueMeasurementDoc>("physiqueMeasurements");
}

export async function getSupplementLogsCollection() {
  const db = await getDb();
  return db.collection<SupplementLogDoc>("supplementLogs");
}

export async function getStreaksCollection() {
  const db = await getDb();
  return db.collection<StreakDoc>("streaks");
}

export async function getPostKudosCollection() {
  const db = await getDb();
  return db.collection<PostKudosDoc>("postKudos");
}

export async function getBugReportsCollection() {
  const db = await getDb();
  return db.collection<BugReportDoc>("bugReports");
}

export async function getFavoriteFoodsCollection() {
  const db = await getDb();
  return db.collection<FavoriteFoodDoc>("favoriteFoods");
}
