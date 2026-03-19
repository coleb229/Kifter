/**
 * POST /api/mobile/auth/google
 *
 * Exchanges a Google ID token (obtained by the iOS app via Google Sign-In SDK)
 * for a Kifted mobile JWT.
 *
 * Flow:
 *  1. iOS gets a Google ID token from GIDSignIn
 *  2. iOS POSTs { idToken } here
 *  3. We verify the token with Google's tokeninfo endpoint
 *  4. We find-or-create the user in MongoDB (same users collection as NextAuth)
 *  5. We return a signed JWT + the user's profile
 *
 * Body: { idToken: string }
 * Response: { success: true, data: { token: string, user: UserSummary } }
 */

import { ObjectId } from "mongodb";
import { getUsersCollection } from "@/lib/db";
import { signMobileToken, badRequestResponse, serverErrorResponse, successResponse } from "@/lib/mobile-auth";
import type { UserRole, UserSummary } from "@/types";

export async function POST(request: Request) {
  try {
    // ── 1. Parse body ──────────────────────────────────────────────────────────
    let body: { idToken?: string };
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Request body must be JSON with an idToken field");
    }

    const { idToken } = body;
    if (!idToken || typeof idToken !== "string") {
      return badRequestResponse("idToken is required");
    }

    // ── 2. Verify with Google ──────────────────────────────────────────────────
    // Google's tokeninfo endpoint validates the ID token and returns the user's
    // email, name, and picture. If the token is invalid it returns a 4xx.
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );

    if (!googleRes.ok) {
      return Response.json(
        { success: false, error: { code: "INVALID_TOKEN", message: "Google token verification failed" } },
        { status: 401 }
      );
    }

    const googlePayload = await googleRes.json() as {
      sub: string;       // Google user ID
      email: string;
      email_verified: string;
      name?: string;
      picture?: string;
      aud: string;       // OAuth client ID that issued the token
    };

    if (googlePayload.email_verified !== "true") {
      return badRequestResponse("Google account email is not verified");
    }

    // ── 3. Find or create user in MongoDB ─────────────────────────────────────
    const col = await getUsersCollection();

    // NextAuth stores users with an `email` field. We look up by email so both
    // web sessions and mobile tokens resolve to the same MongoDB document.
    let user = await col.findOne({ email: googlePayload.email });

    if (!user) {
      // New user — create a minimal document matching the NextAuth adapter shape.
      // The adapter will fill in accounts/sessions collections automatically if
      // the user later signs in on the web too.
      const now = new Date();
      const result = await col.insertOne({
        _id: new ObjectId(),
        email: googlePayload.email,
        name: googlePayload.name ?? googlePayload.email.split("@")[0],
        image: googlePayload.picture,
        emailVerified: now,
        role: "member" as UserRole,
        createdAt: now,
      });
      user = await col.findOne({ _id: result.insertedId });
    }

    if (!user) {
      return serverErrorResponse("Failed to create or find user");
    }

    // Update profile picture if Google has a newer one and the user hasn't set
    // a custom profile image through the app
    if (googlePayload.picture && !user.profileImage && user.image !== googlePayload.picture) {
      await col.updateOne(
        { _id: user._id },
        { $set: { image: googlePayload.picture, lastSeenAt: new Date() } }
      );
      user.image = googlePayload.picture;
    } else {
      // Always update lastSeenAt on sign-in
      await col.updateOne({ _id: user._id }, { $set: { lastSeenAt: new Date() } });
    }

    // Block banned users
    if (user.bannedAt) {
      return Response.json(
        { success: false, error: { code: "BANNED", message: "Your account has been suspended" } },
        { status: 403 }
      );
    }

    const userId = user._id.toString();
    const role: UserRole = user.role ?? "member";

    // ── 4. Sign mobile JWT ─────────────────────────────────────────────────────
    const token = await signMobileToken({ sub: userId, email: user.email, role });

    // ── 5. Return token + profile ──────────────────────────────────────────────
    const userSummary: UserSummary = {
      id: userId,
      name: user.displayName ?? user.name,
      email: user.email,
      image: user.profileImage ?? user.image,
      role,
      bio: user.bio,
      displayName: user.displayName,
      profileImage: user.profileImage,
      preferences: user.preferences,
      restrictions: user.restrictions,
      createdAt: user.createdAt?.toISOString(),
    };

    return successResponse({ token, user: userSummary });
  } catch (err) {
    console.error("[POST /api/mobile/auth/google]", err);
    return serverErrorResponse();
  }
}
