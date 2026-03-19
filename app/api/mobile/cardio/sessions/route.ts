/**
 * GET  /api/mobile/cardio/sessions  — paginated cardio session list
 * POST /api/mobile/cardio/sessions  — create a cardio session
 *
 * Query params (GET): page, limit, from, to
 */

import { ObjectId } from "mongodb";
import { getCardioSessionsCollection } from "@/lib/db";
import {
  verifyMobileToken,
  unauthorizedResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
} from "@/lib/mobile-auth";
import type { CardioSession, CreateCardioSessionInput, CARDIO_ACTIVITIES, CARDIO_INTENSITIES } from "@/types";

type CardioActivity = typeof CARDIO_ACTIVITIES[number];
type CardioIntensity = typeof CARDIO_INTENSITIES[number];

const ACTIVITIES: CardioActivity[] = ["Run","Cycle","Walk","Swim","Row","HIIT","Elliptical","Jump Rope","Stairs","Other"];
const INTENSITIES: CardioIntensity[] = ["easy","moderate","hard","max"];

export async function GET(request: Request) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const col = await getCardioSessionsCollection();
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);

    const query: Record<string, unknown> = { userId: token.sub };
    if (Object.keys(dateFilter).length > 0) query.date = dateFilter;

    const total = await col.countDocuments(query);
    const docs = await col
      .find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const sessions: CardioSession[] = docs.map((d) => ({
      id: d._id.toString(),
      userId: d.userId,
      date: d.date.toISOString(),
      activityType: d.activityType,
      duration: d.duration,
      distance: d.distance,
      distanceUnit: d.distanceUnit,
      intensity: d.intensity,
      caloriesBurned: d.caloriesBurned,
      avgHeartRate: d.avgHeartRate,
      notes: d.notes,
      createdAt: d.createdAt.toISOString(),
    }));

    return successResponse(sessions, { page, total, hasMore: page * limit < total });
  } catch (err) {
    console.error("[GET /api/mobile/cardio/sessions]", err);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  try {
    let body: Partial<CreateCardioSessionInput>;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Request body must be JSON");
    }

    if (!body.date) return badRequestResponse("date is required");
    if (!body.activityType || !ACTIVITIES.includes(body.activityType as CardioActivity)) {
      return badRequestResponse(`activityType must be one of: ${ACTIVITIES.join(", ")}`);
    }
    if (typeof body.duration !== "number" || body.duration <= 0) {
      return badRequestResponse("duration (positive number, in minutes) is required");
    }
    if (!body.intensity || !INTENSITIES.includes(body.intensity as CardioIntensity)) {
      return badRequestResponse(`intensity must be one of: ${INTENSITIES.join(", ")}`);
    }

    const now = new Date();
    const col = await getCardioSessionsCollection();
    const result = await col.insertOne({
      _id: new ObjectId(),
      userId: token.sub,
      date: new Date(body.date),
      activityType: body.activityType as CardioActivity,
      duration: body.duration,
      distance: body.distance,
      distanceUnit: body.distanceUnit,
      intensity: body.intensity as CardioIntensity,
      caloriesBurned: body.caloriesBurned,
      avgHeartRate: body.avgHeartRate,
      notes: body.notes?.trim(),
      createdAt: now,
    });

    const session: CardioSession = {
      id: result.insertedId.toString(),
      userId: token.sub,
      date: new Date(body.date).toISOString(),
      activityType: body.activityType as CardioActivity,
      duration: body.duration,
      distance: body.distance,
      distanceUnit: body.distanceUnit,
      intensity: body.intensity as CardioIntensity,
      caloriesBurned: body.caloriesBurned,
      avgHeartRate: body.avgHeartRate,
      notes: body.notes?.trim(),
      createdAt: now.toISOString(),
    };

    return Response.json({ success: true, data: session }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/mobile/cardio/sessions]", err);
    return serverErrorResponse();
  }
}
