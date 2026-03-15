"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getCommunityFoodsCollection } from "@/lib/db";
import { searchFoodDatabase } from "@/lib/food-database";
import type { ActionResult, CommunityFood, SubmitCommunityFoodInput } from "@/types";

// ── searchFoods ───────────────────────────────────────────────────────────────
// Returns combined results from the static DB and community foods.

export interface FoodSearchResult {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
  source: "preset" | "community";
  submittedBy?: string;
}

export async function searchFoods(
  query: string
): Promise<ActionResult<FoodSearchResult[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const q = query.trim();
  if (q.length < 1) return { success: true, data: [] };

  // Static presets (client-side fast filter, already loaded)
  const presets = searchFoodDatabase(q, 8).map((f) => ({
    id: f.id,
    name: f.name,
    calories: f.calories,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    servingSize: f.servingSize,
    servingUnit: f.servingUnit,
    source: "preset" as const,
  }));

  // Community foods from DB (case-insensitive prefix/contains search)
  const col = await getCommunityFoodsCollection();
  const communityDocs = await col
    .find({ name: { $regex: q, $options: "i" } })
    .sort({ name: 1 })
    .limit(6)
    .toArray();

  const community: FoodSearchResult[] = communityDocs.map((d) => ({
    id: d._id.toHexString(),
    name: d.name,
    calories: d.calories,
    protein: d.protein,
    carbs: d.carbs,
    fat: d.fat,
    servingSize: d.servingSize,
    servingUnit: d.servingUnit,
    source: "community" as const,
    submittedBy: d.submittedBy,
  }));

  // Deduplicate by name (case-insensitive), preferring presets
  const seen = new Set(presets.map((p) => p.name.toLowerCase()));
  const uniqueCommunity = community.filter((c) => !seen.has(c.name.toLowerCase()));

  return { success: true, data: [...presets, ...uniqueCommunity] };
}

// ── submitCommunityFood ───────────────────────────────────────────────────────

export async function submitCommunityFood(
  data: SubmitCommunityFoodInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  // Prevent duplicate names (case-insensitive)
  const col = await getCommunityFoodsCollection();
  const existing = await col.findOne({
    name: { $regex: `^${data.name.trim()}$`, $options: "i" },
  });
  if (existing) {
    return { success: false, error: "A food with this name already exists in the library." };
  }

  const id = new ObjectId();
  await col.insertOne({
    _id: id,
    submittedBy: userId,
    name: data.name.trim(),
    calories: data.calories,
    protein: data.protein,
    carbs: data.carbs,
    fat: data.fat,
    servingSize: data.servingSize,
    servingUnit: data.servingUnit.trim(),
    createdAt: new Date(),
  });

  return { success: true, data: { id: id.toHexString() } };
}

// ── getCommunityFoods ─────────────────────────────────────────────────────────
// Returns the most recently added community foods (for a "browse" view).

export async function getCommunityFoods(
  limit = 20
): Promise<ActionResult<CommunityFood[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getCommunityFoodsCollection();
  const docs = await col
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return {
    success: true,
    data: docs.map((d) => ({
      id: d._id.toHexString(),
      submittedBy: d.submittedBy,
      name: d.name,
      calories: d.calories,
      protein: d.protein,
      carbs: d.carbs,
      fat: d.fat,
      servingSize: d.servingSize,
      servingUnit: d.servingUnit,
      createdAt: d.createdAt.toISOString(),
    })),
  };
}

// ── deleteCommunityFood ───────────────────────────────────────────────────────
// Users can delete foods they submitted.

export async function deleteCommunityFood(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return { success: false, error: "Invalid food ID" };
  }

  const col = await getCommunityFoodsCollection();
  const result = await col.deleteOne({ _id: objectId, submittedBy: userId });
  if (result.deletedCount === 0) {
    return { success: false, error: "Food not found or not yours to delete" };
  }
  return { success: true, data: undefined };
}

// ── lookupBarcode ─────────────────────────────────────────────────────────────

export async function lookupBarcode(
  barcode: string
): Promise<ActionResult<FoodSearchResult | null>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const clean = barcode.trim().replace(/\D/g, "");
  if (!clean) return { success: false, error: "Invalid barcode" };

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=product_name,nutriments,serving_size,serving_quantity`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return { success: true, data: null };

    const json = await res.json() as {
      status: number;
      product?: {
        product_name?: string;
        serving_size?: string;
        serving_quantity?: number;
        nutriments?: {
          "energy-kcal_100g"?: number;
          "proteins_100g"?: number;
          "carbohydrates_100g"?: number;
          "fat_100g"?: number;
        };
      };
    };

    if (json.status !== 1 || !json.product) return { success: true, data: null };

    const p = json.product;
    const n = p.nutriments ?? {};
    const serving = p.serving_quantity ?? 100;

    // Normalize to per-serving values
    const factor = serving / 100;
    return {
      success: true,
      data: {
        id: `barcode-${clean}`,
        name: p.product_name ?? `Product ${clean}`,
        calories: Math.round((n["energy-kcal_100g"] ?? 0) * factor),
        protein: Math.round((n["proteins_100g"] ?? 0) * factor * 10) / 10,
        carbs: Math.round((n["carbohydrates_100g"] ?? 0) * factor * 10) / 10,
        fat: Math.round((n["fat_100g"] ?? 0) * factor * 10) / 10,
        servingSize: serving,
        servingUnit: "g",
        source: "preset",
      },
    };
  } catch {
    return { success: false, error: "Failed to fetch barcode data" };
  }
}
