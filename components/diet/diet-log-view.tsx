"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, addDays, subDays } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  LayoutList,
  BarChart2,
  Target,
  Coffee,
  Sun,
  Sunset,
  Cookie,
} from "lucide-react";
import { deleteDietEntry, getDietEntries, getDietHistory } from "@/actions/diet-actions";
import { MacroRings } from "@/components/diet/macro-rings";
import { AddFoodForm } from "@/components/diet/add-food-form";
import { MacroTargetForm } from "@/components/diet/macro-target-form";
import { DietHistoryChart } from "@/components/diet/diet-history-chart";
import { Button } from "@/components/ui/button";
import { MEAL_TYPES } from "@/types";
import { MEAL_TYPE_STYLES } from "@/lib/label-colors";
import type { DietDaySummary, DietEntry, MacroTarget, MealType } from "@/types";

interface Props {
  initialEntries: DietEntry[];
  initialTargets: MacroTarget | null;
  initialHistory: DietDaySummary[];
  initialDate: string;
}

const mealConfig: Record<MealType, { label: string; Icon: React.ElementType }> = {
  breakfast: { label: "Breakfast", Icon: Coffee },
  lunch: { label: "Lunch", Icon: Sun },
  dinner: { label: "Dinner", Icon: Sunset },
  snack: { label: "Snack", Icon: Cookie },
};

export function DietLogView({ initialEntries, initialTargets, initialHistory, initialDate }: Props) {
  const router = useRouter();
  const [view, setView] = useState<"today" | "history">("today");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [entries, setEntries] = useState<DietEntry[]>(initialEntries);
  const [history, setHistory] = useState<DietDaySummary[]>(initialHistory);
  const [targets] = useState<MacroTarget | null>(initialTargets);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMealType, setAddMealType] = useState<MealType>("breakfast");
  const [editingEntry, setEditingEntry] = useState<DietEntry | undefined>(undefined);
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [isDateLoading, startDateTransition] = useTransition();
  const [, startDeleteTransition] = useTransition();

  const today = format(new Date(), "yyyy-MM-dd");
  const isToday = selectedDate === today;

  // Compute daily totals
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Weekly avg for history
  const weeklyAvgKcal =
    history.filter((d) => d.entryCount > 0).length > 0
      ? Math.round(
          history.reduce((s, d) => s + d.calories, 0) /
            Math.max(history.filter((d) => d.entryCount > 0).length, 1)
        )
      : 0;
  const weeklyAvgProtein =
    history.filter((d) => d.entryCount > 0).length > 0
      ? Math.round(
          history.reduce((s, d) => s + d.protein, 0) /
            Math.max(history.filter((d) => d.entryCount > 0).length, 1)
        )
      : 0;
  const adherenceDays =
    targets && targets.calories > 0
      ? history.filter((d) => d.calories >= targets.calories * 0.85 && d.calories <= targets.calories * 1.15).length
      : 0;

  async function changeDate(newDate: string) {
    setShowAddForm(false);
    setEditingEntry(undefined);
    startDateTransition(async () => {
      setSelectedDate(newDate);
      const result = await getDietEntries(newDate);
      if (result.success) setEntries(result.data);
    });
  }

  async function refreshHistory() {
    const result = await getDietHistory(7);
    if (result.success) setHistory(result.data);
  }

  function handleAddClose() {
    setShowAddForm(false);
    setEditingEntry(undefined);
    router.refresh();
    // Also refresh local entries
    startDateTransition(async () => {
      const result = await getDietEntries(selectedDate);
      if (result.success) setEntries(result.data);
    });
  }

  function handleDeleteEntry(id: string) {
    startDeleteTransition(async () => {
      await deleteDietEntry(id);
      const result = await getDietEntries(selectedDate);
      if (result.success) setEntries(result.data);
      await refreshHistory();
    });
  }

  function openAddForm(mealType: MealType) {
    setEditingEntry(undefined);
    setAddMealType(mealType);
    setShowAddForm(true);
  }

  function openEditForm(entry: DietEntry) {
    setShowAddForm(false);
    setEditingEntry(entry);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* View toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1 w-fit">
        <button
          type="button"
          onClick={() => setView("today")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "today"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutList className="size-3.5" />
          Today
        </button>
        <button
          type="button"
          onClick={() => setView("history")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "history"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart2 className="size-3.5" />
          History
        </button>
      </div>

      {view === "today" ? (
        <>
          {/* Date navigator */}
          <div className="flex items-center gap-2 animate-fade-up">
            <button
              type="button"
              onClick={() => changeDate(format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd"))}
              disabled={isDateLoading}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-semibold min-w-32 text-center">
              {isToday ? "Today" : format(parseISO(selectedDate), "EEE, MMM d")}
            </span>
            <button
              type="button"
              onClick={() => changeDate(format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd"))}
              disabled={isDateLoading || isToday}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
            {!isToday && (
              <button
                type="button"
                onClick={() => changeDate(today)}
                className="ml-1 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Today
              </button>
            )}
          </div>

          {/* Macro rings */}
          <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
            <MacroRings
              calories={totals.calories}
              protein={totals.protein}
              carbs={totals.carbs}
              fat={totals.fat}
              targets={targets}
            />
          </div>

          {/* Add food button */}
          <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            <Button
              size="sm"
              onClick={() => openAddForm("breakfast")}
              className="gap-1.5"
            >
              <Plus className="size-3.5" />
              Add Food
            </Button>
          </div>

          {/* Add / Edit form */}
          {(showAddForm || editingEntry) && (
            <div className="animate-fade-up">
              <AddFoodForm
                date={selectedDate}
                defaultMealType={addMealType}
                editingEntry={editingEntry}
                onClose={handleAddClose}
              />
            </div>
          )}

          {/* Meal groups */}
          <div className="flex flex-col gap-4">
            {MEAL_TYPES.map((mealType, i) => {
              const mealEntries = entries.filter((e) => e.mealType === mealType);
              const mealKcal = mealEntries.reduce((s, e) => s + e.calories, 0);
              const { label, Icon } = mealConfig[mealType];

              return (
                <div
                  key={mealType}
                  className="rounded-xl border border-border bg-card overflow-hidden animate-fade-up"
                  style={{ animationDelay: `${(i + 2) * 60}ms` }}
                >
                  {/* Meal header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Icon className={`size-4 ${MEAL_TYPE_STYLES[mealType].icon}`} />
                      <span className={`text-sm font-semibold ${MEAL_TYPE_STYLES[mealType].header}`}>{label}</span>
                      {mealKcal > 0 && (
                        <span className="text-xs text-muted-foreground">{Math.round(mealKcal)} kcal</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => openAddForm(mealType)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Plus className="size-3" />
                      Add
                    </button>
                  </div>

                  {/* Entries */}
                  {mealEntries.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-muted-foreground">
                      No food logged
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {mealEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="group flex items-center justify-between gap-3 px-4 py-3"
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
                          <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => openEditForm(entry)}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Set targets */}
          <div className="animate-fade-up" style={{ animationDelay: "360ms" }}>
            {showTargetForm ? (
              <MacroTargetForm
                currentTargets={targets}
                onClose={() => {
                  setShowTargetForm(false);
                  router.refresh();
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowTargetForm(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Target className="size-3.5" />
                {targets ? "Edit macro targets" : "Set macro targets"}
              </button>
            )}
          </div>
        </>
      ) : (
        /* History view */
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-card p-5 animate-fade-up">
            <h2 className="mb-1 text-sm font-semibold">Last 7 Days</h2>
            <p className="mb-4 text-xs text-muted-foreground">Macros stacked by day</p>
            <DietHistoryChart history={history} targets={targets} />
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: "80ms" }}>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Avg Daily Kcal</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {weeklyAvgKcal > 0 ? weeklyAvgKcal.toLocaleString() : "—"}
              </p>
              {targets && weeklyAvgKcal > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  target {targets.calories.toLocaleString()}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Avg Protein</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {weeklyAvgProtein > 0 ? `${weeklyAvgProtein}g` : "—"}
              </p>
              {targets && weeklyAvgProtein > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  target {targets.protein}g
                </p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">On Target</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {targets?.calories ? `${adherenceDays}/7` : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">days (±15%)</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
