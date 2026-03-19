/**
 * POST /api/mobile/training/sets  — log a new set in a session
 *
 * Body: {
 *   sessionId: string,
 *   exercise: string,
 *   setNumber: number,
 *   weight: number,
 *   weightUnit: "lb" | "kg",
 *   reps: number,
 *   completed?: boolean,
 *   supersetGroupId?: string
 * }
 */

import { ObjectId } from "mongodb";
import { getSessionsCollection, getSetsCollection } from "@/lib/db";
import {
  verifyMobileToken,
  unauthorizedResponse,
  badRequestResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/mobile-auth";
import type { WorkoutSet } from "@/types";

export async function POST(request: Request) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  try {
    let body: {
      sessionId?: string;
      exercise?: string;
      setNumber?: number;
      weight?: number;
      weightUnit?: "lb" | "kg";
      reps?: number;
      completed?: boolean;
      supersetGroupId?: string;
    };
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Request body must be JSON");
    }

    if (!body.sessionId || !ObjectId.isValid(body.sessionId)) {
      return badRequestResponse("Valid sessionId is required");
    }
    if (!body.exercise?.trim()) return badRequestResponse("exercise is required");
    if (typeof body.weight !== "number") return badRequestResponse("weight (number) is required");
    if (typeof body.reps !== "number") return badRequestResponse("reps (number) is required");
    if (typeof body.setNumber !== "number") return badRequestResponse("setNumber (number) is required");

    // Verify the session belongs to this user
    const sessionsCol = await getSessionsCollection();
    const session = await sessionsCol.findOne({ _id: new ObjectId(body.sessionId) });
    if (!session) return badRequestResponse("Session not found");
    if (session.userId !== token.sub) return forbiddenResponse();

    const now = new Date();
    const setsCol = await getSetsCollection();
    const result = await setsCol.insertOne({
      _id: new ObjectId(),
      sessionId: body.sessionId,
      userId: token.sub,
      exercise: body.exercise.trim(),
      setNumber: body.setNumber,
      weight: body.weight,
      weightUnit: body.weightUnit ?? "lb",
      reps: body.reps,
      completed: body.completed ?? true,
      supersetGroupId: body.supersetGroupId,
      createdAt: now,
    });

    const set: WorkoutSet = {
      id: result.insertedId.toString(),
      sessionId: body.sessionId,
      userId: token.sub,
      exercise: body.exercise.trim(),
      setNumber: body.setNumber,
      weight: body.weight,
      weightUnit: body.weightUnit ?? "lb",
      reps: body.reps,
      completed: body.completed ?? true,
      supersetGroupId: body.supersetGroupId,
      createdAt: now.toISOString(),
    };

    return Response.json({ success: true, data: set }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/mobile/training/sets]", err);
    return serverErrorResponse();
  }
}
