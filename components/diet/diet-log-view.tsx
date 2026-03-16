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
  BookTemplate,
  X,
  Save,
  Copy,
} from "lucide-react";
import { deleteDietEntry, getDietEntries, getDietHistory, getDietDataYears, getDietMonthlyHistory, copyDietDay } from "@/actions/diet-actions";
import { getMealTemplates, createMealTemplate, deleteMealTemplate, applyMealTemplate } from "@/actions/meal-template-actions";
import { MacroRings } from "@/components/diet/macro-rings";
import { AddFoodForm } from "@/components/diet/add-food-form";
import { MacroTargetForm } from "@/components/diet/macro-target-form";
import { DietHistoryChart } from "@/components/diet/diet-history-chart";
import { Button } from "@/components/ui/button";
import { YearPicker } from "@/components/ui/year-picker";
import { MEAL_TYPES } from "@/types";
import { MEAL_TYPE_STYLES } from "@/lib/label-colors";
import type { DietDaySummary, DietEntry, MacroTarget, MealTemplate, MealType } from "@/types";

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
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [isDateLoading, startDateTransition] = useTransition();
  const [, startDeleteTransition] = useTransition();
  const [isPendingTemplate, startTemplateTransition] = useTransition();
  const [, startYearTransition] = useTransition();
  const [isCopying, startCopyTransition] = useTransition();

  // Year-based history state
  const currentYear = new Date().getFullYear();
  const [dietYears, setDietYears] = useState<number[]>([]);
  const [selectedHistoryYear, setSelectedHistoryYear] = useState<number | null>(null);
  const [yearlyHistory, setYearlyHistory] = useState<DietDaySummary[]>([]);

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

  async function openHistory() {
    setView("history");
    if (dietYears.length === 0) {
      const yearsResult = await getDietDataYears();
      if (yearsResult.success) {
        setDietYears(yearsResult.data);
      }
    }
  }

  function handleHistoryYearChange(year: number) {
    setSelectedHistoryYear(year);
    startYearTransition(async () => {
      const result = await getDietMonthlyHistory(year);
      if (result.success) setYearlyHistory(result.data);
    });
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
    setEntries((prev) => prev.filter((e) => e.id !== id));
    startDeleteTransition(async () => {
      await deleteDietEntry(id);
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

  async function openTemplates() {
    const result = await getMealTemplates();
    if (result.success) setTemplates(result.data);
    setShowTemplates(true);
  }

  function handleApplyTemplate(id: string) {
    startTemplateTransition(async () => {
      await applyMealTemplate(id, selectedDate);
      const result = await getDietEntries(selectedDate);
      if (result.success) setEntries(result.data);
      setShowTemplates(false);
    });
  }

  function handleDeleteTemplate(id: string) {
    startTemplateTransition(async () => {
      await deleteMealTemplate(id);
      const result = await getMealTemplates();
      if (result.success) setTemplates(result.data);
    });
  }

  function handleSaveAsTemplate() {
    if (!templateName.trim() || !entries.length) return;
    startTemplateTransition(async () => {
      await createMealTemplate(
        templateName.trim(),
        entries.map((e) => ({
          food: e.food,
          calories: e.calories,
          protein: e.protein,
          carbs: e.carbs,
          fat: e.fat,
          mealType: e.mealType,
        }))
      );
      setTemplateName("");
      const result = await getMealTemplates();
      if (result.success) setTemplates(result.data);
    });
  }

  function handleCopyYesterday() {
    const yesterday = format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd");
    startCopyTransition(async () => {
      const result = await copyDietDay(yesterday, selectedDate);
      if (result.success && result.data.copied > 0) {
        const refreshed = await getDietEntries(selectedDate);
        if (refreshed.success) setEntries(refreshed.data);
      }
    });
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
          onClick={openHistory}
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
            {entries.length === 0 && (
              <button
                type="button"
                onClick={handleCopyYesterday}
                disabled={isCopying}
                className="ml-auto flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <Copy className="size-3" />
                {isCopying ? "Copying…" : "Copy from yesterday"}
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

          {/* Add food + Templates buttons */}
          <div id="add-food-section" className="flex items-center gap-2 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <Button size="sm" onClick={() => openAddForm("breakfast")} className="gap-1.5">
              <Plus className="size-3.5" />
              Add Food
            </Button>
            <Button size="sm" variant="outline" onClick={openTemplates} className="gap-1.5">
              <BookTemplate className="size-3.5" />
              Templates
            </Button>
          </div>

          {/* Templates overlay */}
          {showTemplates && (
            <>
              <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowTemplates(false)} />
              <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-background shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <p className="font-semibold">Meal Templates</p>
                  <button type="button" onClick={() => setShowTemplates(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
                  {/* Saved templates */}
                  {templates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No templates saved yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {templates.map((t) => {
                        const totalKcal = t.items.reduce((s, i) => s + i.calories, 0);
                        return (
                          <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                            <div>
                              <p className="text-sm font-medium">{t.name}</p>
                              <p className="text-xs text-muted-foreground">{t.items.length} item{t.items.length !== 1 ? "s" : ""} · {Math.round(totalKcal)} kcal</p>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => handleApplyTemplate(t.id)} disabled={isPendingTemplate} className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:brightness-110 disabled:opacity-50">Apply</button>
                              <button type="button" onClick={() => handleDeleteTemplate(t.id)} disabled={isPendingTemplate} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"><Trash2 className="size-3.5" /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Save today as template */}
                  {entries.length > 0 && (
                    <div className="border-t border-border pt-4">
                      <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Save today as template</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Template name"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                        />
                        <button type="button" onClick={handleSaveAsTemplate} disabled={isPendingTemplate || !templateName.trim()} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-50">
                          <Save className="size-3.5" />
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

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
          {/* Year picker */}
          {dietYears.length > 1 && (
            <div className="animate-fade-up">
              <YearPicker
                years={dietYears}
                selectedYear={selectedHistoryYear ?? currentYear}
                onChange={handleHistoryYearChange}
              />
            </div>
          )}

          {selectedHistoryYear !== null ? (
            /* Annual monthly view */
            <>
              <div className="rounded-xl border border-border bg-card p-5 animate-fade-up">
                <h2 className="mb-1 text-sm font-semibold">{selectedHistoryYear} Overview</h2>
                <p className="mb-4 text-xs text-muted-foreground">Avg daily macros per month</p>
                <DietHistoryChart history={yearlyHistory} targets={targets} mode="monthly" />
              </div>

              {/* Annual summary cards */}
              {(() => {
                const activeDays = yearlyHistory.filter((d) => d.entryCount > 0);
                const annualAvgKcal = activeDays.length > 0
                  ? Math.round(activeDays.reduce((s, d) => s + d.calories, 0) / activeDays.length)
                  : 0;
                const annualAvgProtein = activeDays.length > 0
                  ? Math.round(activeDays.reduce((s, d) => s + d.protein, 0) / activeDays.length)
                  : 0;
                const annualAdherence = targets?.calories
                  ? activeDays.filter((d) => d.calories >= targets.calories * 0.85 && d.calories <= targets.calories * 1.15).length
                  : 0;
                return (
                  <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: "80ms" }}>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground mb-1">Avg Daily Kcal</p>
                      <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                        {annualAvgKcal > 0 ? annualAvgKcal.toLocaleString() : "—"}
                      </p>
                      {targets && annualAvgKcal > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">target {targets.calories.toLocaleString()}</p>
                      )}
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground mb-1">Avg Protein</p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {annualAvgProtein > 0 ? `${annualAvgProtein}g` : "—"}
                      </p>
                      {targets && annualAvgProtein > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">target {targets.protein}g</p>
                      )}
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground mb-1">On Target</p>
                      <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                        {targets?.calories ? `${annualAdherence}/${activeDays.length}` : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">months (±15%)</p>
                    </div>
                  </div>
                );
              })()}
            </>
          ) : (
            /* Default rolling 7-day view */
            <>
              <div className="rounded-xl border border-border bg-card p-5 animate-fade-up">
                <h2 className="mb-1 text-sm font-semibold">Last 7 Days</h2>
                <p className="mb-4 text-xs text-muted-foreground">Macros stacked by day</p>
                <DietHistoryChart history={history} targets={targets} mode="daily" />
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
            </>
          )}
        </div>
      )}

    </div>
  );
}
