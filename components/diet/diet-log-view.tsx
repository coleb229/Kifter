"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, addDays, subDays } from "date-fns";
import {
  Plus,
  LayoutList,
  BarChart2,
  Target,
  BookTemplate,
  X,
  Save,
  Camera,
  AlertTriangle,
  Utensils,
  Copy,
  Trash2,
} from "lucide-react";
import { deleteDietEntry, getDietEntries, getDietHistory, getDietDataYears, copyDietDay, getRecentFoods } from "@/actions/diet-actions";
import { getMealTemplates, createMealTemplate, deleteMealTemplate, applyMealTemplate } from "@/actions/meal-template-actions";
import { MacroRings } from "@/components/diet/macro-rings";
import { AddFoodForm } from "@/components/diet/add-food-form";
import { BarcodeScanner } from "@/components/diet/barcode-scanner";
import { MacroTargetForm } from "@/components/diet/macro-target-form";
import { DateNavigator } from "@/components/diet/date-navigator";
import { MacroSummaryBar } from "@/components/diet/macro-summary-bar";
import { CalorieBudgetBar } from "@/components/diet/calorie-budget-bar";
import { TDEECard } from "@/components/diet/tdee-card";
import { QuickAddSection } from "@/components/diet/quick-add-section";
import { MealGroup } from "@/components/diet/meal-group";
import { MacroPieChart } from "@/components/diet/macro-pie-chart";
import { DietHistoryView } from "@/components/diet/diet-history-view";
import { Button } from "@/components/ui/button";
import { MEAL_TYPES } from "@/types";
import { useToast } from "@/components/ui/toast";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import type { BodyTarget, DietDaySummary, DietEntry, MacroTarget, MealTemplate, MealType, RecentFood } from "@/types";
import { submitCommunityFood } from "@/actions/food-actions";
import type { FoodSearchResult } from "@/actions/food-actions";

interface Props {
  initialEntries: DietEntry[];
  initialTargets: MacroTarget | null;
  initialHistory: DietDaySummary[];
  initialDate: string;
  initialTodaySessions?: { bodyTarget: BodyTarget; durationMinutes?: number }[];
  initialBodyWeightKg?: number;
}

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
  const [isCopying, startCopyTransition] = useTransition();
  const pendingDeleteRef = useRef<{ id: string; entry: DietEntry; timeout: ReturnType<typeof setTimeout> } | null>(null);
  const [swipedEntryId, setSwipedEntryId] = useState<string | null>(null);
  const dateSwipeStartX = useRef(0);
  const dateSwipeStartY = useRef(0);
  const [bodyWeightKg, setBodyWeightKg] = useState(initialBodyWeightKg);
  const [dietYears, setDietYears] = useState<number[]>([]);

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

  // Correct for server-UTC date mismatch
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

  // End-of-day nudge check
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
      if (yearsResult.success) setDietYears(yearsResult.data);
    }
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

      {/* View content with transition */}
      <div key={view} className="animate-fade-up" style={{ animationDuration: "200ms" }}>
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
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                if (dx > 0) {
                  changeDate(format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd"));
                } else if (!isToday) {
                  changeDate(format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd"));
                }
              }
            }}
          >
            {/* Date navigator */}
            <DateNavigator
              selectedDate={selectedDate}
              isToday={isToday}
              isDateLoading={isDateLoading}
              isCopying={isCopying}
              hasEntries={entries.length > 0}
              onChangeDate={changeDate}
              onCopyYesterday={handleCopyYesterday}
            />

            {/* Sticky macro summary bar */}
            {targets && entries.length > 0 && (
              <MacroSummaryBar totals={totals} targets={targets} />
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
                {entries.length > 0 && (
                  <MacroPieChart totals={totals} />
                )}

                {/* TDEE estimate card */}
                {isToday && (
                  <TDEECard
                    todaySessions={initialTodaySessions}
                    bodyWeightKg={bodyWeightKg}
                    onWeightChange={setBodyWeightKg}
                  />
                )}

                {/* Calorie budget meter */}
                {targets && (
                  <CalorieBudgetBar consumed={totals.calories} target={targets.calories} />
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
                <QuickAddSection
                  initialRecentFoods={recentFoods}
                  selectedDate={selectedDate}
                  getMealTypeForTime={getMealTypeForTime}
                  onEntriesUpdate={setEntries}
                />
              </div>{/* End left column */}

              {/* Right column */}
              <div className="flex flex-col gap-5">
                {/* Scan + Templates buttons — sticky on mobile so they float over meal groups */}
                {!showAddForm && !editingEntry && (
                  <div id="add-food-section" className="sticky top-14 z-10 -mx-4 px-4 py-2 bg-background/90 backdrop-blur-sm sm:static sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent sm:backdrop-blur-none lg:static lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none animate-fade-up" style={{ animationDelay: "100ms" }}>
                    <div className="flex flex-wrap items-center gap-2">
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
                  </div>
                )}

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

                {/* Add / Edit form — bottom sheet on mobile */}
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
                    {MEAL_TYPES.map((mealType, i) => (
                      <MealGroup
                        key={mealType}
                        mealType={mealType}
                        entries={entries.filter((e) => e.mealType === mealType)}
                        swipedEntryId={swipedEntryId}
                        animationIndex={i}
                        onAdd={openAddForm}
                        onEdit={openEditForm}
                        onDelete={handleDeleteEntry}
                        onSwipeChange={setSwipedEntryId}
                      />
                    ))}
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

          </div>
        ) : (
          <DietHistoryView
            history={history}
            targets={targets}
            dietYears={dietYears}
          />
        )}
      </div>

      {/* Floating action button — always visible, bottom-right on mobile */}
      {!showAddForm && !editingEntry && (
        <button
          type="button"
          onClick={() => openAddForm(getMealTypeForTime())}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-30 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95 sm:bottom-8 sm:right-8 sm:size-14"
          aria-label="Add food"
        >
          <Plus className="size-5 sm:size-6" />
        </button>
      )}
    </div>
  );
}
