"use client";

import { useState, useTransition } from "react";
import { addDietEntry, getDietEntries, getRecentFoods } from "@/actions/diet-actions";
import { useToast } from "@/components/ui/toast";
import type { DietEntry, MealType, RecentFood } from "@/types";

interface Props {
  initialRecentFoods: RecentFood[];
  selectedDate: string;
  getMealTypeForTime: () => MealType;
  onEntriesUpdate: (entries: DietEntry[]) => void;
}

export function QuickAddSection({ initialRecentFoods, selectedDate, getMealTypeForTime, onEntriesUpdate }: Props) {
  const { showToast } = useToast();
  const [recentFoods, setRecentFoods] = useState(initialRecentFoods);
  const [quickAddCooldown, setQuickAddCooldown] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (recentFoods.length === 0) return null;

  return (
    <div className="animate-fade-up" style={{ animationDelay: "90ms" }}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">Quick Add</p>
        <span className="text-[11px] text-muted-foreground">{recentFoods.length} items</span>
      </div>
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {recentFoods.slice(0, 6).map((food) => (
            <button
              key={food.name}
              type="button"
              disabled={quickAddCooldown === food.name}
              onClick={() => {
                if (quickAddCooldown === food.name) return;
                setQuickAddCooldown(food.name);
                setTimeout(() => setQuickAddCooldown(null), 500);
                startTransition(async () => {
                  try {
                    const result = await addDietEntry({
                      date: selectedDate,
                      mealType: getMealTypeForTime(),
                      food: food.name,
                      calories: food.calories,
                      protein: food.protein,
                      carbs: food.carbs,
                      fat: food.fat,
                    });
                    if (result.success) {
                      showToast(`Added ${food.name}`, "success");
                      const [refreshed, recentRes] = await Promise.all([getDietEntries(selectedDate), getRecentFoods(8)]);
                      if (refreshed.success) onEntriesUpdate(refreshed.data);
                      if (recentRes.success) setRecentFoods(recentRes.data);
                    } else {
                      showToast(result.error, "error");
                    }
                  } catch { showToast("Failed to add food", "error"); }
                });
              }}
              className="shrink-0 rounded-full border border-border px-4 py-2.5 text-sm text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95 disabled:opacity-50 whitespace-nowrap touch-manipulation"
            >
              + {food.name} <span className="ml-1 text-[11px] opacity-60">{Math.round(food.calories)}</span>
            </button>
          ))}
        </div>
        {/* Right fade gradient */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
      </div>
    </div>
  );
}
