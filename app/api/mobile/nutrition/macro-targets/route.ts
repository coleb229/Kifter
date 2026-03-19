/**
 * GET /api/mobile/nutrition/macro-targets  — fetch user's daily targets
 * PUT /api/mobile/nutrition/macro-targets  — set/update targets
 */

import { ObjectId } from "mongodb";
import { getMacroTargetsCollection } from "@/lib/db";
import {
  verifyMobileToken,
  unauthorizedResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
} from "@/lib/mobile-auth";
import type { MacroTarget } from "@/types";

export async function GET(request: Request) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  try {
    const col = await getMacroTargetsCollection();
    const doc = await col.findOne({ userId: token.sub });

    if (!doc) {
      // Return sensible defaults if none set
      return successResponse(null);
    }

    const target: MacroTarget = {
      id: doc._id.toString(),
      userId: doc.userId,
      calories: doc.calories,
      protein: doc.protein,
      carbs: doc.carbs,
      fat: doc.fat,
      updatedAt: doc.updatedAt.toISOString(),
    };

    return successResponse(target);
  } catch (err) {
    console.error("[GET /api/mobile/nutrition/macro-targets]", err);
    return serverErrorResponse();
  }
}

export async function PUT(request: Request) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  try {
    let body: { calories?: number; protein?: number; carbs?: number; fat?: number };
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Request body must be JSON");
    }

    const { calories, protein, carbs, fat } = body;
    if (
      typeof calories !== "number" ||
      typeof protein !== "number" ||
      typeof carbs !== "number" ||
      typeof fat !== "number"
    ) {
      return badRequestResponse("calories, protein, carbs, and fat (all numbers) are required");
    }

    const now = new Date();
    const col = await getMacroTargetsCollection();

    const result = await col.findOneAndUpdate(
      { userId: token.sub },
      { $set: { calories, protein, carbs, fat, updatedAt: now }, $setOnInsert: { _id: new ObjectId(), userId: token.sub } },
      { upsert: true, returnDocument: "after" }
    );

    const target: MacroTarget = {
      id: result!._id.toString(),
      userId: token.sub,
      calories,
      protein,
      carbs,
      fat,
      updatedAt: now.toISOString(),
    };

    return successResponse(target);
  } catch (err) {
    console.error("[PUT /api/mobile/nutrition/macro-targets]", err);
    return serverErrorResponse();
  }
}
