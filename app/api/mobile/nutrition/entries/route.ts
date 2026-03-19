/**
 * GET  /api/mobile/nutrition/entries  — entries for a date
 * POST /api/mobile/nutrition/entries  — log a new meal
 *
 * Query params (GET):
 *   date  "YYYY-MM-DD" (required)
 */

import { ObjectId } from "mongodb";
import { getDietEntriesCollection } from "@/lib/db";
import {
  verifyMobileToken,
  unauthorizedResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
} from "@/lib/mobile-auth";
import type { DietEntry, CreateDietEntryInput, MEAL_TYPES } from "@/types";

type MealType = typeof MEAL_TYPES[number];
const MEAL_TYPE_LIST: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export async function GET(request: Request) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) return badRequestResponse("date query param (YYYY-MM-DD) is required");

    const start = new Date(date + "T00:00:00.000Z");
    const end = new Date(date + "T23:59:59.999Z");

    const col = await getDietEntriesCollection();
    const docs = await col
      .find({ userId: token.sub, date: { $gte: start, $lte: end } })
      .sort({ createdAt: 1 })
      .toArray();

    const entries: DietEntry[] = docs.map((d) => ({
      id: d._id.toString(),
      userId: d.userId,
      date: d.date.toISOString(),
      mealType: d.mealType,
      food: d.food,
      calories: d.calories,
      protein: d.protein,
      carbs: d.carbs,
      fat: d.fat,
      notes: d.notes,
      createdAt: d.createdAt.toISOString(),
    }));

    return successResponse(entries);
  } catch (err) {
    console.error("[GET /api/mobile/nutrition/entries]", err);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  try {
    let body: Partial<CreateDietEntryInput>;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Request body must be JSON");
    }

    if (!body.date) return badRequestResponse("date is required");
    if (!body.mealType || !MEAL_TYPE_LIST.includes(body.mealType as MealType)) {
      return badRequestResponse(`mealType must be one of: ${MEAL_TYPE_LIST.join(", ")}`);
    }
    if (!body.food?.trim()) return badRequestResponse("food is required");
    if (typeof body.calories !== "number") return badRequestResponse("calories (number) is required");
    if (typeof body.protein !== "number") return badRequestResponse("protein (number) is required");
    if (typeof body.carbs !== "number") return badRequestResponse("carbs (number) is required");
    if (typeof body.fat !== "number") return badRequestResponse("fat (number) is required");

    const now = new Date();
    const col = await getDietEntriesCollection();
    const result = await col.insertOne({
      _id: new ObjectId(),
      userId: token.sub,
      date: new Date(body.date),
      mealType: body.mealType as MealType,
      food: body.food.trim(),
      calories: body.calories,
      protein: body.protein,
      carbs: body.carbs,
      fat: body.fat,
      notes: body.notes?.trim(),
      createdAt: now,
    });

    const entry: DietEntry = {
      id: result.insertedId.toString(),
      userId: token.sub,
      date: new Date(body.date).toISOString(),
      mealType: body.mealType as MealType,
      food: body.food.trim(),
      calories: body.calories,
      protein: body.protein,
      carbs: body.carbs,
      fat: body.fat,
      notes: body.notes?.trim(),
      createdAt: now.toISOString(),
    };

    return Response.json({ success: true, data: entry }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/mobile/nutrition/entries]", err);
    return serverErrorResponse();
  }
}
