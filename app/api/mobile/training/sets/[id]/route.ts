/**
 * PATCH  /api/mobile/training/sets/:id  — update weight, reps, completed flag
 * DELETE /api/mobile/training/sets/:id  — remove a set
 */

import { ObjectId } from "mongodb";
import { getSetsCollection } from "@/lib/db";
import {
  verifyMobileToken,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
} from "@/lib/mobile-auth";
import type { WorkoutSet } from "@/types";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFoundResponse("Set");

  try {
    const col = await getSetsCollection();
    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) return notFoundResponse("Set");
    if (existing.userId !== token.sub) return forbiddenResponse();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Request body must be JSON");
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.weight === "number") updates.weight = body.weight;
    if (typeof body.reps === "number") updates.reps = body.reps;
    if (typeof body.completed === "boolean") updates.completed = body.completed;
    if (typeof body.weightUnit === "string") updates.weightUnit = body.weightUnit;
    if (typeof body.setNumber === "number") updates.setNumber = body.setNumber;

    if (Object.keys(updates).length === 0) {
      return badRequestResponse("No updatable fields provided");
    }

    await col.updateOne({ _id: new ObjectId(id) }, { $set: updates });
    const updated = await col.findOne({ _id: new ObjectId(id) });
    if (!updated) return notFoundResponse("Set");

    const set: WorkoutSet = {
      id: updated._id.toString(),
      sessionId: updated.sessionId,
      userId: updated.userId,
      exercise: updated.exercise,
      setNumber: updated.setNumber,
      weight: updated.weight,
      weightUnit: updated.weightUnit ?? "lb",
      reps: updated.reps,
      completed: updated.completed,
      supersetGroupId: updated.supersetGroupId,
      createdAt: updated.createdAt.toISOString(),
    };

    return successResponse(set);
  } catch (err) {
    console.error("[PATCH /api/mobile/training/sets/:id]", err);
    return serverErrorResponse();
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFoundResponse("Set");

  try {
    const col = await getSetsCollection();
    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) return notFoundResponse("Set");
    if (existing.userId !== token.sub) return forbiddenResponse();

    await col.deleteOne({ _id: new ObjectId(id) });
    return successResponse({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/mobile/training/sets/:id]", err);
    return serverErrorResponse();
  }
}
