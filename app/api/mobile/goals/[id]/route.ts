/**
 * PATCH  /api/mobile/goals/:id  — update status, currentValue, title, etc.
 * DELETE /api/mobile/goals/:id
 */

import { ObjectId } from "mongodb";
import { getGoalsCollection } from "@/lib/db";
import {
  verifyMobileToken,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
} from "@/lib/mobile-auth";
import type { Goal } from "@/types";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFoundResponse("Goal");

  try {
    const col = await getGoalsCollection();
    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) return notFoundResponse("Goal");
    if (existing.userId !== token.sub) return forbiddenResponse();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Request body must be JSON");
    }

    const updates: Record<string, unknown> = {};
    const allowed = ["title", "targetValue", "currentValue", "status", "targetDate", "exerciseName"];
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    // If marking achieved, record timestamp
    if (updates.status === "achieved" && !existing.achievedAt) {
      updates.achievedAt = new Date();
    }

    if (Object.keys(updates).length === 0) return badRequestResponse("No updatable fields provided");

    await col.updateOne({ _id: new ObjectId(id) }, { $set: updates });
    const updated = await col.findOne({ _id: new ObjectId(id) });
    if (!updated) return notFoundResponse("Goal");

    const goal: Goal = {
      id: updated._id.toString(),
      type: updated.type,
      title: updated.title,
      targetValue: updated.targetValue,
      unit: updated.unit,
      exerciseName: updated.exerciseName,
      currentValue: updated.currentValue,
      status: updated.status,
      targetDate: updated.targetDate,
      achievedAt: updated.achievedAt?.toISOString(),
      createdAt: updated.createdAt.toISOString(),
    };

    return successResponse(goal);
  } catch (err) {
    console.error("[PATCH /api/mobile/goals/:id]", err);
    return serverErrorResponse();
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFoundResponse("Goal");

  try {
    const col = await getGoalsCollection();
    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) return notFoundResponse("Goal");
    if (existing.userId !== token.sub) return forbiddenResponse();

    await col.deleteOne({ _id: new ObjectId(id) });
    return successResponse({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/mobile/goals/:id]", err);
    return serverErrorResponse();
  }
}
