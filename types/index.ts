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

export interface WorkoutSessionDoc {
  _id: ObjectId;
  userId: string;
  date: Date;
  name?: string;
  bodyTarget: BodyTarget;
  notes?: string;
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
  preferences?: {
    defaultWeightUnit?: "lb" | "kg";
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
  preferences?: {
    defaultWeightUnit?: "lb" | "kg";
  };
  bannedAt?: string;
  createdAt?: string;
}

// ── Post document ─────────────────────────────────────────────────────────────

export interface PostDoc {
  _id: ObjectId;
  userId: string;
  content: string;
  type: "progress" | "general";
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

// ── AI Insights ──────────────────────────────────────────────────────────────

export type InsightType = "progress" | "suggestion" | "warning" | "achievement";

export interface AIInsight {
  type: InsightType;
  title: string;
  body: string;
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
  createdAt: string;
}
