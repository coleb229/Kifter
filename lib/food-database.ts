// ── Static food database ──────────────────────────────────────────────────────
// All macros are per serving as specified by servingSize + servingUnit.
// Caloric data sourced from USDA FoodData Central averages.

export interface FoodPreset {
  id: string;
  name: string;
  category: FoodCategory;
  calories: number;
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
  servingSize: number;
  servingUnit: string;
}

export type FoodCategory =
  | "Protein"
  | "Dairy & Eggs"
  | "Grains & Bread"
  | "Fruits"
  | "Vegetables"
  | "Legumes"
  | "Nuts & Seeds"
  | "Oils & Fats"
  | "Snacks"
  | "Beverages"
  | "Supplements";

export const FOOD_CATEGORIES: FoodCategory[] = [
  "Protein",
  "Dairy & Eggs",
  "Grains & Bread",
  "Fruits",
  "Vegetables",
  "Legumes",
  "Nuts & Seeds",
  "Oils & Fats",
  "Snacks",
  "Beverages",
  "Supplements",
];

export const foodDatabase: FoodPreset[] = [
  // ── Protein ────────────────────────────────────────────────────────────────
  { id: "chicken-breast-cooked", name: "Chicken Breast (cooked)", category: "Protein", calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: 100, servingUnit: "g" },
  { id: "chicken-thigh-cooked", name: "Chicken Thigh (cooked)", category: "Protein", calories: 209, protein: 26, carbs: 0, fat: 11, servingSize: 100, servingUnit: "g" },
  { id: "ground-beef-80-20", name: "Ground Beef 80/20 (cooked)", category: "Protein", calories: 254, protein: 26, carbs: 0, fat: 17, servingSize: 100, servingUnit: "g" },
  { id: "ground-beef-93-7", name: "Ground Beef 93/7 (cooked)", category: "Protein", calories: 172, protein: 29, carbs: 0, fat: 6, servingSize: 100, servingUnit: "g" },
  { id: "beef-steak-sirloin", name: "Beef Sirloin Steak (cooked)", category: "Protein", calories: 207, protein: 30, carbs: 0, fat: 9, servingSize: 100, servingUnit: "g" },
  { id: "salmon-fillet", name: "Salmon Fillet (cooked)", category: "Protein", calories: 208, protein: 28, carbs: 0, fat: 10, servingSize: 100, servingUnit: "g" },
  { id: "canned-tuna-water", name: "Canned Tuna in Water", category: "Protein", calories: 109, protein: 25, carbs: 0, fat: 1, servingSize: 100, servingUnit: "g" },
  { id: "tilapia-fillet", name: "Tilapia Fillet (cooked)", category: "Protein", calories: 128, protein: 26, carbs: 0, fat: 3, servingSize: 100, servingUnit: "g" },
  { id: "shrimp-cooked", name: "Shrimp (cooked)", category: "Protein", calories: 99, protein: 24, carbs: 0, fat: 0.3, servingSize: 100, servingUnit: "g" },
  { id: "cod-fillet", name: "Cod Fillet (cooked)", category: "Protein", calories: 105, protein: 23, carbs: 0, fat: 1, servingSize: 100, servingUnit: "g" },
  { id: "turkey-breast-lean", name: "Turkey Breast (lean, cooked)", category: "Protein", calories: 135, protein: 30, carbs: 0, fat: 1, servingSize: 100, servingUnit: "g" },
  { id: "pork-tenderloin", name: "Pork Tenderloin (cooked)", category: "Protein", calories: 147, protein: 26, carbs: 0, fat: 4, servingSize: 100, servingUnit: "g" },
  { id: "pork-chop", name: "Pork Chop (cooked)", category: "Protein", calories: 231, protein: 25, carbs: 0, fat: 14, servingSize: 100, servingUnit: "g" },
  { id: "deli-turkey", name: "Deli Turkey (sliced)", category: "Protein", calories: 89, protein: 18, carbs: 2, fat: 1, servingSize: 84, servingUnit: "g" },
  { id: "beef-jerky", name: "Beef Jerky", category: "Protein", calories: 116, protein: 9, carbs: 7, fat: 7, servingSize: 28, servingUnit: "g" },

  // ── Dairy & Eggs ───────────────────────────────────────────────────────────
  { id: "whole-egg", name: "Whole Egg (large)", category: "Dairy & Eggs", calories: 72, protein: 6, carbs: 0.4, fat: 5, servingSize: 1, servingUnit: "egg" },
  { id: "egg-white", name: "Egg White (large)", category: "Dairy & Eggs", calories: 17, protein: 4, carbs: 0.2, fat: 0, servingSize: 1, servingUnit: "white" },
  { id: "greek-yogurt-plain-nonfat", name: "Greek Yogurt (plain, nonfat)", category: "Dairy & Eggs", calories: 100, protein: 17, carbs: 6, fat: 1, servingSize: 170, servingUnit: "g" },
  { id: "greek-yogurt-whole", name: "Greek Yogurt (plain, whole)", category: "Dairy & Eggs", calories: 150, protein: 10, carbs: 8, fat: 8, servingSize: 170, servingUnit: "g" },
  { id: "cottage-cheese-nonfat", name: "Cottage Cheese (nonfat)", category: "Dairy & Eggs", calories: 81, protein: 14, carbs: 6, fat: 0.2, servingSize: 113, servingUnit: "g" },
  { id: "cottage-cheese-full-fat", name: "Cottage Cheese (full fat)", category: "Dairy & Eggs", calories: 120, protein: 14, carbs: 3, fat: 5, servingSize: 113, servingUnit: "g" },
  { id: "whole-milk", name: "Whole Milk", category: "Dairy & Eggs", calories: 149, protein: 8, carbs: 12, fat: 8, servingSize: 240, servingUnit: "ml" },
  { id: "skim-milk", name: "Skim Milk", category: "Dairy & Eggs", calories: 83, protein: 8, carbs: 12, fat: 0.2, servingSize: 240, servingUnit: "ml" },
  { id: "cheddar-cheese", name: "Cheddar Cheese", category: "Dairy & Eggs", calories: 113, protein: 7, carbs: 0.4, fat: 9, servingSize: 28, servingUnit: "g" },
  { id: "mozzarella-cheese", name: "Mozzarella Cheese", category: "Dairy & Eggs", calories: 85, protein: 6, carbs: 1, fat: 6, servingSize: 28, servingUnit: "g" },
  { id: "parmesan-cheese", name: "Parmesan Cheese (grated)", category: "Dairy & Eggs", calories: 122, protein: 11, carbs: 1, fat: 8, servingSize: 28, servingUnit: "g" },
  { id: "butter", name: "Butter", category: "Dairy & Eggs", calories: 102, protein: 0.1, carbs: 0, fat: 12, servingSize: 14, servingUnit: "g" },

  // ── Grains & Bread ─────────────────────────────────────────────────────────
  { id: "white-rice-cooked", name: "White Rice (cooked)", category: "Grains & Bread", calories: 206, protein: 4, carbs: 45, fat: 0.4, servingSize: 186, servingUnit: "g" },
  { id: "brown-rice-cooked", name: "Brown Rice (cooked)", category: "Grains & Bread", calories: 216, protein: 5, carbs: 45, fat: 2, servingSize: 195, servingUnit: "g" },
  { id: "jasmine-rice-cooked", name: "Jasmine Rice (cooked)", category: "Grains & Bread", calories: 200, protein: 4, carbs: 44, fat: 0.3, servingSize: 180, servingUnit: "g" },
  { id: "oatmeal-cooked", name: "Oatmeal (cooked with water)", category: "Grains & Bread", calories: 166, protein: 6, carbs: 28, fat: 4, servingSize: 234, servingUnit: "g" },
  { id: "rolled-oats-dry", name: "Rolled Oats (dry)", category: "Grains & Bread", calories: 150, protein: 5, carbs: 27, fat: 3, servingSize: 40, servingUnit: "g" },
  { id: "white-bread-slice", name: "White Bread (slice)", category: "Grains & Bread", calories: 79, protein: 3, carbs: 15, fat: 1, servingSize: 30, servingUnit: "g" },
  { id: "whole-wheat-bread-slice", name: "Whole Wheat Bread (slice)", category: "Grains & Bread", calories: 81, protein: 4, carbs: 15, fat: 1, servingSize: 30, servingUnit: "g" },
  { id: "pasta-cooked", name: "Pasta (cooked)", category: "Grains & Bread", calories: 220, protein: 8, carbs: 43, fat: 1.3, servingSize: 140, servingUnit: "g" },
  { id: "whole-wheat-pasta", name: "Whole Wheat Pasta (cooked)", category: "Grains & Bread", calories: 210, protein: 8, carbs: 40, fat: 1, servingSize: 140, servingUnit: "g" },
  { id: "quinoa-cooked", name: "Quinoa (cooked)", category: "Grains & Bread", calories: 222, protein: 8, carbs: 39, fat: 4, servingSize: 185, servingUnit: "g" },
  { id: "sourdough-slice", name: "Sourdough Bread (slice)", category: "Grains & Bread", calories: 84, protein: 3, carbs: 16, fat: 0.5, servingSize: 32, servingUnit: "g" },
  { id: "bagel-plain", name: "Plain Bagel", category: "Grains & Bread", calories: 270, protein: 11, carbs: 53, fat: 2, servingSize: 105, servingUnit: "g" },
  { id: "tortilla-flour-medium", name: "Flour Tortilla (medium)", category: "Grains & Bread", calories: 146, protein: 4, carbs: 24, fat: 4, servingSize: 45, servingUnit: "g" },
  { id: "tortilla-corn", name: "Corn Tortilla (6 inch)", category: "Grains & Bread", calories: 52, protein: 1, carbs: 11, fat: 0.7, servingSize: 23, servingUnit: "g" },
  { id: "rice-cakes-plain", name: "Rice Cakes (plain)", category: "Grains & Bread", calories: 35, protein: 0.7, carbs: 7, fat: 0.3, servingSize: 9, servingUnit: "g" },

  // ── Fruits ─────────────────────────────────────────────────────────────────
  { id: "banana-medium", name: "Banana (medium)", category: "Fruits", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, servingSize: 1, servingUnit: "medium" },
  { id: "apple-medium", name: "Apple (medium)", category: "Fruits", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, servingSize: 1, servingUnit: "medium" },
  { id: "orange-medium", name: "Orange (medium)", category: "Fruits", calories: 62, protein: 1.2, carbs: 15, fat: 0.2, servingSize: 1, servingUnit: "medium" },
  { id: "blueberries", name: "Blueberries", category: "Fruits", calories: 84, protein: 1.1, carbs: 21, fat: 0.5, servingSize: 148, servingUnit: "g" },
  { id: "strawberries", name: "Strawberries", category: "Fruits", calories: 49, protein: 1, carbs: 12, fat: 0.5, servingSize: 152, servingUnit: "g" },
  { id: "grapes", name: "Grapes (red or green)", category: "Fruits", calories: 104, protein: 1.1, carbs: 27, fat: 0.2, servingSize: 151, servingUnit: "g" },
  { id: "mango-sliced", name: "Mango (sliced)", category: "Fruits", calories: 107, protein: 1.6, carbs: 28, fat: 0.7, servingSize: 165, servingUnit: "g" },
  { id: "pineapple-chunks", name: "Pineapple (chunks)", category: "Fruits", calories: 82, protein: 0.9, carbs: 22, fat: 0.2, servingSize: 165, servingUnit: "g" },
  { id: "watermelon-sliced", name: "Watermelon (sliced)", category: "Fruits", calories: 86, protein: 1.7, carbs: 22, fat: 0.4, servingSize: 286, servingUnit: "g" },
  { id: "avocado-half", name: "Avocado (half)", category: "Fruits", calories: 161, protein: 2, carbs: 9, fat: 15, servingSize: 100, servingUnit: "g" },

  // ── Vegetables ─────────────────────────────────────────────────────────────
  { id: "broccoli-cooked", name: "Broccoli (cooked)", category: "Vegetables", calories: 55, protein: 4, carbs: 11, fat: 0.6, servingSize: 156, servingUnit: "g" },
  { id: "spinach-raw", name: "Spinach (raw)", category: "Vegetables", calories: 7, protein: 0.9, carbs: 1, fat: 0.1, servingSize: 30, servingUnit: "g" },
  { id: "sweet-potato-baked", name: "Sweet Potato (baked)", category: "Vegetables", calories: 103, protein: 2.3, carbs: 24, fat: 0.1, servingSize: 114, servingUnit: "g" },
  { id: "white-potato-baked", name: "White Potato (baked)", category: "Vegetables", calories: 161, protein: 4.3, carbs: 37, fat: 0.2, servingSize: 173, servingUnit: "g" },
  { id: "asparagus-cooked", name: "Asparagus (cooked)", category: "Vegetables", calories: 40, protein: 4, carbs: 7, fat: 0.5, servingSize: 180, servingUnit: "g" },
  { id: "green-beans-cooked", name: "Green Beans (cooked)", category: "Vegetables", calories: 44, protein: 2.4, carbs: 10, fat: 0.4, servingSize: 125, servingUnit: "g" },
  { id: "cucumber-sliced", name: "Cucumber (sliced)", category: "Vegetables", calories: 16, protein: 0.7, carbs: 4, fat: 0.1, servingSize: 119, servingUnit: "g" },
  { id: "tomato-medium", name: "Tomato (medium)", category: "Vegetables", calories: 22, protein: 1.1, carbs: 5, fat: 0.2, servingSize: 123, servingUnit: "g" },
  { id: "bell-pepper-medium", name: "Bell Pepper (medium)", category: "Vegetables", calories: 37, protein: 1.2, carbs: 9, fat: 0.3, servingSize: 119, servingUnit: "g" },
  { id: "zucchini-cooked", name: "Zucchini (cooked)", category: "Vegetables", calories: 27, protein: 2, carbs: 5, fat: 0.5, servingSize: 180, servingUnit: "g" },
  { id: "kale-raw", name: "Kale (raw)", category: "Vegetables", calories: 33, protein: 2.9, carbs: 6, fat: 0.5, servingSize: 67, servingUnit: "g" },
  { id: "cauliflower-cooked", name: "Cauliflower (cooked)", category: "Vegetables", calories: 29, protein: 2.3, carbs: 5, fat: 0.6, servingSize: 124, servingUnit: "g" },
  { id: "corn-cooked", name: "Corn (cooked, 1 ear)", category: "Vegetables", calories: 88, protein: 3.3, carbs: 19, fat: 1.4, servingSize: 103, servingUnit: "g" },
  { id: "edamame-shelled", name: "Edamame (shelled, cooked)", category: "Vegetables", calories: 188, protein: 18, carbs: 14, fat: 8, servingSize: 155, servingUnit: "g" },
  { id: "mushrooms-sauteed", name: "Mushrooms (sautéed)", category: "Vegetables", calories: 42, protein: 3, carbs: 6, fat: 0.5, servingSize: 100, servingUnit: "g" },

  // ── Legumes ────────────────────────────────────────────────────────────────
  { id: "black-beans-cooked", name: "Black Beans (cooked)", category: "Legumes", calories: 227, protein: 15, carbs: 41, fat: 0.9, servingSize: 172, servingUnit: "g" },
  { id: "lentils-cooked", name: "Lentils (cooked)", category: "Legumes", calories: 230, protein: 18, carbs: 40, fat: 0.8, servingSize: 198, servingUnit: "g" },
  { id: "chickpeas-cooked", name: "Chickpeas (cooked)", category: "Legumes", calories: 269, protein: 15, carbs: 45, fat: 4, servingSize: 164, servingUnit: "g" },
  { id: "kidney-beans-cooked", name: "Kidney Beans (cooked)", category: "Legumes", calories: 225, protein: 15, carbs: 40, fat: 0.9, servingSize: 177, servingUnit: "g" },
  { id: "tofu-firm", name: "Tofu (firm)", category: "Legumes", calories: 177, protein: 22, carbs: 4, fat: 11, servingSize: 248, servingUnit: "g" },
  { id: "tempeh", name: "Tempeh", category: "Legumes", calories: 222, protein: 31, carbs: 8, fat: 13, servingSize: 142, servingUnit: "g" },

  // ── Nuts & Seeds ───────────────────────────────────────────────────────────
  { id: "almonds", name: "Almonds", category: "Nuts & Seeds", calories: 164, protein: 6, carbs: 6, fat: 14, servingSize: 28, servingUnit: "g" },
  { id: "cashews", name: "Cashews", category: "Nuts & Seeds", calories: 157, protein: 5, carbs: 9, fat: 12, servingSize: 28, servingUnit: "g" },
  { id: "walnuts", name: "Walnuts", category: "Nuts & Seeds", calories: 185, protein: 4, carbs: 4, fat: 18, servingSize: 28, servingUnit: "g" },
  { id: "peanuts-dry-roasted", name: "Peanuts (dry roasted)", category: "Nuts & Seeds", calories: 166, protein: 7, carbs: 6, fat: 14, servingSize: 28, servingUnit: "g" },
  { id: "peanut-butter-natural", name: "Peanut Butter (natural)", category: "Nuts & Seeds", calories: 188, protein: 8, carbs: 7, fat: 16, servingSize: 32, servingUnit: "g" },
  { id: "almond-butter", name: "Almond Butter", category: "Nuts & Seeds", calories: 196, protein: 7, carbs: 7, fat: 18, servingSize: 32, servingUnit: "g" },
  { id: "chia-seeds", name: "Chia Seeds", category: "Nuts & Seeds", calories: 138, protein: 5, carbs: 12, fat: 9, servingSize: 28, servingUnit: "g" },
  { id: "flax-seeds", name: "Flax Seeds (ground)", category: "Nuts & Seeds", calories: 75, protein: 3, carbs: 4, fat: 6, servingSize: 14, servingUnit: "g" },
  { id: "hemp-seeds", name: "Hemp Seeds", category: "Nuts & Seeds", calories: 170, protein: 10, carbs: 2.6, fat: 14, servingSize: 30, servingUnit: "g" },
  { id: "pumpkin-seeds", name: "Pumpkin Seeds", category: "Nuts & Seeds", calories: 151, protein: 9, carbs: 5, fat: 13, servingSize: 28, servingUnit: "g" },
  { id: "sunflower-seeds", name: "Sunflower Seeds", category: "Nuts & Seeds", calories: 163, protein: 6, carbs: 7, fat: 14, servingSize: 28, servingUnit: "g" },

  // ── Oils & Fats ────────────────────────────────────────────────────────────
  { id: "olive-oil", name: "Olive Oil", category: "Oils & Fats", calories: 119, protein: 0, carbs: 0, fat: 14, servingSize: 14, servingUnit: "ml" },
  { id: "coconut-oil", name: "Coconut Oil", category: "Oils & Fats", calories: 121, protein: 0, carbs: 0, fat: 14, servingSize: 14, servingUnit: "ml" },
  { id: "avocado-oil", name: "Avocado Oil", category: "Oils & Fats", calories: 124, protein: 0, carbs: 0, fat: 14, servingSize: 14, servingUnit: "ml" },
  { id: "cream-cheese", name: "Cream Cheese", category: "Oils & Fats", calories: 99, protein: 2, carbs: 1.5, fat: 10, servingSize: 28, servingUnit: "g" },
  { id: "heavy-cream", name: "Heavy Cream", category: "Oils & Fats", calories: 103, protein: 0.6, carbs: 0.8, fat: 11, servingSize: 30, servingUnit: "ml" },

  // ── Snacks ─────────────────────────────────────────────────────────────────
  { id: "protein-bar-generic", name: "Protein Bar (generic)", category: "Snacks", calories: 210, protein: 20, carbs: 22, fat: 7, servingSize: 60, servingUnit: "g" },
  { id: "granola-bar", name: "Granola Bar", category: "Snacks", calories: 190, protein: 4, carbs: 29, fat: 7, servingSize: 47, servingUnit: "g" },
  { id: "potato-chips", name: "Potato Chips", category: "Snacks", calories: 149, protein: 2, carbs: 15, fat: 9, servingSize: 28, servingUnit: "g" },
  { id: "popcorn-air-popped", name: "Popcorn (air-popped)", category: "Snacks", calories: 93, protein: 3, carbs: 19, fat: 1, servingSize: 28, servingUnit: "g" },
  { id: "dark-chocolate-70", name: "Dark Chocolate 70%", category: "Snacks", calories: 170, protein: 2, carbs: 13, fat: 12, servingSize: 28, servingUnit: "g" },
  { id: "hummus", name: "Hummus", category: "Snacks", calories: 70, protein: 2, carbs: 6, fat: 5, servingSize: 50, servingUnit: "g" },
  { id: "trail-mix", name: "Trail Mix", category: "Snacks", calories: 173, protein: 5, carbs: 17, fat: 10, servingSize: 40, servingUnit: "g" },
  { id: "rice-cakes-cheddar", name: "Cheddar Rice Cakes", category: "Snacks", calories: 60, protein: 1, carbs: 13, fat: 0.5, servingSize: 16, servingUnit: "g" },

  // ── Beverages ──────────────────────────────────────────────────────────────
  { id: "orange-juice", name: "Orange Juice", category: "Beverages", calories: 112, protein: 1.7, carbs: 26, fat: 0.5, servingSize: 248, servingUnit: "ml" },
  { id: "protein-shake-generic", name: "Protein Shake (mixed, generic)", category: "Beverages", calories: 160, protein: 25, carbs: 8, fat: 3, servingSize: 300, servingUnit: "ml" },
  { id: "whole-chocolate-milk", name: "Chocolate Milk (whole)", category: "Beverages", calories: 208, protein: 8, carbs: 26, fat: 8, servingSize: 240, servingUnit: "ml" },
  { id: "sports-drink-gatorade", name: "Sports Drink (Gatorade-style)", category: "Beverages", calories: 80, protein: 0, carbs: 21, fat: 0, servingSize: 360, servingUnit: "ml" },

  // ── Supplements ────────────────────────────────────────────────────────────
  { id: "whey-protein-scoop", name: "Whey Protein (1 scoop)", category: "Supplements", calories: 120, protein: 24, carbs: 3, fat: 2, servingSize: 31, servingUnit: "g" },
  { id: "casein-protein-scoop", name: "Casein Protein (1 scoop)", category: "Supplements", calories: 120, protein: 24, carbs: 4, fat: 1, servingSize: 33, servingUnit: "g" },
  { id: "plant-protein-scoop", name: "Plant Protein (1 scoop)", category: "Supplements", calories: 120, protein: 20, carbs: 7, fat: 3, servingSize: 35, servingUnit: "g" },
  { id: "mass-gainer-scoop", name: "Mass Gainer (1 scoop)", category: "Supplements", calories: 650, protein: 50, carbs: 85, fat: 8, servingSize: 167, servingUnit: "g" },
  { id: "creatine-monohydrate", name: "Creatine Monohydrate (5g)", category: "Supplements", calories: 0, protein: 0, carbs: 0, fat: 0, servingSize: 5, servingUnit: "g" },
  { id: "bcaa-powder", name: "BCAA Powder (1 scoop)", category: "Supplements", calories: 15, protein: 4, carbs: 0, fat: 0, servingSize: 8, servingUnit: "g" },
];

// ── Search helper ─────────────────────────────────────────────────────────────

export function searchFoodDatabase(query: string, limit = 10): FoodPreset[] {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().trim();
  const results = foodDatabase.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
  );
  return results.slice(0, limit);
}
