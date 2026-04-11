"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getCommunityFoodsCollection, getFavoriteFoodsCollection } from "@/lib/db";
import { searchFoodDatabase } from "@/lib/food-database";
import { searchUSDADatabase } from "@/lib/usda-database";
import type { ActionResult, CommunityFood, FavoriteFood, SubmitCommunityFoodInput } from "@/types";

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
  source: "preset" | "community" | "favorite";
  category?: string;
  submittedBy?: string;
}

export async function searchFoods(
  query: string
): Promise<ActionResult<FoodSearchResult[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const q = query.trim();
  if (q.length < 1) return { success: true, data: [] };

  // User favorites (prefixed to show first)
  const favCol = await getFavoriteFoodsCollection();
  const favDocs = await favCol
    .find({ userId, name: { $regex: q, $options: "i" } })
    .limit(5)
    .toArray();
  const favorites: FoodSearchResult[] = favDocs.map((d) => ({
    id: d._id.toHexString(),
    name: d.name,
    calories: d.calories,
    protein: d.protein,
    carbs: d.carbs,
    fat: d.fat,
    servingSize: d.servingSize,
    servingUnit: d.servingUnit,
    source: "favorite" as const,
  }));
  const favNames = new Set(favorites.map((f) => f.name.toLowerCase()));

  // Community foods — user's own first, then others
  const col = await getCommunityFoodsCollection();
  const nameFilter = { name: { $regex: q, $options: "i" } };
  const [myDocs, otherDocs] = await Promise.all([
    col.find({ ...nameFilter, submittedBy: userId }).sort({ name: 1 }).limit(5).toArray(),
    col.find({ ...nameFilter, submittedBy: { $ne: userId } }).sort({ name: 1 }).limit(6).toArray(),
  ]);

  const mapCommunity = (d: (typeof myDocs)[number]): FoodSearchResult => ({
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
  });

  const myCommunity = myDocs.map(mapCommunity).filter((c) => !favNames.has(c.name.toLowerCase()));
  const othersCommunity = otherDocs.map(mapCommunity).filter((c) => !favNames.has(c.name.toLowerCase()));

  const seen = new Set([
    ...favNames,
    ...myCommunity.map((c) => c.name.toLowerCase()),
    ...othersCommunity.map((c) => c.name.toLowerCase()),
  ]);

  // Static presets (curated Kifted foods)
  const presets = searchFoodDatabase(q, 8)
    .filter((f) => !seen.has(f.name.toLowerCase()))
    .map((f) => ({
      id: f.id,
      name: f.name,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      servingSize: f.servingSize,
      servingUnit: f.servingUnit,
      source: "preset" as const,
      category: f.category,
    }));

  presets.forEach((p) => seen.add(p.name.toLowerCase()));

  // USDA database (7,000+ foods from Foundation Foods + SR Legacy)
  const usdaResults = (await searchUSDADatabase(q, 10))
    .filter((f) => !seen.has(f.name.toLowerCase()))
    .map((f) => {
      seen.add(f.name.toLowerCase());
      return {
        id: f.id,
        name: f.name,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        servingSize: f.servingSize,
        servingUnit: f.servingUnit,
        source: "preset" as const,
        category: f.category,
      };
    });

  return { success: true, data: [...favorites, ...myCommunity, ...othersCommunity, ...presets, ...usdaResults] };
}

// ── getFavoriteFoods ──────────────────────────────────────────────────────────

export async function getFavoriteFoods(): Promise<ActionResult<FavoriteFood[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const col = await getFavoriteFoodsCollection();
  const docs = await col.find({ userId }).sort({ createdAt: -1 }).toArray();
  return {
    success: true,
    data: docs.map((d) => ({
      id: d._id.toHexString(),
      userId: d.userId,
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

// ── addFavoriteFood ───────────────────────────────────────────────────────────

export async function addFavoriteFood(food: FoodSearchResult): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const col = await getFavoriteFoodsCollection();
  const count = await col.countDocuments({ userId });
  if (count >= 10) return { success: false, error: "Maximum 10 favorites allowed" };

  // Upsert by name (case-insensitive)
  await col.updateOne(
    { userId, name: { $regex: `^${food.name.trim()}$`, $options: "i" } },
    {
      $set: {
        userId,
        name: food.name.trim(),
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        servingSize: food.servingSize,
        servingUnit: food.servingUnit,
        createdAt: new Date(),
      },
      $setOnInsert: { _id: new ObjectId() },
    },
    { upsert: true }
  );
  return { success: true, data: undefined };
}

// ── removeFavoriteFood ────────────────────────────────────────────────────────

export async function removeFavoriteFood(name: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const col = await getFavoriteFoodsCollection();
  await col.deleteOne({ userId, name: { $regex: `^${name.trim()}$`, $options: "i" } });
  return { success: true, data: undefined };
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
