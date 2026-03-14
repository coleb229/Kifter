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
