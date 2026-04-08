"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { CalendarDays, Minus, Plus, Check } from "lucide-react";
import { logRecipeToDiet } from "@/actions/pantry-actions";
import { MEAL_TYPE_STYLES } from "@/lib/label-colors";
import type { RecipePreset } from "@/lib/recipe-database";
import type { MealType } from "@/types";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";

const MEAL_TYPES: { type: MealType; label: string; icon: string }[] = [
  { type: "breakfast", label: "Breakfast", icon: "☕" },
  { type: "lunch", label: "Lunch", icon: "☀️" },
  { type: "dinner", label: "Dinner", icon: "🌅" },
  { type: "snack", label: "Snack", icon: "🍪" },
];

interface RecipeLogSheetProps {
  recipe: RecipePreset | null;
  open: boolean;
  onClose: () => void;
}

export function RecipeLogSheet({ recipe, open, onClose }: RecipeLogSheetProps) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [servings, setServings] = useState(1);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    setSuccess(false);
    setServings(1);
    onClose();
  }

  function handleLog() {
    if (!recipe) return;
    startTransition(async () => {
      const result = await logRecipeToDiet(recipe.id, date, mealType, servings);
      if (result.success) {
        setSuccess(true);
        setTimeout(handleClose, 1200);
      }
    });
  }

  if (!recipe) return null;

  const cal = Math.round(recipe.calories * servings);
  const protein = Math.round(recipe.protein * servings);
  const carbs = Math.round(recipe.carbs * servings);
  const fat = Math.round(recipe.fat * servings);

  return (
    <BottomSheet open={open} onClose={handleClose} title={success ? undefined : "Log to Diet"}>
      {success ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
            <Check className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="font-semibold">Logged!</p>
          <p className="text-sm text-muted-foreground">{recipe.name} added to your diet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Recipe name */}
          <p className="font-medium">{recipe.name}</p>

          {/* Date picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="log-date">Date</label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="log-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Meal type */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Meal</span>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map(({ type, label, icon }) => {
                const styles = MEAL_TYPE_STYLES[type];
                return (
                  <button
                    key={type}
                    onClick={() => setMealType(type)}
                    className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                      mealType === type ? styles.pill.active : styles.pill.inactive
                    }`}
                  >
                    <span className="text-sm">{icon}</span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Servings */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Servings</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setServings(Math.max(0.5, servings - 0.5))}
                disabled={servings <= 0.5}
                className="flex size-9 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted disabled:opacity-40"
                aria-label="Decrease servings"
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-[3ch] text-center text-lg font-bold tabular-nums">{servings}</span>
              <button
                onClick={() => setServings(Math.min(10, servings + 0.5))}
                disabled={servings >= 10}
                className="flex size-9 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted disabled:opacity-40"
                aria-label="Increase servings"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          {/* Macro preview */}
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Nutrition ({servings} serving{servings !== 1 ? "s" : ""})</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-sm font-bold tabular-nums text-indigo-600 dark:text-indigo-400">{cal}</p>
                <p className="text-[10px] text-muted-foreground">Cal</p>
              </div>
              <div>
                <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{protein}g</p>
                <p className="text-[10px] text-muted-foreground">Protein</p>
              </div>
              <div>
                <p className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">{carbs}g</p>
                <p className="text-[10px] text-muted-foreground">Carbs</p>
              </div>
              <div>
                <p className="text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400">{fat}g</p>
                <p className="text-[10px] text-muted-foreground">Fat</p>
              </div>
            </div>
          </div>

          {/* Log button */}
          <Button onClick={handleLog} disabled={isPending} className="w-full">
            {isPending ? "Logging..." : "Log to Diet"}
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}
