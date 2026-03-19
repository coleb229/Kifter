/**
 * GET  /api/mobile/exercises  — combined list: default exercises + user's custom ones
 * POST /api/mobile/exercises  — create a custom exercise
 *
 * Query params (GET):
 *   search  — filter by name (case-insensitive)
 */

import { ObjectId } from "mongodb";
import { getExercisesCollection } from "@/lib/db";
import { DEFAULT_EXERCISES } from "@/lib/exercises";
import {
  verifyMobileToken,
  unauthorizedResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
} from "@/lib/mobile-auth";

export async function GET(request: Request) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() ?? "";

    // Fetch user's custom exercises
    const col = await getExercisesCollection();
    const customDocs = await col
      .find({ userId: token.sub })
      .sort({ name: 1 })
      .toArray();

    // Merge default + custom (custom exercises may override/add to defaults)
    const customNames = new Set(customDocs.map((d) => d.name.toLowerCase()));
    const filteredDefaults = DEFAULT_EXERCISES.filter(
      (name) => !customNames.has(name.toLowerCase())
    ).map((name) => ({ id: null, name, isCustom: false, videoUrl: undefined, tags: [] }));

    const customList = customDocs.map((d) => ({
      id: d._id.toString(),
      name: d.name,
      isCustom: true,
      videoUrl: d.videoUrl,
      tags: d.tags ?? [],
    }));

    let all = [...filteredDefaults, ...customList].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // Apply search filter
    if (search) {
      all = all.filter((e) => e.name.toLowerCase().includes(search));
    }

    return successResponse(all);
  } catch (err) {
    console.error("[GET /api/mobile/exercises]", err);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  try {
    let body: { name?: string; videoUrl?: string; tags?: string[] };
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Request body must be JSON");
    }

    const name = body.name?.trim();
    if (!name) return badRequestResponse("name is required");
    if (name.length > 100) return badRequestResponse("name must be 100 characters or less");

    // Check for duplicate
    const col = await getExercisesCollection();
    const existing = await col.findOne({
      userId: token.sub,
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (existing) {
      return Response.json(
        { success: false, error: { code: "DUPLICATE", message: "An exercise with this name already exists" } },
        { status: 409 }
      );
    }

    const now = new Date();
    const result = await col.insertOne({
      _id: new ObjectId(),
      userId: token.sub,
      name,
      videoUrl: body.videoUrl,
      tags: body.tags ?? [],
      createdAt: now,
    });

    return Response.json(
      {
        success: true,
        data: {
          id: result.insertedId.toString(),
          name,
          isCustom: true,
          videoUrl: body.videoUrl,
          tags: body.tags ?? [],
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/mobile/exercises]", err);
    return serverErrorResponse();
  }
}
