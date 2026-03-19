/**
 * GET  /api/mobile/settings/profile  — fetch current user's profile
 * PUT  /api/mobile/settings/profile  — update display name, bio, profileImage
 */

import { ObjectId } from "mongodb";
import { getUsersCollection } from "@/lib/db";
import {
  verifyMobileToken,
  unauthorizedResponse,
  badRequestResponse,
  serverErrorResponse,
  successResponse,
} from "@/lib/mobile-auth";
import type { UserSummary } from "@/types";

export async function GET(request: Request) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  try {
    const col = await getUsersCollection();
    const user = await col.findOne({ _id: new ObjectId(token.sub) });
    if (!user) return unauthorizedResponse();

    const profile: UserSummary = {
      id: user._id.toString(),
      name: user.displayName ?? user.name,
      email: user.email,
      image: user.profileImage ?? user.image,
      role: user.role ?? "member",
      bio: user.bio,
      displayName: user.displayName,
      profileImage: user.profileImage,
      preferences: user.preferences,
      restrictions: user.restrictions,
      lastSeenAt: user.lastSeenAt?.toISOString(),
      createdAt: user.createdAt?.toISOString(),
    };

    return successResponse(profile);
  } catch (err) {
    console.error("[GET /api/mobile/settings/profile]", err);
    return serverErrorResponse();
  }
}

export async function PUT(request: Request) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  try {
    let body: { displayName?: string; bio?: string; profileImage?: string };
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Request body must be JSON");
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.displayName === "string") updates.displayName = body.displayName.trim().slice(0, 50);
    if (typeof body.bio === "string") updates.bio = body.bio.trim().slice(0, 300);
    if (typeof body.profileImage === "string") updates.profileImage = body.profileImage;

    if (Object.keys(updates).length === 0) {
      return badRequestResponse("No updatable fields provided");
    }

    const col = await getUsersCollection();
    await col.updateOne({ _id: new ObjectId(token.sub) }, { $set: updates });

    const user = await col.findOne({ _id: new ObjectId(token.sub) });
    if (!user) return unauthorizedResponse();

    const profile: UserSummary = {
      id: user._id.toString(),
      name: user.displayName ?? user.name,
      email: user.email,
      image: user.profileImage ?? user.image,
      role: user.role ?? "member",
      bio: user.bio,
      displayName: user.displayName,
      profileImage: user.profileImage,
      preferences: user.preferences,
    };

    return successResponse(profile);
  } catch (err) {
    console.error("[PUT /api/mobile/settings/profile]", err);
    return serverErrorResponse();
  }
}
