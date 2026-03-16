"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, Trophy, ChevronDown } from "lucide-react";
import { createGoal, cancelGoal, deleteGoal } from "@/actions/goal-actions";
import type { Goal, GoalAlert, GoalType } from "@/types";

interface Props {
  initialGoals: Goal[];
  alerts: GoalAlert[];
}

const GOAL_TYPES: { id: GoalType; label: string; defaultUnit: string; placeholder: string }[] = [
  { id: "workout_count", label: "Total Workouts", defaultUnit: "sessions", placeholder: "e.g. 100" },
  { id: "cardio_distance", label: "Total Cardio Distance", defaultUnit: "km", placeholder: "e.g. 500" },
  { id: "body_weight", label: "Target Body Weight", defaultUnit: "lb", placeholder: "e.g. 180" },
  { id: "exercise_1rm", label: "Exercise 1RM", defaultUnit: "lb", placeholder: "e.g. 315" },
];

function ProgressBar({ pct, achieved }: { pct: number; achieved: boolean }) {
  const display = Math.min(100, Math.round(pct * 100));
  return (
    <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${achieved ? "bg-emerald-500" : "bg-primary"}`}
        style={{ width: `${display}%` }}
      />
    </div>
  );
}

export function GoalsView({ initialGoals, alerts }: Props) {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [showAchieved, setShowAchieved] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [type, setType] = useState<GoalType>("workout_count");
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("sessions");
  const [exerciseName, setExerciseName] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const activeGoals = goals.filter((g) => g.status === "active");
  const achievedGoals = goals.filter((g) => g.status === "achieved");
  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.goalId));

  function handleTypeChange(t: GoalType) {
    setType(t);
    const cfg = GOAL_TYPES.find((x) => x.id === t)!;
    setUnit(cfg.defaultUnit);
    setTitle(cfg.label);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(targetValue);
    if (!title.trim() || !v) return;
    startTransition(async () => {
      await createGoal({ type, title: title.trim(), targetValue: v, unit, exerciseName: exerciseName.trim() || undefined, targetDate: targetDate || undefined });
      router.refresh();
      // Re-fetch after creation
      const { getGoals } = await import("@/actions/goal-actions");
      const result = await getGoals();
      if (result.success) setGoals(result.data);
      setShowForm(false);
      setTitle("");
      setTargetValue("");
      setExerciseName("");
      setTargetDate("");
    });
  }

  function handleCancel(id: string) {
    startTransition(async () => {
      await cancelGoal(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    });
  }

  function progressPct(goal: Goal) {
    if (!goal.currentValue || !goal.targetValue) return 0;
    if (goal.type === "body_weight") return Math.min(1, goal.currentValue / goal.targetValue);
    return Math.min(1, goal.currentValue / goal.targetValue);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Alerts */}
      {visibleAlerts.map((alert) => (
        <div
          key={alert.goalId}
          className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 ${
            alert.type === "achieved"
              ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
              : "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
          }`}
        >
          <div className="flex items-center gap-2">
            <Trophy className={`size-4 shrink-0 ${alert.type === "achieved" ? "text-emerald-600" : "text-amber-600"}`} />
            <p className="text-sm font-medium">
              {alert.type === "achieved"
                ? `Goal achieved: ${alert.title} 🎉`
                : `${Math.round(alert.progressPct * 100)}% to goal: ${alert.title}`}
            </p>
          </div>
          <button type="button" onClick={() => setDismissedAlerts((s) => new Set(s).add(alert.goalId))} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="size-4" />
          </button>
        </div>
      ))}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{activeGoals.length} active goal{activeGoals.length !== 1 ? "s" : ""}</p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:brightness-110 transition-all"
        >
          <Plus className="size-3.5" />
          New Goal
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-sm font-semibold">Create Goal</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Type</label>
                <select
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value as GoalType)}
                  className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                >
                  {GOAL_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Goal name"
                  className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Target value</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={GOAL_TYPES.find((t) => t.id === type)?.placeholder}
                  className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>
              {type === "exercise_1rm" && (
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Exercise name</label>
                  <input
                    type="text"
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                    placeholder="e.g. Bench Press"
                    className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Target date (optional)</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-50">
                {isPending ? "Saving…" : "Create"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active goals */}
      {activeGoals.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">No active goals. Create one to track your progress.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activeGoals.map((goal) => {
            const pct = progressPct(goal);
            const displayPct = Math.round(pct * 100);
            return (
              <div key={goal.id} className="rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{goal.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {goal.currentValue !== undefined ? `${goal.currentValue} / ${goal.targetValue} ${goal.unit}` : `Target: ${goal.targetValue} ${goal.unit}`}
                      {goal.targetDate && ` · by ${goal.targetDate}`}
                    </p>
                    <ProgressBar pct={pct} achieved={false} />
                    <p className="mt-1 text-xs text-muted-foreground">{displayPct}% complete</p>
                  </div>
                  <button type="button" onClick={() => handleCancel(goal.id)} disabled={isPending} className="shrink-0 rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50">
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Achieved goals */}
      {achievedGoals.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowAchieved((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <Trophy className="size-3.5 text-emerald-500" />
            {achievedGoals.length} achieved goal{achievedGoals.length !== 1 ? "s" : ""}
            <ChevronDown className={`size-3.5 transition-transform ${showAchieved ? "rotate-180" : ""}`} />
          </button>
          {showAchieved && (
            <div className="flex flex-col gap-2">
              {achievedGoals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Trophy className="size-3.5 text-emerald-500" />
                      {goal.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {goal.targetValue} {goal.unit}
                      {goal.achievedAt && ` · achieved ${new Date(goal.achievedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button type="button" onClick={() => handleDelete(goal.id)} disabled={isPending} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
