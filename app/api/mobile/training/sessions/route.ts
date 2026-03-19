/**
 * GET  /api/mobile/training/sessions   — paginated session list
 * POST /api/mobile/training/sessions   — create a new session
 *
 * Query params (GET):
 *   page    (default 1)
 *   limit   (default 20, max 50)
 *   from    ISO date string — filter sessions on or after this date
 *   to      ISO date string — filter sessions on or before this date
 */

import { ObjectId } from "mongodb";
import { getSessionsCollection, getSetsCollection } from "@/lib/db";
import {
  verifyMobileToken,
  unauthorizedResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
} from "@/lib/mobile-auth";
import type { WorkoutSession, CreateSessionInput, BODY_TARGETS } from "@/types";

type BodyTarget = typeof BODY_TARGETS[number];

export async function GET(request: Request) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const sessionsCol = await getSessionsCollection();

    // Build date filter if provided
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);

    const query: Record<string, unknown> = { userId: token.sub };
    if (Object.keys(dateFilter).length > 0) query.date = dateFilter;

    const total = await sessionsCol.countDocuments(query);
    const docs = await sessionsCol
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // For each session, also fetch a lightweight set summary (exercise names + count)
    const setsCol = await getSetsCollection();
    const sessionIds = docs.map((d) => d._id.toString());

    // Aggregate: group sets by sessionId → unique exercise names + set count
    const setAgg = await setsCol
      .aggregate([
        { $match: { sessionId: { $in: sessionIds }, userId: token.sub } },
        {
          $group: {
            _id: "$sessionId",
            setCount: { $sum: 1 },
            exercises: { $addToSet: "$exercise" },
          },
        },
      ])
      .toArray();

    const setsBySession = new Map(
      setAgg.map((a) => [a._id as string, { setCount: a.setCount as number, exerciseNames: a.exercises as string[] }])
    );

    const sessions: WorkoutSession[] = docs.map((doc) => {
      const summary = setsBySession.get(doc._id.toString());
      return {
        id: doc._id.toString(),
        userId: doc.userId,
        date: doc.date.toISOString(),
        name: doc.name,
        bodyTarget: doc.bodyTarget,
        notes: doc.notes,
        appleHealth: doc.appleHealth,
        createdAt: doc.createdAt.toISOString(),
        setCount: summary?.setCount ?? 0,
        exerciseNames: summary?.exerciseNames ?? [],
      };
    });

    return successResponse(sessions, {
      page,
      total,
      hasMore: page * limit < total,
    });
  } catch (err) {
    console.error("[GET /api/mobile/training/sessions]", err);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  try {
    let body: Partial<CreateSessionInput>;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Request body must be JSON");
    }

    const BODY_TARGETS_LIST: BodyTarget[] = [
      "Push", "Pull", "Legs", "Upper Body", "Lower Body",
      "Full Body", "Core", "Cardio", "Other",
    ];

    if (!body.date) return badRequestResponse("date is required");
    if (!body.bodyTarget || !BODY_TARGETS_LIST.includes(body.bodyTarget as BodyTarget)) {
      return badRequestResponse(`bodyTarget must be one of: ${BODY_TARGETS_LIST.join(", ")}`);
    }

    const now = new Date();
    const col = await getSessionsCollection();
    const result = await col.insertOne({
      _id: new ObjectId(),
      userId: token.sub,
      date: new Date(body.date),
      name: body.name?.trim() || undefined,
      bodyTarget: body.bodyTarget as BodyTarget,
      notes: body.notes?.trim() || undefined,
      createdAt: now,
    });

    const session: WorkoutSession = {
      id: result.insertedId.toString(),
      userId: token.sub,
      date: new Date(body.date).toISOString(),
      name: body.name?.trim(),
      bodyTarget: body.bodyTarget as BodyTarget,
      notes: body.notes?.trim(),
      createdAt: now.toISOString(),
      setCount: 0,
      exerciseNames: [],
    };

    return Response.json({ success: true, data: session }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/mobile/training/sessions]", err);
    return serverErrorResponse();
  }
}
