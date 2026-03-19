/**
 * DELETE /api/mobile/nutrition/entries/:id
 */

import { ObjectId } from "mongodb";
import { getDietEntriesCollection } from "@/lib/db";
import {
  verifyMobileToken,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
  successResponse,
} from "@/lib/mobile-auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Params) {
  const token = await verifyMobileToken(request);
  if (!token) return unauthorizedResponse();

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFoundResponse("Diet entry");

  try {
    const col = await getDietEntriesCollection();
    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) return notFoundResponse("Diet entry");
    if (existing.userId !== token.sub) return forbiddenResponse();

    await col.deleteOne({ _id: new ObjectId(id) });
    return successResponse({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/mobile/nutrition/entries/:id]", err);
    return serverErrorResponse();
  }
}
