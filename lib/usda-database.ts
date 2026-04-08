// ── USDA FoodData Central search ─────────────────────────────────────────────
// Lazy-loads the 7,000+ food USDA dataset (Foundation Foods + SR Legacy)
// server-side only. The JSON uses compact keys to minimize file size.

import { readFile } from "fs/promises";
import { join } from "path";
import type { FoodCategory, FoodPreset } from "@/lib/food-database";

interface USDAFoodRaw {
  id: string;
  n: string;   // name
  c: string;   // category
  cal: number;  // calories
  p: number;   // protein
  cb: number;  // carbs
  f: number;   // fat
  ss: number;  // servingSize
  su: string;  // servingUnit
}

let cache: FoodPreset[] | null = null;

async function loadDatabase(): Promise<FoodPreset[]> {
  if (cache) return cache;
  const raw = await readFile(join(process.cwd(), "data/usda-foods.json"), "utf-8");
  const items: USDAFoodRaw[] = JSON.parse(raw);
  cache = items.map((item) => ({
    id: item.id,
    name: item.n,
    category: item.c as FoodCategory,
    calories: item.cal,
    protein: item.p,
    carbs: item.cb,
    fat: item.f,
    servingSize: item.ss,
    servingUnit: item.su,
  }));
  return cache;
}

export async function searchUSDADatabase(query: string, limit = 10): Promise<FoodPreset[]> {
  if (!query || query.trim().length < 2) return [];
  const db = await loadDatabase();
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/);

  // Score each food: exact prefix match > all words match > partial match
  const scored: { food: FoodPreset; score: number }[] = [];
  for (const food of db) {
    const nameLower = food.name.toLowerCase();

    // All search words must appear somewhere in the name
    if (!words.every((w) => nameLower.includes(w))) continue;

    let score = 0;
    // Boost: name starts with query
    if (nameLower.startsWith(q)) score += 100;
    // Boost: name starts with first word
    else if (nameLower.startsWith(words[0])) score += 50;
    // Boost: shorter names rank higher (more specific)
    score += Math.max(0, 80 - food.name.length);
    // Boost: category match
    if (food.category.toLowerCase().includes(q)) score += 10;

    scored.push({ food, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.food);
}
