import type { ObjectId } from "mongodb";
import type { WeightUnit } from "@/lib/weight";

// ── Body target options ───────────────────────────────────────────────────────

export const BODY_TARGETS = [
  "Push",
  "Pull",
  "Legs",
  "Upper Body",
  "Lower Body",
  "Full Body",
  "Core",
  "Cardio",
  "Other",
] as const;

export type BodyTarget = (typeof BODY_TARGETS)[number];

// ── MongoDB document shapes (raw) ─────────────────────────────────────────────

export interface WorkoutSessionAppleHealth {
  activityType: string;   // original HK type e.g. "HKWorkoutActivityTypeCoreTraining"
  label: string;          // human label e.g. "Core Training"
  duration: number;       // minutes
  caloriesBurned?: number;
  heartRateAvg?: number;
  heartRateMin?: number;
  heartRateMax?: number;
}

export interface WorkoutSessionDoc {
  _id: ObjectId;
  userId: string;
  date: Date;
  name?: string;
  bodyTarget: BodyTarget;
  notes?: string;
  appleHealth?: WorkoutSessionAppleHealth;
  createdAt: Date;
}

export interface WorkoutSetDoc {
  _id: ObjectId;
  sessionId: string;
  userId: string;
  exercise: string;
  setNumber: number;
  weight: number;
  weightUnit?: WeightUnit;
  reps: number;
  completed: boolean;
  createdAt: Date;
}

export interface ExerciseDoc {
  _id: ObjectId;
  userId: string;
  name: string;
  videoUrl?: string;
  createdAt: Date;
}

// ── Serialized shapes (safe to pass Server → Client) ──────────────────────────

export interface WorkoutSession {
  id: string;
  userId: string;
  date: string;
  name?: string;
  bodyTarget: BodyTarget;
  notes?: string;
  appleHealth?: WorkoutSessionAppleHealth;
  createdAt: string;
  setCount?: number;
  exerciseNames?: string[];
}

export interface WorkoutSet {
  id: string;
  sessionId: string;
  userId: string;
  exercise: string;
  setNumber: number;
  weight: number;
  weightUnit: WeightUnit;
  reps: number;
  completed: boolean;
  createdAt: string;
}

// ── Form input shapes ─────────────────────────────────────────────────────────

export interface SetInput {
  setNumber: number;
  weight: number;
  weightUnit: WeightUnit;
  reps: number;
}

export interface CreateSessionInput {
  name?: string;
  date: string;
  bodyTarget: BodyTarget;
  notes?: string;
}

export interface AddExerciseInput {
  exercise: string;
  sets: SetInput[];
}

// ── Server action result ──────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ── User roles ────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "member" | "restricted";

// ── User document (NextAuth adapter `users` collection + custom fields) ───────

export interface UserDoc {
  _id: ObjectId;
  name?: string;
  email: string;
  image?: string;
  emailVerified?: Date | null;
  // custom fields
  role?: UserRole;
  bio?: string;
  displayName?: string;
  profileImage?: string;
  profileImages?: string[];
  preferences?: {
    defaultWeightUnit?: "lb" | "kg";
    theme?: "light" | "dark" | "system";
    accentColor?: "indigo" | "violet" | "rose" | "emerald" | "amber";
    profileVisibility?: {
      showTraining?: boolean;
      showNutrition?: boolean;
      showCardio?: boolean;
      showBodyMetrics?: boolean;
    };
    showOnLeaderboard?: boolean;
    dashboardWidgets?: string[];
  };
  restrictions?: {
    training?: boolean;
    nutrition?: boolean;
    cardio?: boolean;
    community?: boolean;
  };
  aiRateLimit?: {
    dailyLimit?: number;  // overrides site default; 0 = unlimited
    disabled?: boolean;   // block AI entirely for this user
  };
  bannedAt?: Date;
  createdAt?: Date;
}

// ── Serialized user (safe for client) ────────────────────────────────────────

export interface UserSummary {
  id: string;
  name?: string;
  email: string;
  image?: string;
  role: UserRole;
  bio?: string;
  displayName?: string;
  profileImage?: string;
  profileImages?: string[];
  preferences?: {
    defaultWeightUnit?: "lb" | "kg";
    theme?: "light" | "dark" | "system";
    accentColor?: "indigo" | "violet" | "rose" | "emerald" | "amber";
    profileVisibility?: {
      showTraining?: boolean;
      showNutrition?: boolean;
      showCardio?: boolean;
      showBodyMetrics?: boolean;
    };
    showOnLeaderboard?: boolean;
    dashboardWidgets?: string[];
  };
  restrictions?: {
    training?: boolean;
    nutrition?: boolean;
    cardio?: boolean;
    community?: boolean;
  };
  aiRateLimit?: {
    dailyLimit?: number;
    disabled?: boolean;
  };
  bannedAt?: string;
  createdAt?: string;
}

// ── User block document ───────────────────────────────────────────────────────

export interface UserBlockDoc {
  _id: ObjectId;
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}

// ── AI usage tracking ─────────────────────────────────────────────────────────

export interface AiUsageDoc {
  _id: string; // "userId:YYYY-MM-DD"
  userId: string;
  date: string; // "YYYY-MM-DD"
  count: number;
  updatedAt: Date;
}

// ── Site settings document ────────────────────────────────────────────────────

export interface SiteSettingsDoc {
  _id: string; // "global"
  maintenanceMode: boolean;
  features: {
    training: boolean;
    nutrition: boolean;
    cardio: boolean;
    community: boolean;
  };
  aiRateLimits?: {
    enabled: boolean;
    sitewideDailyLimit: number;   // 0 = unlimited
    defaultUserDailyLimit: number; // 0 = unlimited, applies per user
  };
  integrations?: {
    anthropic?: {
      defaultModel?: "claude-haiku-4-5-20251001" | "claude-sonnet-4-6" | "claude-opus-4-6";
    };
    google?: {
      allowNewRegistrations?: boolean;
      allowedDomains?: string;
    };
    uploadthing?: {
      maxFileSizeMb?: number;
    };
    appleHealth?: {
      enabled?: boolean;
      maxFileSizeMb?: number;
      deduplicateByDate?: boolean;
    };
  };
}

// ── Post document ─────────────────────────────────────────────────────────────

export interface PostDoc {
  _id: ObjectId;
  userId: string;
  content: string;
  type: "progress" | "general";
  createdAt: Date;
}

export interface PostLikeDoc {
  _id: ObjectId;
  postId: string;
  userId: string;
  createdAt: Date;
}

export interface PostCommentDoc {
  _id: ObjectId;
  postId: string;
  userId: string;
  authorName: string;
  authorImage?: string;
  content: string;
  createdAt: Date;
}

// ── Diet / Nutrition ─────────────────────────────────────────────────────────

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export interface DietEntryDoc {
  _id: ObjectId;
  userId: string;
  date: Date;
  mealType: MealType;
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
  createdAt: Date;
}

export interface DietEntry {
  id: string;
  userId: string;
  date: string;
  mealType: MealType;
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
  createdAt: string;
}

export interface MacroTargetDoc {
  _id: ObjectId;
  userId: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  updatedAt: Date;
}

export interface MacroTarget {
  id: string;
  userId: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  updatedAt: string;
}

export interface CreateDietEntryInput {
  date: string;
  mealType: MealType;
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
}

export interface UpdateDietEntryInput {
  mealType?: MealType;
  food?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string;
}

export interface DietDaySummary {
  date: string; // "yyyy-MM-dd"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  entryCount: number;
}

// ── Community Foods ───────────────────────────────────────────────────────────

export interface CommunityFoodDoc {
  _id: ObjectId;
  submittedBy: string;   // userId
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
  createdAt: Date;
}

export interface CommunityFood {
  id: string;
  submittedBy: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
  createdAt: string;
}

export interface SubmitCommunityFoodInput {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
}

// ── Cardio ────────────────────────────────────────────────────────────────────

export const CARDIO_ACTIVITIES = [
  "Run",
  "Cycle",
  "Walk",
  "Swim",
  "Row",
  "HIIT",
  "Elliptical",
  "Jump Rope",
  "Stairs",
  "Other",
] as const;
export type CardioActivity = (typeof CARDIO_ACTIVITIES)[number];

export const CARDIO_INTENSITIES = ["easy", "moderate", "hard", "max"] as const;
export type CardioIntensity = (typeof CARDIO_INTENSITIES)[number];

export interface CardioSessionDoc {
  _id: ObjectId;
  userId: string;
  date: Date;
  activityType: CardioActivity;
  duration: number; // minutes
  distance?: number;
  distanceUnit?: "km" | "mi";
  intensity: CardioIntensity;
  caloriesBurned?: number;
  avgHeartRate?: number;
  notes?: string;
  createdAt: Date;
}

export interface CardioSession {
  id: string;
  userId: string;
  date: string;
  activityType: CardioActivity;
  duration: number;
  distance?: number;
  distanceUnit?: "km" | "mi";
  intensity: CardioIntensity;
  caloriesBurned?: number;
  avgHeartRate?: number;
  notes?: string;
  createdAt: string;
}

export interface CreateCardioSessionInput {
  date: string;
  activityType: CardioActivity;
  duration: number;
  distance?: number;
  distanceUnit?: "km" | "mi";
  intensity: CardioIntensity;
  caloriesBurned?: number;
  avgHeartRate?: number;
  notes?: string;
}

export interface UpdateCardioSessionInput {
  date?: string;
  activityType?: CardioActivity;
  duration?: number;
  distance?: number;
  distanceUnit?: "km" | "mi";
  intensity?: CardioIntensity;
  caloriesBurned?: number;
  avgHeartRate?: number;
  notes?: string;
}

export interface CardioWeekSummary {
  date: string; // "yyyy-MM-dd"
  totalMinutes: number;
  sessionCount: number;
  totalDistance: number; // always in km for consistency
}

// ── Progress photos ───────────────────────────────────────────────────────────

export interface ProgressPhotoDoc {
  _id: ObjectId;
  userId: string;
  photoUrl: string;
  date: string; // "YYYY-MM-DD"
  notes?: string;
  createdAt: Date;
}

export interface ProgressPhoto {
  id: string;
  photoUrl: string;
  date: string;
  notes?: string;
  createdAt: string;
}

// ── Body weight ───────────────────────────────────────────────────────────────

export interface BodyWeightDoc {
  _id: ObjectId;
  userId: string;
  date: string; // "YYYY-MM-DD"
  weight: number;
  weightUnit: WeightUnit;
  notes?: string;
  createdAt: Date;
}

export interface BodyWeightEntry {
  id: string;
  date: string;
  weight: number;
  weightUnit: WeightUnit;
  notes?: string;
  createdAt: string;
}

// ── Meal templates ────────────────────────────────────────────────────────────

export interface MealTemplateItem {
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: MealType;
}

export interface MealTemplateDoc {
  _id: ObjectId;
  userId: string;
  name: string;
  items: MealTemplateItem[];
  createdAt: Date;
}

export interface MealTemplate {
  id: string;
  name: string;
  items: MealTemplateItem[];
  createdAt: string;
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export type GoalType = "body_weight" | "workout_count" | "cardio_distance" | "exercise_1rm";
export type GoalStatus = "active" | "achieved" | "cancelled";

export interface GoalDoc {
  _id: ObjectId;
  userId: string;
  type: GoalType;
  title: string;
  targetValue: number;
  unit: string;
  exerciseName?: string; // for exercise_1rm goals
  currentValue?: number;
  status: GoalStatus;
  targetDate?: string;
  achievedAt?: Date;
  createdAt: Date;
}

export interface Goal {
  id: string;
  type: GoalType;
  title: string;
  targetValue: number;
  unit: string;
  exerciseName?: string;
  currentValue?: number;
  status: GoalStatus;
  targetDate?: string;
  achievedAt?: string;
  createdAt: string;
}

export interface GoalAlert {
  goalId: string;
  title: string;
  type: "approaching" | "achieved";
  progressPct: number;
}

// ── Workout Programs ─────────────────────────────────────────────────────────

export interface ProgramExercise {
  exercise: string;
  sets: number;
  reps: number;
  weight?: number;
  weightUnit?: WeightUnit;
}

export interface ProgramDay {
  dayLabel: string;
  bodyTarget: BodyTarget;
  exercises: ProgramExercise[];
}

export interface WorkoutProgramDoc {
  _id: ObjectId;
  userId: string;
  name: string;
  description?: string;
  days: ProgramDay[];
  createdAt: Date;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  description?: string;
  days: ProgramDay[];
  createdAt: string;
}

// ── AI Insights ──────────────────────────────────────────────────────────────

export type InsightType = "progress" | "suggestion" | "warning" | "achievement";

export interface AIInsight {
  type: InsightType;
  title: string;
  body: string;
}

// ── Injury / Soreness Log ─────────────────────────────────────────────────────

export const MUSCLE_GROUPS = [
  "Chest", "Shoulders", "Triceps", "Biceps", "Back",
  "Core", "Quads", "Hamstrings", "Glutes", "Calves", "Hip Flexors", "Other",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
export type SeverityLevel = "mild" | "moderate" | "severe";

export interface InjuryDoc {
  _id: ObjectId;
  userId: string;
  muscleGroup: MuscleGroup;
  severity: SeverityLevel;
  notes?: string;
  startDate: string;
  expectedRecoveryDate?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface Injury {
  id: string;
  userId: string;
  muscleGroup: MuscleGroup;
  severity: SeverityLevel;
  notes?: string;
  startDate: string;
  expectedRecoveryDate?: string;
  resolvedAt?: string;
  createdAt: string;
}

// ── Social Challenges ─────────────────────────────────────────────────────────

export type ChallengeMetric = "workout_count" | "cardio_distance" | "total_volume";
export type ChallengeStatus = "active" | "completed" | "cancelled";

export interface ChallengeDoc {
  _id: ObjectId;
  title: string;
  description?: string;
  creatorId: string;
  metric: ChallengeMetric;
  targetValue: number;
  startDate: string;
  endDate: string;
  participantIds: string[];
  status: ChallengeStatus;
  createdAt: Date;
}

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  creatorName: string;
  metric: ChallengeMetric;
  targetValue: number;
  startDate: string;
  endDate: string;
  participantCount: number;
  isParticipating: boolean;
  myCurrentValue: number;
  myPercentComplete: number;
  status: ChallengeStatus;
  daysRemaining: number;
  createdAt: string;
}

export interface ChallengeParticipant {
  userId: string;
  displayName: string;
  profileImage?: string;
  currentValue: number;
  percentComplete: number;
}

// ── Serialized post (author joined) ──────────────────────────────────────────

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  authorImage?: string;
  authorRole: UserRole;
  content: string;
  type: "progress" | "general";
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  kudosCounts: Record<KudosType, number>;
  myKudos?: KudosType;
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  authorImage?: string;
  content: string;
  createdAt: string;
}

// ── Physique Measurements ─────────────────────────────────────────────────────

export type MeasurementUnit = "cm" | "in";

export interface PhysiqueMeasurementDoc {
  _id: ObjectId;
  userId: string;
  date: string; // "YYYY-MM-DD"
  unit: MeasurementUnit;
  neck?: number;
  waist?: number;
  hips?: number;
  chest?: number;
  bicepsL?: number;
  bicepsR?: number;
  thighL?: number;
  thighR?: number;
  height?: number; // used for body fat calculation
  createdAt: Date;
}

export interface PhysiqueMeasurement {
  id: string;
  date: string;
  unit: MeasurementUnit;
  neck?: number;
  waist?: number;
  hips?: number;
  chest?: number;
  bicepsL?: number;
  bicepsR?: number;
  thighL?: number;
  thighR?: number;
  height?: number;
  createdAt: string;
}

// ── Supplement Log ─────────────────────────────────────────────────────────────

export const SUPPLEMENT_TIMINGS = ["morning", "pre-workout", "post-workout", "with-meal", "bedtime", "other"] as const;
export type SupplementTiming = (typeof SUPPLEMENT_TIMINGS)[number];

export interface SupplementLogDoc {
  _id: ObjectId;
  userId: string;
  date: string; // "YYYY-MM-DD"
  name: string;
  dosage: string; // e.g. "5g", "1 scoop", "2 capsules"
  timing: SupplementTiming;
  notes?: string;
  createdAt: Date;
}

export interface SupplementLog {
  id: string;
  date: string;
  name: string;
  dosage: string;
  timing: SupplementTiming;
  notes?: string;
  createdAt: string;
}

// ── Streak ────────────────────────────────────────────────────────────────────

export interface StreakDoc {
  _id: ObjectId;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string; // "YYYY-MM-DD" UTC
  freezeTokens: number;    // 0–3
  updatedAt: Date;
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string;
  freezeTokens: number;
}

// ── Kudos reactions ───────────────────────────────────────────────────────────

export type KudosType = "fire" | "rocket" | "heart" | "muscle";

export interface PostKudosDoc {
  _id: ObjectId;
  postId: string;
  userId: string;
  kudosType: KudosType;
  createdAt: Date;
}
