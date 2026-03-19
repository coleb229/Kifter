/**
 * GET  /api/mobile/goals  — all goals for the user
 * POST /api/mobile/goals  — create a new goal
 */

import { ObjectId } from "mongodb";
import { getGoalsCollection } from "@/lib/db";
import {
  verifyMobileToken,
  unauthorizedResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
} from "@/lib/mobile-auth";
import type { Goal } from "@/types";

const GOAL_TYPES = ["body_weight", "workout_count", "cardio_distance", "exercise_1rm"] as const;

export async function GET(request: Request) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  try {
    const col = await getGoalsCollection();
    const docs = await col
      .find({ userId: token.sub })
      .sort({ createdAt: -1 })
      .toArray();

    const goals: Goal[] = docs.map((d) => ({
      id: d._id.toString(),
      type: d.type,
      title: d.title,
      targetValue: d.targetValue,
      unit: d.unit,
      exerciseName: d.exerciseName,
      currentValue: d.currentValue,
      status: d.status,
      targetDate: d.targetDate,
      achievedAt: d.achievedAt?.toISOString(),
      createdAt: d.createdAt.toISOString(),
    }));

    return successResponse(goals);
  } catch (err) {
    console.error("[GET /api/mobile/goals]", err);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  try {
    let body: {
      type?: string;
      title?: string;
      targetValue?: number;
      unit?: string;
      exerciseName?: string;
      targetDate?: string;
    };
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Request body must be JSON");
    }

    if (!body.type || !GOAL_TYPES.includes(body.type as (typeof GOAL_TYPES)[number])) {
      return badRequestResponse(`type must be one of: ${GOAL_TYPES.join(", ")}`);
    }
    if (!body.title?.trim()) return badRequestResponse("title is required");
    if (typeof body.targetValue !== "number") return badRequestResponse("targetValue (number) is required");
    if (!body.unit?.trim()) return badRequestResponse("unit is required");

    const now = new Date();
    const col = await getGoalsCollection();
    const result = await col.insertOne({
      _id: new ObjectId(),
      userId: token.sub,
      type: body.type as Goal["type"],
      title: body.title.trim(),
      targetValue: body.targetValue,
      unit: body.unit.trim(),
      exerciseName: body.exerciseName?.trim(),
      currentValue: 0,
      status: "active",
      targetDate: body.targetDate,
      createdAt: now,
    });

    const goal: Goal = {
      id: result.insertedId.toString(),
      type: body.type as Goal["type"],
      title: body.title.trim(),
      targetValue: body.targetValue,
      unit: body.unit.trim(),
      exerciseName: body.exerciseName?.trim(),
      currentValue: 0,
      status: "active",
      targetDate: body.targetDate,
      createdAt: now.toISOString(),
    };

    return Response.json({ success: true, data: goal }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/mobile/goals]", err);
    return serverErrorResponse();
  }
}
