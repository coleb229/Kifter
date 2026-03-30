"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
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
  Utensils,
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
import { MEAL_TYPE_STYLES, MACRO_COLORS } from "@/lib/label-colors";
import { useToast } from "@/components/ui/toast";
import { BottomSheet } from "@/components/ui/bottom-sheet";
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
  const { showToast } = useToast();
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
  const [barcodePrefill, setBarcodePrefill] = useState<FoodSearchResult | undefined>(undefined);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [isDateLoading, startDateTransition] = useTransition();
  const [, startDeleteTransition] = useTransition();
  const [isPendingTemplate, startTemplateTransition] = useTransition();
  const [, startYearTransition] = useTransition();
  const [isCopying, startCopyTransition] = useTransition();
  const [, startQuickAddTransition] = useTransition();
  const pendingDeleteRef = useRef<{ id: string; entry: DietEntry; timeout: ReturnType<typeof setTimeout> } | null>(null);
  const [quickAddCooldown, setQuickAddCooldown] = useState<string | null>(null);
  const swipeStartX = useRef(0);
  const swipeActiveId = useRef("");
  const [swipedEntryId, setSwipedEntryId] = useState<string | null>(null);
  const dateSwipeStartX = useRef(0);
  const dateSwipeStartY = useRef(0);
  const [bodyWeightKg, setBodyWeightKg] = useState(initialBodyWeightKg);
  const [editingWeight, setEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState(String(Math.round(initialBodyWeightKg)));
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

  // Cleanup pending delete timeout on unmount
  useEffect(() => () => {
    if (pendingDeleteRef.current) clearTimeout(pendingDeleteRef.current.timeout);
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
    setBarcodePrefill(undefined);
    if (saved) {
      startDateTransition(async () => {
        const [result, recentRes] = await Promise.all([getDietEntries(selectedDate), getRecentFoods(8)]);
        if (result.success) setEntries(result.data);
        if (recentRes.success) setRecentFoods(recentRes.data);
      });
    }
  }

  function handleDeleteEntry(id: string) {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;

    // Cancel any existing pending delete and execute it immediately
    if (pendingDeleteRef.current) {
      clearTimeout(pendingDeleteRef.current.timeout);
      const prevId = pendingDeleteRef.current.id;
      startDeleteTransition(async () => {
        try { await deleteDietEntry(prevId); await refreshHistory(); } catch {}
      });
    }

    // Optimistically remove from UI
    setEntries((prev) => prev.filter((e) => e.id !== id));

    // 5-second undo window, then actually delete
    const timeout = setTimeout(() => {
      pendingDeleteRef.current = null;
      startDeleteTransition(async () => {
        try {
          const result = await deleteDietEntry(id);
          if (!result.success) showToast(result.error, "error");
          await refreshHistory();
        } catch { showToast("Failed to delete entry", "error"); }
      });
    }, 5000);

    pendingDeleteRef.current = { id, entry, timeout };

    showToast(`Deleted ${entry.food}`, "info", {
      action: {
        label: "Undo",
        onClick: () => {
          if (pendingDeleteRef.current?.id === id) {
            clearTimeout(pendingDeleteRef.current.timeout);
            pendingDeleteRef.current = null;
            setEntries((prev) => [...prev, entry].sort((a, b) => a.id.localeCompare(b.id)));
          }
        },
      },
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
      try {
        await applyMealTemplate(id, selectedDate);
        const result = await getDietEntries(selectedDate);
        if (result.success) setEntries(result.data);
        setShowTemplates(false);
        showToast("Template applied", "success");
      } catch { showToast("Failed to apply template", "error"); }
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
      try {
        const result = await copyDietDay(yesterday, selectedDate);
        if (result.success && result.data.copied > 0) {
          const refreshed = await getDietEntries(selectedDate);
          if (refreshed.success) setEntries(refreshed.data);
          showToast(`Copied ${result.data.copied} entries from yesterday`, "success");
        } else if (result.success) {
          showToast("Nothing to copy from yesterday", "info");
        } else {
          showToast(result.error, "error");
        }
      } catch { showToast("Failed to copy yesterday's meals", "error"); }
    });
  }

  function handleBarcodeFoodSelect(food: FoodSearchResult) {
    setBarcodePrefill(food);
    setAddMealType(getMealTypeForTime());
    setShowBarcode(false);
    setShowAddForm(true);
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
      <div role="tablist" className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1 w-fit">
        <button
          type="button"
          role="tab"
          aria-selected={view === "today"}
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
          role="tab"
          aria-selected={view === "history"}
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
        <div
          className="flex flex-col gap-5"
          onTouchStart={(e) => {
            dateSwipeStartX.current = e.touches[0].clientX;
            dateSwipeStartY.current = e.touches[0].clientY;
          }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - dateSwipeStartX.current;
            const dy = e.changedTouches[0].clientY - dateSwipeStartY.current;
            // Only trigger horizontal swipe if mostly horizontal (>50px) and not vertical scrolling
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
              if (dx > 0) {
                // Swipe right = previous day
                changeDate(format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd"));
              } else if (!isToday) {
                // Swipe left = next day (only if not already today)
                changeDate(format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd"));
              }
            }
          }}
        >
          {/* Date navigator */}
          <div className="flex items-center gap-2 animate-fade-up">
            <button
              type="button"
              onClick={() => changeDate(format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd"))}
              disabled={isDateLoading}
              className="rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              aria-label="Previous day"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-sm font-semibold min-w-32 text-center">
              {isToday ? "Today" : format(parseISO(selectedDate), "EEE, MMM d")}
            </span>
            <button
              type="button"
              onClick={() => changeDate(format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd"))}
              disabled={isDateLoading || isToday}
              className="rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              aria-label="Next day"
            >
              <ChevronRight className="size-5" />
            </button>
            {!isToday && (
              <button
                type="button"
                onClick={() => changeDate(today)}
                className="ml-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Today
              </button>
            )}
            {entries.length === 0 && (
              <button
                type="button"
                onClick={handleCopyYesterday}
                disabled={isCopying}
                className="ml-auto flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <Copy className="size-3" />
                {isCopying ? "Copying…" : "Copy from yesterday"}
              </button>
            )}
          </div>

          {/* Today's macros summary bar — sticky */}
          {targets && entries.length > 0 && (
            <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-4 flex items-center gap-4 border-b border-border bg-background/95 px-4 py-2 text-xs backdrop-blur shadow-sm animate-fade-up">
              {([
                { label: "P", value: totals.protein, target: targets.protein, color: MACRO_COLORS.protein.text },
                { label: "C", value: totals.carbs,   target: targets.carbs,   color: MACRO_COLORS.carbs.text },
                { label: "F", value: totals.fat,     target: targets.fat,     color: MACRO_COLORS.fat.text },
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

          {/* Desktop two-column layout */}
          <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-8">
          {/* Left column — sticky on desktop */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-20 lg:self-start">

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
              { name: "Protein", value: proteinKcal, color: MACRO_COLORS.protein.hex },
              { name: "Carbs",   value: carbsKcal,   color: MACRO_COLORS.carbs.hex },
              { name: "Fat",     value: fatKcal,      color: MACRO_COLORS.fat.hex },
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
                    type="text"
                    inputMode="decimal"
                    value={weightInput}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setWeightInput(e.target.value)}
                    onBlur={(e) => {
                      const v = parseFloat(e.target.value);
                      if (isNaN(v) || v <= 0) setWeightInput(String(Math.round(bodyWeightKg)));
                    }}
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
                {(() => {
                  const pct = targets.calories > 0 ? totals.calories / targets.calories : 0;
                  const barColor = pct > 1 ? "bg-rose-500" : pct > 0.9 ? "bg-amber-500" : pct > 0.7 ? "bg-emerald-500" : "bg-indigo-500";
                  return (
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor} ${pct > 1 ? "animate-pulse" : ""}`}
                      style={{ width: `${Math.min(100, pct * 100)}%` }}
                    />
                  );
                })()}
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

          {/* Quick Add — recent foods */}
          {recentFoods.length > 0 && (
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
                        startQuickAddTransition(async () => {
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
                              if (refreshed.success) setEntries(refreshed.data);
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
          )}

          </div>{/* End left column */}

          {/* Right column */}
          <div className="flex flex-col gap-5">

          {/* Scan + Templates buttons — hidden while inline form is open */}
          {!showAddForm && !editingEntry && <div id="add-food-section" className="flex flex-wrap items-center gap-2 animate-fade-up" style={{ animationDelay: "100ms" }}>
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
          </div>}

          {/* Inline barcode scanner shortcut */}
          {showBarcode && (
            <div className="animate-fade-up">
              <BarcodeScanner onSelect={handleBarcodeFoodSelect} defaultOpen />
            </div>
          )}

          {/* Templates bottom sheet */}
          <BottomSheet open={showTemplates} onClose={() => setShowTemplates(false)} title="Meal Templates">
            <div className="flex flex-col gap-5">
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
          </BottomSheet>

          {/* Add / Edit form — bottom sheet on mobile, modal on desktop */}
          <BottomSheet open={showAddForm || !!editingEntry} onClose={() => handleAddClose()}>
            <AddFoodForm
              date={selectedDate}
              defaultMealType={addMealType}
              editingEntry={editingEntry}
              prefillFood={barcodePrefill}
              onClose={handleAddClose}
            />
          </BottomSheet>

          {/* Empty state */}
          {entries.length === 0 && !isDateLoading && !showAddForm && !editingEntry && (
            <div className="flex flex-col items-center gap-4 py-8 animate-fade-up">
              <Utensils className="size-10 text-muted-foreground/40" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">No meals logged</p>
                <p className="mt-1 text-xs text-muted-foreground">Tap + to add your first meal</p>
              </div>
              <Button onClick={() => openAddForm(getMealTypeForTime())} className="w-full max-w-xs" size="lg">
                Add Meal
              </Button>
              {!isToday && (
                <Button variant="outline" onClick={handleCopyYesterday} disabled={isCopying} className="gap-1.5">
                  <Copy className="size-3.5" />
                  {isCopying ? "Copying…" : "Copy from yesterday"}
                </Button>
              )}
            </div>
          )}

          {/* Meal groups */}
          {isDateLoading ? (
            <div className="flex flex-col gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                    <div className="h-4 w-20 rounded bg-muted" />
                    <div className="h-4 w-10 rounded bg-muted" />
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="flex flex-col gap-4">
            {MEAL_TYPES.map((mealType, i) => {
              const mealEntries = entries.filter((e) => e.mealType === mealType);
              const mealKcal = mealEntries.reduce((s, e) => s + e.calories, 0);
              const { label, Icon } = mealConfig[mealType];

              return (
                <div
                  key={mealType}
                  className={`rounded-xl border border-border border-l-[3px] ${MEAL_TYPE_STYLES[mealType].borderLeft} bg-card overflow-hidden animate-fade-up`}
                  style={{ animationDelay: `${(i + 2) * 60}ms` }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-2">
                      <Icon className={`size-4 ${MEAL_TYPE_STYLES[mealType].icon}`} />
                      <span className={`text-sm font-semibold ${MEAL_TYPE_STYLES[mealType].header}`}>{label}</span>
                      {mealEntries.length > 0 && (
                        <span className="flex items-center justify-center size-5 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">{mealEntries.length}</span>
                      )}
                      {mealKcal > 0 && (
                        <span className="text-xs text-muted-foreground">{Math.round(mealKcal)} kcal</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => openAddForm(mealType)}
                      className="flex items-center gap-1 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Plus className="size-3" />
                      Add
                    </button>
                  </div>

                  {mealEntries.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => openAddForm(mealType)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg mx-3 my-3 border border-dashed border-border/60 py-3 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground hover:border-border"
                      style={{ width: "calc(100% - 1.5rem)" }}
                    >
                      <Plus className="size-3.5" />
                      Add {label.toLowerCase()}
                    </button>
                  ) : (
                    <div className="divide-y divide-border">
                      {mealEntries.map((entry) => (
                        <div key={entry.id} className="relative overflow-hidden">
                          {/* Swipe-reveal delete background */}
                          <div className="absolute inset-y-0 right-0 flex items-center">
                            <button
                              type="button"
                              onClick={() => { setSwipedEntryId(null); handleDeleteEntry(entry.id); }}
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
                              if (delta > 0) return; // only swipe left
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
                                setSwipedEntryId(entry.id);
                              } else {
                                el.style.transform = "";
                                setSwipedEntryId(null);
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}

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

          </div>{/* End right column */}
          </div>{/* End two-column grid */}

          {/* Floating action button — always visible for quick meal add */}
          {!showAddForm && !editingEntry && (
            <button
              type="button"
              onClick={() => openAddForm(getMealTypeForTime())}
              className="fixed bottom-24 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95 sm:bottom-8 sm:right-8"
              aria-label="Add food"
            >
              <Plus className="size-6" />
            </button>
          )}
        </div>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: "80ms" }}>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground mb-1">Avg Daily Kcal</p>
                      <p className={`text-xl font-bold tabular-nums ${MACRO_COLORS.calories.text}`}>
                        {annualAvgKcal > 0 ? annualAvgKcal.toLocaleString() : "—"}
                      </p>
                      {targets && annualAvgKcal > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">target {targets.calories.toLocaleString()}</p>
                      )}
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground mb-1">Avg Protein</p>
                      <p className={`text-xl font-bold tabular-nums ${MACRO_COLORS.protein.text}`}>
                        {annualAvgProtein > 0 ? `${annualAvgProtein}g` : "—"}
                      </p>
                      {targets && annualAvgProtein > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">target {targets.protein}g</p>
                      )}
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground mb-1">On Target</p>
                      <p className={`text-xl font-bold tabular-nums ${MACRO_COLORS.carbs.text}`}>
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

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: "80ms" }}>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground mb-1">Avg Daily Kcal</p>
                  <p className={`text-xl font-bold tabular-nums ${MACRO_COLORS.calories.text}`}>
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
                  <p className={`text-xl font-bold tabular-nums ${MACRO_COLORS.protein.text}`}>
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
                  <p className={`text-xl font-bold tabular-nums ${MACRO_COLORS.carbs.text}`}>
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
