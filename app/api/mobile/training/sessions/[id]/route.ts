/**
 * GET    /api/mobile/training/sessions/:id  — fetch one session + its sets
 * PATCH  /api/mobile/training/sessions/:id  — update name, notes, bodyTarget, date
 * DELETE /api/mobile/training/sessions/:id  — delete session and all its sets
 */

import { ObjectId } from "mongodb";
import { getSessionsCollection, getSetsCollection } from "@/lib/db";
import {
  verifyMobileToken,
  unauthorizedResponse,
  notFoundResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
  forbiddenResponse,
} from "@/lib/mobile-auth";
import type { WorkoutSession, WorkoutSet } from "@/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFoundResponse("Session");

  try {
    const sessionsCol = await getSessionsCollection();
    const doc = await sessionsCol.findOne({ _id: new ObjectId(id) });
    if (!doc) return notFoundResponse("Session");
    if (doc.userId !== token.sub) return forbiddenResponse();

    const setsCol = await getSetsCollection();
    const setDocs = await setsCol
      .find({ sessionId: id, userId: token.sub })
      .sort({ exercise: 1, setNumber: 1 })
      .toArray();

    const sets: WorkoutSet[] = setDocs.map((s) => ({
      id: s._id.toString(),
      sessionId: s.sessionId,
      userId: s.userId,
      exercise: s.exercise,
      setNumber: s.setNumber,
      weight: s.weight,
      weightUnit: s.weightUnit ?? "lb",
      reps: s.reps,
      completed: s.completed,
      supersetGroupId: s.supersetGroupId,
      createdAt: s.createdAt.toISOString(),
    }));

    const session: WorkoutSession & { sets: WorkoutSet[] } = {
      id: doc._id.toString(),
      userId: doc.userId,
      date: doc.date.toISOString(),
      name: doc.name,
      bodyTarget: doc.bodyTarget,
      notes: doc.notes,
      appleHealth: doc.appleHealth,
      createdAt: doc.createdAt.toISOString(),
      setCount: sets.length,
      exerciseNames: [...new Set(sets.map((s) => s.exercise))],
      sets,
    };

    return successResponse(session);
  } catch (err) {
    console.error("[GET /api/mobile/training/sessions/:id]", err);
    return serverErrorResponse();
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFoundResponse("Session");

  try {
    const sessionsCol = await getSessionsCollection();
    const existing = await sessionsCol.findOne({ _id: new ObjectId(id) });
    if (!existing) return notFoundResponse("Session");
    if (existing.userId !== token.sub) return forbiddenResponse();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Request body must be JSON");
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.name === "string") updates.name = body.name.trim() || undefined;
    if (typeof body.notes === "string") updates.notes = body.notes.trim() || undefined;
    if (typeof body.bodyTarget === "string") updates.bodyTarget = body.bodyTarget;
    if (typeof body.date === "string") updates.date = new Date(body.date);

    if (Object.keys(updates).length === 0) {
      return badRequestResponse("No updatable fields provided");
    }

    await sessionsCol.updateOne({ _id: new ObjectId(id) }, { $set: updates });
    const updated = await sessionsCol.findOne({ _id: new ObjectId(id) });
    if (!updated) return notFoundResponse("Session");

    const session: WorkoutSession = {
      id: updated._id.toString(),
      userId: updated.userId,
      date: updated.date.toISOString(),
      name: updated.name,
      bodyTarget: updated.bodyTarget,
      notes: updated.notes,
      appleHealth: updated.appleHealth,
      createdAt: updated.createdAt.toISOString(),
    };

    return successResponse(session);
  } catch (err) {
    console.error("[PATCH /api/mobile/training/sessions/:id]", err);
    return serverErrorResponse();
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFoundResponse("Session");

  try {
    const sessionsCol = await getSessionsCollection();
    const existing = await sessionsCol.findOne({ _id: new ObjectId(id) });
    if (!existing) return notFoundResponse("Session");
    if (existing.userId !== token.sub) return forbiddenResponse();

    // Delete session and all its sets atomically (best-effort)
    const setsCol = await getSetsCollection();
    await Promise.all([
      sessionsCol.deleteOne({ _id: new ObjectId(id) }),
      setsCol.deleteMany({ sessionId: id, userId: token.sub }),
    ]);

    return successResponse({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/mobile/training/sessions/:id]", err);
    return serverErrorResponse();
  }
}
