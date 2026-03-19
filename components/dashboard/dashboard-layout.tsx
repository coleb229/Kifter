"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, parseISO } from "date-fns";
import { Dumbbell, Flame, TrendingUp, Calendar, Plus, Utensils, Activity, GripVertical, Pencil, Check, X } from "lucide-react";
import { TrainingWeekChart } from "@/components/dashboard/training-week-chart";
import { MacroWeekChart } from "@/components/dashboard/macro-week-chart";
import { CardioWeekChart } from "@/components/dashboard/cardio-week-chart";
import { TrainingVolumeChart } from "@/components/dashboard/training-volume-chart";
import { CardioHrChart } from "@/components/dashboard/cardio-hr-chart";
import { StreakBadges } from "@/components/dashboard/streak-badges";
import { MacroAdherenceWidget } from "@/components/dashboard/macro-adherence-widget";
import { MuscleHeatmap } from "@/components/training/muscle-heatmap";
import type { MacroAdherenceData } from "@/actions/diet-actions";
import type { MuscleVolumeData } from "@/actions/analytics-actions";
import { BODY_TARGET_STYLES } from "@/lib/label-colors";
import { Button } from "@/components/ui/button";
import { updatePreferences } from "@/actions/user-actions";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DashboardData {
  trainingChartData: { day: string; sessions: number; exercises: number }[];
  macroChartData: { day: string; protein: number; carbs: number; fat: number; calories: number; target: number }[];
  cardioChartData: { day: string; minutes: number }[];
  volumeChartData: { day: string; volume: number }[];
  cardioHrData: { date: string; avgHr: number; activity: string }[];
  workoutsThisWeek: number;
  todayKcal: number;
  todayProtein: number;
  cardioThisWeek: number;
  streak: number;
  calorieTarget: number;
  proteinTarget: number;
  recentSessions: { id: string; date: string; name?: string; bodyTarget: string; exerciseNames?: string[] }[];
  weekStart: string;
  weekEnd: string;
  adherenceData: MacroAdherenceData | null;
  muscleVolumeData: MuscleVolumeData[];
}

interface Props {
  data: DashboardData;
  initialWidgets?: string[];
}

// ── Widget IDs & default order ─────────────────────────────────────────────────

const DEFAULT_WIDGETS = ["stats", "nutrition", "training_cardio", "training_volume", "recent_workouts", "quick_actions"];

const WIDGET_LABELS: Record<string, string> = {
  stats: "Stats Overview",
  nutrition: "Nutrition Chart",
  macro_adherence: "Macro Adherence Score",
  training_cardio: "Training & Cardio Charts",
  training_volume: "Training Load Volume",
  cardio_hr: "Cardio Heart Rate Trend",
  muscle_heatmap: "Muscle Group Volume",
  recent_workouts: "Recent Workouts",
  quick_actions: "Quick Actions",
};

// ── Lazy chart renderer — defers heavy Recharts renders until in viewport ──────

function LazyChartWidget({ children, minHeight = 220 }: { children: React.ReactNode; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { rootMargin: "100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {isVisible ? children : (
        <div className="animate-pulse rounded-xl border border-border bg-card p-5">
          <div className="mb-4 h-4 w-1/3 rounded bg-muted" />
          <div style={{ height: minHeight }} className="rounded-lg bg-muted" />
        </div>
      )}
    </div>
  );
}

// ── Sortable wrapper ───────────────────────────────────────────────────────────

function SortableWidget({ id, editMode, onRemove, children }: { id: string; editMode: boolean; onRemove: () => void; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {editMode && (
        <>
          <div
            {...attributes}
            {...listeners}
            className="absolute -left-6 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground"
          >
            <GripVertical className="size-4" />
          </div>
          <button
            type="button"
            onClick={onRemove}
            title="Hide widget"
            className="absolute -right-2 -top-2 z-10 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:brightness-110 transition-all"
          >
            <X className="size-3" />
          </button>
        </>
      )}
      {children}
    </div>
  );
}

// ── DashboardLayout ────────────────────────────────────────────────────────────

export function DashboardLayout({ data, initialWidgets }: Props) {
  const [widgets, setWidgets] = useState<string[]>(initialWidgets ?? DEFAULT_WIDGETS);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, startSave] = useTransition();

  const ALL_WIDGET_IDS = Object.keys(WIDGET_LABELS);
  const hiddenWidgets = ALL_WIDGET_IDS.filter((id) => !widgets.includes(id));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgets((prev) => {
        const oldIdx = prev.indexOf(active.id as string);
        const newIdx = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  }

  function saveLayout(newWidgets: string[]) {
    startSave(async () => {
      await updatePreferences({ dashboardWidgets: newWidgets });
    });
  }

  function exitEditMode() {
    setEditMode(false);
    saveLayout(widgets);
  }

  const { trainingChartData, macroChartData, cardioChartData, volumeChartData, cardioHrData, workoutsThisWeek, todayKcal, todayProtein, cardioThisWeek, streak, calorieTarget, proteinTarget, recentSessions, weekStart, weekEnd, adherenceData, muscleVolumeData } = data;

  function renderWidget(id: string) {
    switch (id) {
      case "stats":
        return (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "Workouts", value: workoutsThisWeek, suffix: "this week", icon: Dumbbell, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-950/40" },
              { label: "Cardio", value: cardioThisWeek, suffix: "this week", icon: Activity, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-950/40" },
              { label: "Kcal Today", value: todayKcal > 0 ? todayKcal.toLocaleString() : "—", suffix: calorieTarget ? `/ ${calorieTarget.toLocaleString()}` : "", icon: Flame, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950/40" },
              { label: "Protein Today", value: todayProtein > 0 ? `${Math.round(todayProtein)}g` : "—", suffix: proteinTarget ? `/ ${proteinTarget}g` : "", icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950/40" },
              { label: "Streak", value: streak, suffix: streak === 1 ? "day" : "days", icon: Calendar, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-950/40" },
            ].map(({ label, value, suffix, icon: Icon, color, bg }) => (
              <div key={label} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                  <Icon className={`size-4 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-bold leading-tight">{value}</p>
                  {suffix && <p className="text-xs text-muted-foreground">{suffix}</p>}
                  {label === "Streak" && <StreakBadges streak={streak} />}
                </div>
              </div>
            ))}
          </div>
        );

      case "nutrition":
        return (
          <LazyChartWidget minHeight={220}>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="size-4 text-amber-500" />
                  <h3 className="text-sm font-semibold">Nutrition</h3>
                </div>
                <Link href="/diet" className="text-xs text-muted-foreground transition-colors hover:text-foreground">View log</Link>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">Daily macros — last 7 days</p>
              <MacroWeekChart data={macroChartData} height={220} />
            </div>
          </LazyChartWidget>
        );

      case "macro_adherence":
        return adherenceData ? (
          <LazyChartWidget minHeight={180}>
            <MacroAdherenceWidget data={adherenceData} />
          </LazyChartWidget>
        ) : null;

      case "training_cardio":
        return (
          <LazyChartWidget minHeight={180}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-1 flex items-center gap-2">
                  <Dumbbell className="size-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold">Training</h3>
                </div>
                <p className="mb-4 text-xs text-muted-foreground">Workouts per day</p>
                <TrainingWeekChart data={trainingChartData} />
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-1 flex items-center gap-2">
                  <Activity className="size-4 text-sky-500" />
                  <h3 className="text-sm font-semibold">Cardio</h3>
                </div>
                <p className="mb-4 text-xs text-muted-foreground">Active minutes per day</p>
                <CardioWeekChart data={cardioChartData} />
              </div>
            </div>
          </LazyChartWidget>
        );

      case "recent_workouts":
        return (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Recent Workouts</h3>
              <Link href="/training" className="text-xs text-muted-foreground transition-colors hover:text-foreground">View all</Link>
            </div>
            {recentSessions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No workouts logged yet</p>
            ) : (
              <div className="flex flex-col gap-2">
                {recentSessions.map((s) => (
                  <Link key={s.id} href={`/training/${s.id}`} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:bg-muted/40">
                    <div className="flex items-center gap-2.5">
                      <Dumbbell className="size-3.5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium">{s.name ?? format(parseISO(s.date), "EEE, MMM d")}</p>
                        {s.exerciseNames && s.exerciseNames.length > 0 && (
                          <p className="text-[10px] text-muted-foreground truncate max-w-40">{s.exerciseNames.join(" · ")}</p>
                        )}
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${BODY_TARGET_STYLES[s.bodyTarget as keyof typeof BODY_TARGET_STYLES]?.badge ?? ""}`}>
                      {s.bodyTarget}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );

      case "training_volume":
        return (
          <LazyChartWidget minHeight={180}>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-1 flex items-center gap-2">
                <Dumbbell className="size-4 text-indigo-500" />
                <h3 className="text-sm font-semibold">Training Load Volume</h3>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">Total weight × reps per day (last 7 days)</p>
              <TrainingVolumeChart data={volumeChartData} />
            </div>
          </LazyChartWidget>
        );

      case "cardio_hr":
        return (
          <LazyChartWidget minHeight={180}>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-1 flex items-center gap-2">
                <Activity className="size-4 text-rose-500" />
                <h3 className="text-sm font-semibold">Cardio Heart Rate</h3>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">Avg heart rate per session (last 30 days)</p>
              <CardioHrChart data={cardioHrData} />
            </div>
          </LazyChartWidget>
        );

      case "muscle_heatmap":
        return (
          <LazyChartWidget minHeight={220}>
            <MuscleHeatmap data={muscleVolumeData} />
          </LazyChartWidget>
        );

      case "quick_actions":
        return (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="justify-start gap-2" render={<Link href="/training/new" />}><Plus className="size-4 text-indigo-500" />Log Workout</Button>
              <Button variant="outline" size="sm" className="justify-start gap-2" render={<Link href="/cardio/new" />}><Activity className="size-4 text-sky-500" />Log Cardio</Button>
              <Button variant="outline" size="sm" className="justify-start gap-2" render={<Link href="/diet" />}><Utensils className="size-4 text-amber-500" />Log Food</Button>
              <Button variant="outline" size="sm" className="justify-start gap-2" render={<Link href="/training/analytics" />}><TrendingUp className="size-4 text-emerald-500" />View Analytics</Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <section id="dashboard" className="mx-auto max-w-6xl px-4 py-12 pb-40 sm:px-6 sm:pb-12 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between animate-fade-up">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your Week</h2>
          <p className="mt-1 text-sm text-muted-foreground">{weekStart} – {weekEnd}</p>
        </div>
        <button
          type="button"
          onClick={() => editMode ? exitEditMode() : setEditMode(true)}
          disabled={isSaving}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            editMode
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          {editMode ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
          {editMode ? (isSaving ? "Saving…" : "Done") : "Customize"}
        </button>
      </div>

      {/* Sortable widgets */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets} strategy={verticalListSortingStrategy}>
          <div className={`flex flex-col gap-4 ${editMode ? "pl-8 pr-2" : ""}`}>
            {widgets.map((id) => (
              <SortableWidget
                key={id}
                id={id}
                editMode={editMode}
                onRemove={() => setWidgets((prev) => prev.filter((w) => w !== id))}
              >
                {renderWidget(id)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Hidden widgets — shown in edit mode */}
      {editMode && hiddenWidgets.length > 0 && (
        <div className="mt-4 pl-8 pr-2">
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Hidden widgets</p>
          <div className="flex flex-col gap-2">
            {hiddenWidgets.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setWidgets((prev) => [...prev, id])}
                className="flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="size-4" />
                {WIDGET_LABELS[id] ?? id}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
