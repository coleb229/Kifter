"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
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
  Camera,
  AlertTriangle,
} from "lucide-react";
import { addDietEntry, deleteDietEntry, getDietEntries, getDietHistory, getDietDataYears, getDietMonthlyHistory, copyDietDay, getRecentFoods } from "@/actions/diet-actions";
import { getMealTemplates, createMealTemplate, deleteMealTemplate, applyMealTemplate } from "@/actions/meal-template-actions";
import { MacroRings } from "@/components/diet/macro-rings";
import { AddFoodForm } from "@/components/diet/add-food-form";
import { BarcodeScanner } from "@/components/diet/barcode-scanner";
import { MacroTargetForm } from "@/components/diet/macro-target-form";
import { DietHistoryChart } from "@/components/diet/diet-history-chart";
import { Button } from "@/components/ui/button";
import { YearPicker } from "@/components/ui/year-picker";
import { MEAL_TYPES } from "@/types";
import { MEAL_TYPE_STYLES } from "@/lib/label-colors";
import type { BodyTarget, DietDaySummary, DietEntry, MacroTarget, MealTemplate, MealType, RecentFood } from "@/types";
import { submitCommunityFood } from "@/actions/food-actions";
import type { FoodSearchResult } from "@/actions/food-actions";
import { calculateTDEE } from "@/lib/tdee";

interface Props {
  initialEntries: DietEntry[];
  initialTargets: MacroTarget | null;
  initialHistory: DietDaySummary[];
  initialDate: string;
  initialTodaySessions?: { bodyTarget: BodyTarget; durationMinutes?: number }[];
  initialBodyWeightKg?: number;
}

const mealConfig: Record<MealType, { label: string; Icon: React.ElementType }> = {
  breakfast: { label: "Breakfast", Icon: Coffee },
  lunch: { label: "Lunch", Icon: Sun },
  dinner: { label: "Dinner", Icon: Sunset },
  snack: { label: "Snack", Icon: Cookie },
};

function getMealTypeForTime(): MealType {
  const hour = new Date().getHours();
  if (hour < 10) return "breakfast";
  if (hour < 14) return "lunch";
  if (hour < 18) return "snack";
  return "dinner";
}

export function DietLogView({ initialEntries, initialTargets, initialHistory, initialDate, initialTodaySessions = [], initialBodyWeightKg = 70 }: Props) {
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
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [showBarcode, setShowBarcode] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [isDateLoading, startDateTransition] = useTransition();
  const [, startDeleteTransition] = useTransition();
  const [isPendingTemplate, startTemplateTransition] = useTransition();
  const [, startYearTransition] = useTransition();
  const [isCopying, startCopyTransition] = useTransition();
  const [, startQuickAddTransition] = useTransition();
  const [bodyWeightKg, setBodyWeightKg] = useState(initialBodyWeightKg);
  const [editingWeight, setEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState(String(Math.round(initialBodyWeightKg)));
  const addFormRef = useRef<HTMLDivElement>(null);

  // Scroll the add/edit form into view whenever it opens
  useEffect(() => {
    if ((showAddForm || editingEntry) && addFormRef.current) {
      addFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showAddForm, editingEntry]);

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

  // TDEE estimate
  const tdeeResult = calculateTDEE(initialTodaySessions, bodyWeightKg);

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

  // Correct for server-UTC date mismatch: if initialDate is in the future
  // relative to client's local timezone, reset to today and reload entries.
  useEffect(() => {
    const clientToday = format(new Date(), "yyyy-MM-dd");
    if (selectedDate > clientToday) {
      setSelectedDate(clientToday);
      startDateTransition(async () => {
        const res = await getDietEntries(clientToday);
        if (res.success) setEntries(res.data);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load recent foods on mount
  useEffect(() => {
    getRecentFoods(8).then((res) => {
      if (res.success) setRecentFoods(res.data);
    });
  }, []);

  // Check nudge dismiss state
  useEffect(() => {
    const key = `kifted-nudge-dismissed-${today}`;
    setNudgeDismissed(localStorage.getItem(key) === "true");
  }, [today]);

  // End-of-day nudge check (re-evaluates when entries change)
  const showNudge =
    isToday &&
    !nudgeDismissed &&
    targets != null &&
    targets.calories > 0 &&
    totals.calories < targets.calories * 0.8 &&
    new Date().getHours() >= 20;

  function dismissNudge() {
    localStorage.setItem(`kifted-nudge-dismissed-${today}`, "true");
    setNudgeDismissed(true);
  }

  async function changeDate(newDate: string) {
    setShowAddForm(false);
    setEditingEntry(undefined);
    setShowBarcode(false);
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

  function handleAddClose(saved = false) {
    setShowAddForm(false);
    setEditingEntry(undefined);
    setShowBarcode(false);
    if (saved) {
      startDateTransition(async () => {
        const result = await getDietEntries(selectedDate);
        if (result.success) setEntries(result.data);
        // Refresh recent foods after adding
        const recentRes = await getRecentFoods(8);
        if (recentRes.success) setRecentFoods(recentRes.data);
      });
    }
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
    setShowBarcode(false);
  }

  function openEditForm(entry: DietEntry) {
    setShowAddForm(false);
    setEditingEntry(entry);
    setShowBarcode(false);
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

  function handleBarcodeFoodSelect(food: FoodSearchResult) {
    // Pre-fill the add form with barcode result then show the form
    setAddMealType(getMealTypeForTime());
    setShowBarcode(false);
    setShowAddForm(true);
    // The form will open; we surface the food by triggering handleAddClose which refreshes.
    // Actually we need to pass food to AddFoodForm - use a quick-add instead:
    startQuickAddTransition(async () => {
      await addDietEntry({
        date: selectedDate,
        mealType: getMealTypeForTime(),
        food: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      });
      const refreshed = await getDietEntries(selectedDate);
      if (refreshed.success) setEntries(refreshed.data);
      const recentRes = await getRecentFoods(8);
      if (recentRes.success) setRecentFoods(recentRes.data);
      setShowBarcode(false);
      setShowAddForm(false);
    });
    // Silently contribute to community food library (ignore duplicates)
    submitCommunityFood({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
    }).catch(() => {});
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

          {/* Today's macros summary bar — sticky */}
          {targets && entries.length > 0 && (
            <div className="sticky top-0 z-10 -mx-4 flex items-center gap-4 border-b border-border bg-background/95 px-4 py-2 text-xs backdrop-blur animate-fade-up">
              {([
                { label: "P", value: totals.protein, target: targets.protein, color: "text-emerald-500" },
                { label: "C", value: totals.carbs,   target: targets.carbs,   color: "text-amber-500" },
                { label: "F", value: totals.fat,     target: targets.fat,     color: "text-rose-500" },
              ] as const).map(({ label, value, target, color }) => (
                <span key={label}>
                  <span className={`font-semibold ${color}`}>{label}</span>{" "}
                  {Math.round(value)}/{target}g
                </span>
              ))}
              <span className="ml-auto text-muted-foreground">
                {Math.round(totals.calories)}/{targets.calories} kcal
              </span>
            </div>
          )}

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

          {/* Macro ratio pie chart */}
          {entries.length > 0 && (() => {
            const proteinKcal = totals.protein * 4;
            const carbsKcal = totals.carbs * 4;
            const fatKcal = totals.fat * 9;
            const totalMacroKcal = proteinKcal + carbsKcal + fatKcal;
            if (totalMacroKcal === 0) return null;
            const pct = (v: number) => Math.round((v / totalMacroKcal) * 100);
            const pieData = [
              { name: "Protein", value: proteinKcal, color: "#6366f1" },
              { name: "Carbs",   value: carbsKcal,   color: "#f59e0b" },
              { name: "Fat",     value: fatKcal,      color: "#10b981" },
            ];
            return (
              <div className="rounded-xl border border-border bg-card p-4 animate-fade-up" style={{ animationDelay: "70ms" }}>
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Macro Split</p>
                <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-6">
                  <ResponsiveContainer width="100%" height={180} className="sm:max-w-[220px]">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius="55%"
                        outerRadius="80%"
                        dataKey="value"
                        label={({ cx, cy }) => (
                          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="fill-foreground">
                            <tspan x={cx} dy="-0.3em" fontSize={18} fontWeight={600}>{Math.round(totalMacroKcal)}</tspan>
                            <tspan x={cx} dy="1.4em" fontSize={11} fill="currentColor" opacity={0.5}>kcal</tspan>
                          </text>
                        )}
                        labelLine={false}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${Math.round(Number(value))} kcal (${pct(Number(value))})%`, String(name)]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 text-sm sm:flex-col sm:gap-2">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-muted-foreground">{d.name}</span>
                        <span className="font-medium">{pct(d.value)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TDEE estimate card */}
          {isToday && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 animate-fade-up" style={{ animationDelay: "75ms" }}>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Est. TDEE</p>
                <p className="text-lg font-semibold">{tdeeResult.tdee.toLocaleString()} kcal</p>
                <p className="text-[11px] text-muted-foreground">
                  {tdeeResult.isBMROnly ? "No workouts today — BMR estimate" : `BMR ${tdeeResult.bmr} + ${initialTodaySessions.length} workout${initialTodaySessions.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              {editingWeight ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min={20}
                    max={300}
                    step={0.1}
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="h-7 w-16 rounded border border-input bg-background px-1.5 text-sm focus-visible:outline-none"
                  />
                  <span className="text-xs text-muted-foreground">kg</span>
                  <button
                    type="button"
                    onClick={() => {
                      const v = parseFloat(weightInput);
                      if (!isNaN(v) && v > 0) setBodyWeightKg(v);
                      setEditingWeight(false);
                    }}
                    className="text-xs font-medium text-primary"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingWeight(true)}
                  className="shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                >
                  {Math.round(bodyWeightKg)} kg
                </button>
              )}
            </div>
          )}

          {/* Calorie budget meter */}
          {targets && (
            <div className="rounded-lg border border-border bg-card px-4 py-3 animate-fade-up" style={{ animationDelay: "80ms" }}>
              <div className="mb-1.5 flex justify-between text-xs font-medium">
                <span>Calories</span>
                <span className={totals.calories > targets.calories ? "text-destructive" : ""}>
                  {Math.round(totals.calories)} / {targets.calories} kcal
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (totals.calories / targets.calories) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* End-of-day nudge banner */}
          {showNudge && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30 animate-fade-up">
              <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  You&apos;re {Math.round(targets!.calories - totals.calories)} kcal below your goal today
                </p>
                <button
                  type="button"
                  onClick={() => openAddForm("snack")}
                  className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400 underline underline-offset-2"
                >
                  Quick log a snack →
                </button>
              </div>
              <button type="button" onClick={dismissNudge} className="text-amber-600 hover:text-amber-800 dark:text-amber-400">
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Recent foods carousel */}
          {recentFoods.length > 0 && (
            <div className="animate-fade-up" style={{ animationDelay: "90ms" }}>
              <p className="mb-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Recent</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {recentFoods.map((food) => (
                  <button
                    key={food.name}
                    type="button"
                    onClick={() => {
                      startQuickAddTransition(async () => {
                        await addDietEntry({
                          date: selectedDate,
                          mealType: getMealTypeForTime(),
                          food: food.name,
                          calories: food.calories,
                          protein: food.protein,
                          carbs: food.carbs,
                          fat: food.fat,
                        });
                        const refreshed = await getDietEntries(selectedDate);
                        if (refreshed.success) setEntries(refreshed.data);
                      });
                    }}
                    className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground whitespace-nowrap"
                  >
                    + {food.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add food + Templates + Camera buttons */}
          <div id="add-food-section" className="flex flex-wrap items-center gap-2 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <Button size="sm" onClick={() => openAddForm(getMealTypeForTime())} className="gap-1.5">
              <Plus className="size-3.5" />
              Add Food
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setShowBarcode((v) => !v); setShowAddForm(false); setEditingEntry(undefined); }}
              className="gap-1.5"
            >
              <Camera className="size-3.5" />
              Scan
            </Button>
            <Button size="sm" variant="outline" onClick={openTemplates} className="gap-1.5">
              <BookTemplate className="size-3.5" />
              Templates
            </Button>
          </div>

          {/* Inline barcode scanner shortcut */}
          {showBarcode && (
            <div className="animate-fade-up">
              <BarcodeScanner onSelect={handleBarcodeFoodSelect} defaultOpen />
            </div>
          )}

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
            <div ref={addFormRef} className="animate-fade-up">
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
                          <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
            <>
              <div className="rounded-xl border border-border bg-card p-5 animate-fade-up">
                <h2 className="mb-1 text-sm font-semibold">{selectedHistoryYear} Overview</h2>
                <p className="mb-4 text-xs text-muted-foreground">Avg daily macros per month</p>
                <DietHistoryChart history={yearlyHistory} targets={targets} mode="monthly" />
              </div>

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
            <>
              <div className="rounded-xl border border-border bg-card p-5 animate-fade-up">
                <h2 className="mb-1 text-sm font-semibold">Last 7 Days</h2>
                <p className="mb-4 text-xs text-muted-foreground">Macros stacked by day</p>
                <DietHistoryChart history={history} targets={targets} mode="daily" />
              </div>

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
