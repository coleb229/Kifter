"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getSavedRecipesCollection, getRecipeSubmissionsCollection, getDietEntriesCollection, getDailyNutritionSummaryCollection } from "@/lib/db";
import { getRecipeById } from "@/lib/recipe-database";
import type { ActionResult, SavedRecipe, RecipeSubmission, MealType } from "@/types";

// ── getSavedRecipes ──────────────────────────────────────────────────────────

export async function getSavedRecipes(): Promise<ActionResult<SavedRecipe[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getSavedRecipesCollection();
  const docs = await col.find({ userId: session.user.id }).sort({ createdAt: -1 }).toArray();

  return {
    success: true,
    data: docs.map((d) => ({
      id: d._id.toHexString(),
      recipeId: d.recipeId,
      createdAt: d.createdAt.toISOString(),
    })),
  };
}

// ── saveRecipe ───────────────────────────────────────────────────────────────

export async function saveRecipe(recipeId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const recipe = getRecipeById(recipeId);
  if (!recipe) return { success: false, error: "Recipe not found" };

  const col = await getSavedRecipesCollection();

  // Upsert to prevent duplicates
  await col.updateOne(
    { userId: session.user.id, recipeId },
    { $setOnInsert: { _id: new ObjectId(), userId: session.user.id, recipeId, createdAt: new Date() } },
    { upsert: true }
  );

  return { success: true, data: undefined };
}

// ── unsaveRecipe ─────────────────────────────────────────────────────────────

export async function unsaveRecipe(recipeId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getSavedRecipesCollection();
  await col.deleteOne({ userId: session.user.id, recipeId });

  return { success: true, data: undefined };
}

// ── logRecipeToDiet ──────────────────────────────────────────────────────────

export async function logRecipeToDiet(
  recipeId: string,
  date: string,
  mealType: MealType,
  servings = 1
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  const userId = session.user.id;

  const recipe = getRecipeById(recipeId);
  if (!recipe) return { success: false, error: "Recipe not found" };

  const [year, month, day] = date.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);

  const col = await getDietEntriesCollection();
  const id = new ObjectId();
  await col.insertOne({
    _id: id,
    userId,
    date: dateObj,
    mealType,
    food: recipe.name,
    calories: Math.round(recipe.calories * servings),
    protein: Math.round(recipe.protein * servings),
    carbs: Math.round(recipe.carbs * servings),
    fat: Math.round(recipe.fat * servings),
    servingSize: servings,
    servingUnit: "serving",
    notes: `From Pantry: ${recipe.source}`,
    createdAt: new Date(),
  });

  // Fire-and-forget daily summary update
  void upsertDailyNutritionSummary(userId, date);

  return { success: true, data: { id: id.toHexString() } };
}

// ── submitRecipeUrl ──────────────────────────────────────────────────────────

export async function submitRecipeUrl(
  url: string,
  notes?: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  if (!url.trim()) return { success: false, error: "URL is required" };

  try {
    new URL(url.trim());
  } catch {
    return { success: false, error: "Invalid URL" };
  }

  const col = await getRecipeSubmissionsCollection();
  const id = new ObjectId();
  await col.insertOne({
    _id: id,
    userId: session.user.id,
    url: url.trim(),
    notes: notes?.trim() || undefined,
    status: "pending",
    createdAt: new Date(),
  });

  return { success: true, data: { id: id.toHexString() } };
}

// ── getRecipeSubmissions (admin) ─────────────────────────────────────────────

export async function getRecipeSubmissions(): Promise<ActionResult<RecipeSubmission[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getRecipeSubmissionsCollection();
  const docs = await col.find().sort({ createdAt: -1 }).limit(50).toArray();

  return {
    success: true,
    data: docs.map((d) => ({
      id: d._id.toHexString(),
      userId: d.userId,
      url: d.url,
      notes: d.notes,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    })),
  };
}

// ── Helper: upsert daily nutrition summary ───────────────────────────────────

async function upsertDailyNutritionSummary(userId: string, dateStr: string) {
  try {
    const dietCol = await getDietEntriesCollection();
    const [year, month, day] = dateStr.split("-").map(Number);
    const start = new Date(year, month - 1, day);
    const end = new Date(year, month - 1, day + 1);

    const entries = await dietCol.find({ userId, date: { $gte: start, $lt: end } }).toArray();
    const totals = entries.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const summaryCol = await getDailyNutritionSummaryCollection();
    const summaryId = `${userId}:${dateStr}`;
    await summaryCol.updateOne(
      { _id: summaryId },
      { $set: { ...totals, entryCount: entries.length, updatedAt: new Date() }, $setOnInsert: { _id: summaryId, userId, date: dateStr } },
      { upsert: true }
    );
  } catch {
    // Non-critical — swallow errors
  }
}
