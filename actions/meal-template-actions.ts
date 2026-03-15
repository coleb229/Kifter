"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getMealTemplatesCollection, getDietEntriesCollection } from "@/lib/db";
import type { ActionResult, MealTemplate, MealTemplateItem, DietEntryDoc } from "@/types";

export async function getMealTemplates(): Promise<ActionResult<MealTemplate[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getMealTemplatesCollection();
  const docs = await col.find({ userId: session.user.id }).sort({ createdAt: -1 }).toArray();

  return {
    success: true,
    data: docs.map((d) => ({
      id: d._id.toHexString(),
      name: d.name,
      items: d.items,
      createdAt: d.createdAt.toISOString(),
    })),
  };
}

export async function createMealTemplate(
  name: string,
  items: MealTemplateItem[]
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (!name.trim()) return { success: false, error: "Name is required" };
  if (!items.length) return { success: false, error: "Template must have at least one item" };

  const col = await getMealTemplatesCollection();
  await col.insertOne({
    _id: new ObjectId(),
    userId: session.user.id,
    name: name.trim(),
    items,
    createdAt: new Date(),
  });
  return { success: true, data: undefined };
}

export async function deleteMealTemplate(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getMealTemplatesCollection();
  await col.deleteOne({ _id: new ObjectId(id), userId: session.user.id });
  return { success: true, data: undefined };
}

export async function applyMealTemplate(
  templateId: string,
  date: string
): Promise<ActionResult<{ added: number }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getMealTemplatesCollection();
  const template = await col.findOne({
    _id: new ObjectId(templateId),
    userId: session.user.id,
  });
  if (!template) return { success: false, error: "Template not found" };

  const dietCol = await getDietEntriesCollection();
  const now = new Date();
  const docs: DietEntryDoc[] = template.items.map((item) => ({
    _id: new ObjectId(),
    userId: session.user.id,
    date: new Date(date + "T00:00:00"),
    mealType: item.mealType,
    food: item.food,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    createdAt: now,
  }));

  await dietCol.insertMany(docs);
  return { success: true, data: { added: docs.length } };
}
