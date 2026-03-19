/**
 * Mobile JWT middleware
 *
 * Every protected /api/mobile/* route calls `verifyMobileToken(request)` at the
 * top of its handler. If the token is valid, it returns the decoded payload
 * (which includes the user's MongoDB ObjectId as `sub` and their role).
 * If the token is missing or invalid, it returns null — the caller is
 * responsible for returning a 401 response.
 *
 * Tokens are signed with AUTH_SECRET (the same secret NextAuth uses for web
 * sessions), using HMAC-SHA256. This means one secret governs both platforms.
 */

import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/types";

if (!process.env.AUTH_SECRET) {
  throw new Error('Missing environment variable: "AUTH_SECRET"');
}

// jose requires the secret as a Uint8Array
const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

// How long mobile tokens stay valid (7 days)
const TOKEN_TTL = "7d";

// ── Payload shape ─────────────────────────────────────────────────────────────

export interface MobileTokenPayload {
  /** MongoDB ObjectId string for the user */
  sub: string;
  email: string;
  role: UserRole;
  /** unix epoch seconds — set automatically by SignJWT */
  exp?: number;
  iat?: number;
}

// ── Sign (called by auth/google route after verifying Google token) ────────────

export async function signMobileToken(
  payload: Omit<MobileTokenPayload, "exp" | "iat">
): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secret);
}

// ── Verify (called at the top of every protected route handler) ───────────────

export async function verifyMobileToken(
  request: Request
): Promise<MobileTokenPayload | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: payload.sub as string,
      email: payload["email"] as string,
      role: (payload["role"] as UserRole) ?? "member",
      exp: payload.exp,
      iat: payload.iat,
    };
  } catch {
    // expired, malformed, wrong signature — all return null
    return null;
  }
}

// ── Standard error responses ──────────────────────────────────────────────────

export function unauthorizedResponse() {
  return Response.json(
    { success: false, error: { code: "UNAUTHORIZED", message: "Invalid or missing token" } },
    { status: 401 }
  );
}

export function forbiddenResponse() {
  return Response.json(
    { success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
    { status: 403 }
  );
}

export function notFoundResponse(entity = "Resource") {
  return Response.json(
    { success: false, error: { code: "NOT_FOUND", message: `${entity} not found` } },
    { status: 404 }
  );
}

export function badRequestResponse(message: string) {
  return Response.json(
    { success: false, error: { code: "BAD_REQUEST", message } },
    { status: 400 }
  );
}

export function serverErrorResponse(message = "Internal server error") {
  return Response.json(
    { success: false, error: { code: "SERVER_ERROR", message } },
    { status: 500 }
  );
}

// ── Success envelope helper ────────────────────────────────────────────────────

export function successResponse<T>(
  data: T,
  meta?: { page?: number; total?: number; hasMore?: boolean }
) {
  return Response.json({ success: true, data, ...(meta ? { meta } : {}) });
}
