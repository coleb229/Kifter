"use server";

import { auth } from "@/auth";
import { getSiteSettingsCollection } from "@/lib/db";
import type { ActionResult, SiteSettingsDoc } from "@/types";

const DEFAULT_SETTINGS: Omit<SiteSettingsDoc, "_id"> = {
  maintenanceMode: false,
  features: { training: true, nutrition: true, cardio: true, community: true },
};

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function getSiteSettings(): Promise<ActionResult<SiteSettingsDoc>> {
  try {
    await requireAdmin();
    const col = await getSiteSettingsCollection();
    const doc = await col.findOne({ _id: "global" });
    return {
      success: true,
      data: doc ?? { _id: "global", ...DEFAULT_SETTINGS },
    };
  } catch {
    return { success: false, error: "Failed to load settings" };
  }
}

export async function updateSiteSettings(
  data: Partial<Omit<SiteSettingsDoc, "_id">>
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const col = await getSiteSettingsCollection();
    await col.updateOne(
      { _id: "global" },
      { $set: data },
      { upsert: true }
    );
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to update settings" };
  }
}
