"use client";

import { useRef } from "react";
import { Plus, Pencil, Trash2, Coffee, Sun, Sunset, Cookie } from "lucide-react";
import { MEAL_TYPE_STYLES } from "@/lib/label-colors";
import type { DietEntry, MealType } from "@/types";

const mealConfig: Record<MealType, { label: string; Icon: React.ElementType }> = {
  breakfast: { label: "Breakfast", Icon: Coffee },
  lunch: { label: "Lunch", Icon: Sun },
  dinner: { label: "Dinner", Icon: Sunset },
  snack: { label: "Snack", Icon: Cookie },
};

interface Props {
  mealType: MealType;
  entries: DietEntry[];
  swipedEntryId: string | null;
  animationIndex: number;
  onAdd: (mealType: MealType) => void;
  onEdit: (entry: DietEntry) => void;
  onDelete: (id: string) => void;
  onSwipeChange: (id: string | null) => void;
}

export function MealGroup({ mealType, entries, swipedEntryId, animationIndex, onAdd, onEdit, onDelete, onSwipeChange }: Props) {
  const swipeStartX = useRef(0);
  const swipeActiveId = useRef("");
  const { label, Icon } = mealConfig[mealType];
  const mealKcal = entries.reduce((s, e) => s + e.calories, 0);

  return (
    <div
      className={`rounded-xl border border-border border-l-[3px] ${MEAL_TYPE_STYLES[mealType].borderLeft} bg-card overflow-hidden animate-fade-up`}
      style={{ animationDelay: `${(animationIndex + 2) * 60}ms` }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 active:scale-[0.98] transition-transform">
        <div className="flex items-center gap-2">
          <Icon className={`size-4 ${MEAL_TYPE_STYLES[mealType].icon}`} />
          <span className={`text-sm font-semibold ${MEAL_TYPE_STYLES[mealType].header}`}>{label}</span>
          {entries.length > 0 && (
            <span className="flex items-center justify-center size-5 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">{entries.length}</span>
          )}
          {mealKcal > 0 && (
            <span className="text-xs text-muted-foreground">{Math.round(mealKcal)} kcal</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onAdd(mealType)}
          className="flex items-center gap-1 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-3" />
          Add
        </button>
      </div>

      {entries.length === 0 ? (
        <button
          type="button"
          onClick={() => onAdd(mealType)}
          className="flex w-full items-center justify-center gap-2 rounded-lg mx-3 my-3 border border-dashed border-border/60 py-3 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground hover:border-border"
          style={{ width: "calc(100% - 1.5rem)" }}
        >
          <Plus className="size-3.5" />
          Add {label.toLowerCase()}
        </button>
      ) : (
        <div className="divide-y divide-border">
          {entries.map((entry) => (
            <div key={entry.id} className="relative overflow-hidden">
              {/* Swipe-reveal delete background */}
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                  type="button"
                  onClick={() => { onSwipeChange(null); onDelete(entry.id); }}
                  className="flex h-full w-16 items-center justify-center bg-rose-600 text-white text-xs font-medium"
                >
                  Delete
                </button>
              </div>
              <div
                className="group relative flex items-center justify-between gap-3 bg-card px-4 py-3 transition-transform"
                style={{ transform: swipedEntryId === entry.id ? "translateX(-64px)" : undefined }}
                onTouchStart={(e) => {
                  swipeStartX.current = e.touches[0].clientX;
                  swipeActiveId.current = entry.id;
                }}
                onTouchMove={(e) => {
                  if (swipeActiveId.current !== entry.id) return;
                  const delta = e.touches[0].clientX - swipeStartX.current;
                  if (delta > 0) return;
                  const clamped = Math.max(-80, delta);
                  (e.currentTarget as HTMLDivElement).style.transform = `translateX(${clamped}px)`;
                  (e.currentTarget as HTMLDivElement).style.transition = "none";
                }}
                onTouchEnd={(e) => {
                  if (swipeActiveId.current !== entry.id) return;
                  const delta = e.changedTouches[0].clientX - swipeStartX.current;
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transition = "transform 0.2s ease";
                  if (delta < -50) {
                    el.style.transform = "translateX(-64px)";
                    onSwipeChange(entry.id);
                  } else {
                    el.style.transform = "";
                    onSwipeChange(null);
                  }
                  swipeActiveId.current = "";
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{entry.food}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(entry.calories)} kcal · P {Math.round(entry.protein)}g · C {Math.round(entry.carbs)}g · F {Math.round(entry.fat)}g
                  </p>
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground italic">{entry.notes}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onEdit(entry)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(entry.id)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
