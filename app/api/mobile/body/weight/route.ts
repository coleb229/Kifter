/**
 * GET  /api/mobile/body/weight  — weight entries in a date range
 * POST /api/mobile/body/weight  — log a new weight entry
 *
 * Query params (GET): from, to (YYYY-MM-DD), limit (default 90)
 */

import { ObjectId } from "mongodb";
import { getBodyWeightCollection } from "@/lib/db";
import {
  verifyMobileToken,
  unauthorizedResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
} from "@/lib/mobile-auth";
import type { BodyWeightEntry } from "@/types";

export async function GET(request: Request) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    const limit = Math.min(365, Math.max(1, parseInt(searchParams.get("limit") ?? "90", 10)));

    const col = await getBodyWeightCollection();

    const query: Record<string, unknown> = { userId: token.sub };
    if (from || to) {
      const dateFilter: Record<string, string> = {};
      if (from) dateFilter.$gte = from;
      if (to) dateFilter.$lte = to;
      query.date = dateFilter;
    }

    const docs = await col
      .find(query)
      .sort({ date: -1 })
      .limit(limit)
      .toArray();

    const entries: BodyWeightEntry[] = docs.map((d) => ({
      id: d._id.toString(),
      date: d.date,
      weight: d.weight,
      weightUnit: d.weightUnit,
      notes: d.notes,
      createdAt: d.createdAt.toISOString(),
    }));

    return successResponse(entries);
  } catch (err) {
    console.error("[GET /api/mobile/body/weight]", err);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  try {
    let body: { date?: string; weight?: number; weightUnit?: "lb" | "kg"; notes?: string };
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Request body must be JSON");
    }

    if (!body.date) return badRequestResponse("date (YYYY-MM-DD) is required");
    if (typeof body.weight !== "number" || body.weight <= 0) {
      return badRequestResponse("weight (positive number) is required");
    }
    if (!body.weightUnit || !["lb", "kg"].includes(body.weightUnit)) {
      return badRequestResponse("weightUnit must be 'lb' or 'kg'");
    }

    const now = new Date();
    const col = await getBodyWeightCollection();
    const result = await col.insertOne({
      _id: new ObjectId(),
      userId: token.sub,
      date: body.date,
      weight: body.weight,
      weightUnit: body.weightUnit,
      notes: body.notes?.trim(),
      createdAt: now,
    });

    const entry: BodyWeightEntry = {
      id: result.insertedId.toString(),
      date: body.date,
      weight: body.weight,
      weightUnit: body.weightUnit,
      notes: body.notes?.trim(),
      createdAt: now.toISOString(),
    };

    return Response.json({ success: true, data: entry }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/mobile/body/weight]", err);
    return serverErrorResponse();
  }
}
