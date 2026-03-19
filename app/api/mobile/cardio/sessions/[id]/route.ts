/**
 * PATCH  /api/mobile/cardio/sessions/:id
 * DELETE /api/mobile/cardio/sessions/:id
 */

import { ObjectId } from "mongodb";
import { getCardioSessionsCollection } from "@/lib/db";
import {
  verifyMobileToken,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
} from "@/lib/mobile-auth";
import type { CardioSession } from "@/types";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFoundResponse("Cardio session");

  try {
    const col = await getCardioSessionsCollection();
    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) return notFoundResponse("Cardio session");
    if (existing.userId !== token.sub) return forbiddenResponse();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Request body must be JSON");
    }

    const updates: Record<string, unknown> = {};
    const allowed = ["date","activityType","duration","distance","distanceUnit","intensity","caloriesBurned","avgHeartRate","notes"];
    for (const key of allowed) {
      if (key in body) {
        updates[key] = key === "date" ? new Date(body[key] as string) : body[key];
      }
    }

    if (Object.keys(updates).length === 0) return badRequestResponse("No updatable fields provided");

    await col.updateOne({ _id: new ObjectId(id) }, { $set: updates });
    const updated = await col.findOne({ _id: new ObjectId(id) });
    if (!updated) return notFoundResponse("Cardio session");

    const session: CardioSession = {
      id: updated._id.toString(),
      userId: updated.userId,
      date: updated.date.toISOString(),
      activityType: updated.activityType,
      duration: updated.duration,
      distance: updated.distance,
      distanceUnit: updated.distanceUnit,
      intensity: updated.intensity,
      caloriesBurned: updated.caloriesBurned,
      avgHeartRate: updated.avgHeartRate,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
    };

    return successResponse(session);
  } catch (err) {
    console.error("[PATCH /api/mobile/cardio/sessions/:id]", err);
    return serverErrorResponse();
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFoundResponse("Cardio session");

  try {
    const col = await getCardioSessionsCollection();
    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) return notFoundResponse("Cardio session");
    if (existing.userId !== token.sub) return forbiddenResponse();

    await col.deleteOne({ _id: new ObjectId(id) });
    return successResponse({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/mobile/cardio/sessions/:id]", err);
    return serverErrorResponse();
  }
}
