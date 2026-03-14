import type { ObjectId } from "mongodb";

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
  reps: number;
  completed: boolean;
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
  reps: number;
  completed: boolean;
  createdAt: string;
}

// ── Form input shapes ─────────────────────────────────────────────────────────

export interface SetInput {
  setNumber: number;
  weight: number;
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
