"use client";

import { useState, useTransition, useOptimistic, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X, Plus, PlayCircle, Link2, Share2, Wand2, Loader2 } from "lucide-react";
import {
  updateSet,
  deleteSet,
  toggleSetCompleted,
  renameExercise,
  deleteExerciseFromSession,
  addExerciseToSession,
  setExerciseVideoUrl,
} from "@/actions/workout-actions";
import { shareWorkoutSession } from "@/actions/post-actions";
import { getExerciseSubstitutions } from "@/actions/ai-actions";
import type { ExerciseSubstitute } from "@/actions/ai-actions";
import type { WorkoutSet } from "@/types";
import type { WeightUnit } from "@/lib/weight";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExerciseGroup {
  name: string;
  sets: WorkoutSet[];
}

function groupByExercise(sets: WorkoutSet[]): ExerciseGroup[] {
  const map = new Map<string, WorkoutSet[]>();
  for (const set of sets) {
    if (!map.has(set.exercise)) map.set(set.exercise, []);
    map.get(set.exercise)!.push(set);
  }
  return Array.from(map.entries()).map(([name, sets]) => ({ name, sets }));
}

type SetEditState =
  | { type: "none" }
  | { type: "editing"; weight: number; weightUnit: WeightUnit; reps: number }
  | { type: "confirm-delete" };

type ExerciseEditState =
  | { type: "none" }
  | { type: "renaming"; value: string }
  | { type: "confirm-delete" };

// ── Input class ───────────────────────────────────────────────────────────────

const inputClass =
  "h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50";

// ── ExerciseGroupCard ─────────────────────────────────────────────────────────

function ExerciseGroupCard({
  sessionId,
  group,
  videoUrl,
}: {
  sessionId: string;
  group: ExerciseGroup;
  videoUrl?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [exerciseState, setExerciseState] = useState<ExerciseEditState>({ type: "none" });
  const [setStates, setSetStates] = useState<Record<string, SetEditState>>({});
  const [addingSet, setAddingSet] = useState<{ weight: number; weightUnit: WeightUnit; reps: number } | null>(null);

  type OptimisticAction =
    | { type: "update"; id: string; weight: number; weightUnit: WeightUnit; reps: number }
    | { type: "delete"; id: string }
    | { type: "add"; set: WorkoutSet }
    | { type: "toggle-complete"; id: string };

  const [optimisticSets, dispatchOptimistic] = useOptimistic(
    group.sets,
    (state: WorkoutSet[], action: OptimisticAction) => {
      if (action.type === "update")
        return state.map((s) => s.id === action.id ? { ...s, weight: action.weight, weightUnit: action.weightUnit, reps: action.reps } : s);
      if (action.type === "delete")
        return state.filter((s) => s.id !== action.id);
      if (action.type === "add")
        return [...state, action.set];
      if (action.type === "toggle-complete")
        return state.map((s) => s.id === action.id ? { ...s, completed: !s.completed } : s);
      return state;
    }
  );

  const lastSet = optimisticSets[optimisticSets.length - 1];
  const touchStartX = useRef<number>(0);
  const touchActiveId = useRef<string>("");
  const [editingVideo, setEditingVideo] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState(videoUrl ?? "");
  const [showSubs, setShowSubs] = useState(false);
  const [substitutes, setSubstitutes] = useState<ExerciseSubstitute[] | null>(null);
  const [subsError, setSubsError] = useState<string | null>(null);
  const [isLoadingSubs, startSubsTransition] = useTransition();

  function handleVideoSave() {
    startTransition(async () => {
      await setExerciseVideoUrl(group.name, videoUrlInput.trim());
      setEditingVideo(false);
      router.refresh();
    });
  }

  function handleGetSubstitutes() {
    if (showSubs && substitutes) { setShowSubs(false); return; }
    setShowSubs(true);
    setSubsError(null);
    if (!substitutes) {
      startSubsTransition(async () => {
        const result = await getExerciseSubstitutions(group.name);
        if (result.success) setSubstitutes(result.data);
        else setSubsError(result.error);
      });
    }
  }

  function getSetState(id: string): SetEditState {
    return setStates[id] ?? { type: "none" };
  }

  function setSetState(id: string, state: SetEditState) {
    setSetStates((prev) => ({ ...prev, [id]: state }));
  }

  // ── Exercise actions ─────────────────────────────────────────────────────

  function handleRenameSubmit() {
    if (exerciseState.type !== "renaming") return;
    const newName = exerciseState.value.trim();
    if (!newName || newName === group.name) {
      setExerciseState({ type: "none" });
      return;
    }
    startTransition(async () => {
      await renameExercise(sessionId, group.name, newName);
      setExerciseState({ type: "none" });
      router.refresh();
    });
  }

  function handleDeleteExercise() {
    startTransition(async () => {
      await deleteExerciseFromSession(sessionId, group.name);
      router.refresh();
    });
  }

  // ── Set actions ──────────────────────────────────────────────────────────

  function handleSetSave(set: WorkoutSet) {
    const state = getSetState(set.id);
    if (state.type !== "editing") return;
    setSetState(set.id, { type: "none" });
    startTransition(async () => {
      dispatchOptimistic({ type: "update", id: set.id, weight: state.weight, weightUnit: state.weightUnit, reps: state.reps });
      await updateSet(set.id, {
        weight: state.weight,
        weightUnit: state.weightUnit,
        reps: state.reps,
      });
      router.refresh();
    });
  }

  function handleToggleComplete(set: WorkoutSet) {
    startTransition(async () => {
      dispatchOptimistic({ type: "toggle-complete", id: set.id });
      await toggleSetCompleted(set.id);
      router.refresh();
    });
  }

  function handleSetDelete(setId: string) {
    setSetState(setId, { type: "none" });
    startTransition(async () => {
      dispatchOptimistic({ type: "delete", id: setId });
      await deleteSet(setId);
      router.refresh();
    });
  }

  function handleAddSetOpen() {
    setAddingSet({
      weight: lastSet?.weight ?? 0,
      weightUnit: lastSet?.weightUnit ?? "lb",
      reps: lastSet?.reps ?? 0,
    });
  }

  function handleAddSetSave() {
    if (!addingSet) return;
    const tempSet: WorkoutSet = {
      id: "optimistic-" + Date.now(),
      sessionId,
      userId: "",
      exercise: group.name,
      setNumber: optimisticSets.length + 1,
      weight: addingSet.weight,
      weightUnit: addingSet.weightUnit,
      reps: addingSet.reps,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setAddingSet(null);
    startTransition(async () => {
      dispatchOptimistic({ type: "add", set: tempSet });
      await addExerciseToSession(sessionId, {
        exercise: group.name,
        sets: [{ setNumber: tempSet.setNumber, ...addingSet }],
      });
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Exercise header */}
      <div className="mb-3 flex items-center gap-2">
        {exerciseState.type === "renaming" ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={exerciseState.value}
              onChange={(e) =>
                setExerciseState({ type: "renaming", value: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") setExerciseState({ type: "none" });
              }}
              autoFocus
              className={inputClass + " font-semibold"}
            />
            <button
              type="button"
              onClick={handleRenameSubmit}
              disabled={isPending}
              className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Save name"
            >
              <Check className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setExerciseState({ type: "none" })}
              className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Cancel rename"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : exerciseState.type === "confirm-delete" ? (
          <div className="flex flex-1 items-center gap-2 text-sm">
            <span className="font-semibold">{group.name}</span>
            <span className="text-muted-foreground">— delete all sets?</span>
            <button
              type="button"
              onClick={handleDeleteExercise}
              disabled={isPending}
              className="font-medium text-destructive transition-colors hover:underline"
            >
              {isPending ? "Deleting…" : "Yes"}
            </button>
            <button
              type="button"
              onClick={() => setExerciseState({ type: "none" })}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : editingVideo ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={videoUrlInput}
              onChange={(e) => setVideoUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleVideoSave();
                if (e.key === "Escape") setEditingVideo(false);
              }}
              placeholder="https://youtube.com/watch?v=..."
              autoFocus
              className={inputClass + " text-xs"}
            />
            <button
              type="button"
              onClick={handleVideoSave}
              disabled={isPending}
              className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Save video URL"
            >
              <Check className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setEditingVideo(false)}
              className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Cancel"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <>
            <h3 className="flex-1 font-semibold">{group.name}</h3>
            {videoUrl && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Watch ${group.name} demo`}
                className="rounded p-1 text-red-500 transition-colors hover:text-red-600"
              >
                <PlayCircle className="size-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={() => { setVideoUrlInput(videoUrl ?? ""); setEditingVideo(true); }}
              aria-label="Set video URL"
              className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Link2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleGetSubstitutes}
              aria-label="Get AI exercise substitutes"
              className="rounded p-1 text-muted-foreground transition-colors hover:text-indigo-500"
            >
              {isLoadingSubs ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
            </button>
            <button
              type="button"
              onClick={() =>
                setExerciseState({ type: "renaming", value: group.name })
              }
              aria-label="Rename exercise"
              className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setExerciseState({ type: "confirm-delete" })}
              aria-label="Delete exercise"
              className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Sets */}
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-[2rem_1fr_1fr_4rem] items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="text-center">#</span>
          <span>Weight</span>
          <span>Reps</span>
          <span />
        </div>

        {optimisticSets.map((set) => {
          const state = getSetState(set.id);

          if (state.type === "editing") {
            return (
              <div
                key={set.id}
                className="grid grid-cols-[2rem_1fr_1fr_4rem] items-center gap-2"
              >
                <span className="text-center text-sm text-muted-foreground">
                  {set.setNumber}
                </span>
                {/* Weight + unit */}
                <div className="flex gap-1">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={state.weight}
                    onChange={(e) =>
                      setSetState(set.id, {
                        ...state,
                        weight: parseFloat(e.target.value) || 0,
                      })
                    }
                    onFocus={(e) => e.target.select()}
                    className={inputClass}
                  />
                  <select
                    value={state.weightUnit}
                    onChange={(e) =>
                      setSetState(set.id, {
                        ...state,
                        weightUnit: e.target.value as WeightUnit,
                      })
                    }
                    className="h-8 rounded-md border border-input bg-background px-1 text-xs focus-visible:outline-none"
                  >
                    <option value="lb">lb</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
                <input
                  type="number"
                  min="1"
                  value={state.reps}
                  onChange={(e) =>
                    setSetState(set.id, {
                      ...state,
                      reps: parseInt(e.target.value) || 1,
                    })
                  }
                  onFocus={(e) => e.target.select()}
                  className={inputClass}
                />
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleSetSave(set)}
                    disabled={isPending}
                    aria-label="Save set"
                    className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Check className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSetState(set.id, { type: "none" })}
                    aria-label="Cancel edit"
                    className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          }

          if (state.type === "confirm-delete") {
            return (
              <div
                key={set.id}
                className="flex items-center gap-2 py-0.5 text-sm"
              >
                <span className="text-muted-foreground">
                  Set {set.setNumber} — delete?
                </span>
                <button
                  type="button"
                  onClick={() => handleSetDelete(set.id)}
                  disabled={isPending}
                  className="font-medium text-destructive transition-colors hover:underline"
                >
                  {isPending ? "Deleting…" : "Yes"}
                </button>
                <button
                  type="button"
                  onClick={() => setSetState(set.id, { type: "none" })}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            );
          }

          return (
            <div
              key={set.id}
              className="group relative grid grid-cols-[2rem_1fr_1fr_4rem] items-center gap-2 rounded-md transition-transform"
              onTouchStart={(e) => {
                touchStartX.current = e.touches[0].clientX;
                touchActiveId.current = set.id;
              }}
              onTouchMove={(e) => {
                if (touchActiveId.current !== set.id) return;
                const delta = e.touches[0].clientX - touchStartX.current;
                const clamped = Math.max(-80, Math.min(80, delta));
                (e.currentTarget as HTMLDivElement).style.transform = `translateX(${clamped}px)`;
                (e.currentTarget as HTMLDivElement).style.transition = "none";
              }}
              onTouchEnd={(e) => {
                if (touchActiveId.current !== set.id) return;
                const delta = e.changedTouches[0].clientX - touchStartX.current;
                const el = e.currentTarget as HTMLDivElement;
                el.style.transition = "transform 0.2s ease";
                el.style.transform = "";
                touchActiveId.current = "";
                if (delta > 60) {
                  handleToggleComplete(set);
                } else if (delta < -60) {
                  setSetState(set.id, { type: "confirm-delete" });
                }
              }}
            >
              <span className={`text-center text-sm ${set.completed ? "text-emerald-500" : "text-muted-foreground"}`}>
                {set.completed ? <Check className="size-3 mx-auto" /> : set.setNumber}
              </span>
              <span className={`text-sm ${set.completed ? "line-through text-muted-foreground" : ""}`}>
                {set.weight} {set.weightUnit}
              </span>
              <span className={`text-sm ${set.completed ? "line-through text-muted-foreground" : ""}`}>{set.reps}</span>
              <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() =>
                    setSetState(set.id, {
                      type: "editing",
                      weight: set.weight,
                      weightUnit: set.weightUnit,
                      reps: set.reps,
                    })
                  }
                  aria-label="Edit set"
                  className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSetState(set.id, { type: "confirm-delete" })
                  }
                  aria-label="Delete set"
                  className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add set inline row */}
        {addingSet ? (
          <div className="mt-1 grid grid-cols-[2rem_1fr_1fr_4rem] items-center gap-2">
            <span className="text-center text-sm text-muted-foreground">
              {optimisticSets.length + 1}
            </span>
            <div className="flex gap-1">
              <input
                type="number"
                min="0"
                step="0.5"
                value={addingSet.weight}
                onChange={(e) =>
                  setAddingSet({ ...addingSet, weight: parseFloat(e.target.value) || 0 })
                }
                onFocus={(e) => e.target.select()}
                className={inputClass}
                autoFocus
              />
              <select
                value={addingSet.weightUnit}
                onChange={(e) =>
                  setAddingSet({ ...addingSet, weightUnit: e.target.value as WeightUnit })
                }
                className="h-8 rounded-md border border-input bg-background px-1 text-xs focus-visible:outline-none"
              >
                <option value="lb">lb</option>
                <option value="kg">kg</option>
              </select>
            </div>
            <input
              type="number"
              min="1"
              value={addingSet.reps}
              onChange={(e) =>
                setAddingSet({ ...addingSet, reps: parseInt(e.target.value) || 1 })
              }
              onFocus={(e) => e.target.select()}
              className={inputClass}
            />
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handleAddSetSave}
                disabled={isPending}
                aria-label="Save new set"
                className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Check className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setAddingSet(null)}
                aria-label="Cancel"
                className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAddSetOpen}
            className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="size-3.5" />
            Add set
          </button>
        )}
      </div>

      {/* AI Substitutes panel */}
      {showSubs && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            AI Substitutes
          </p>
          {isLoadingSubs && (
            <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Thinking…
            </div>
          )}
          {subsError && <p className="text-xs text-destructive">{subsError}</p>}
          {substitutes && (
            <div className="flex flex-col gap-2">
              {substitutes.map((sub, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <p className="text-xs font-semibold">{sub.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{sub.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SessionExercises ──────────────────────────────────────────────────────────

interface SessionExercisesProps {
  sessionId: string;
  sets: WorkoutSet[];
  videoUrls?: Record<string, string>;
}

export function SessionExercises({ sessionId, sets, videoUrls = {} }: SessionExercisesProps) {
  const router = useRouter();
  const exercises = groupByExercise(sets);
  const [shareState, setShareState] = useState<"idle" | "pending" | "shared" | "error">("idle");
  const [, startShareTransition] = useTransition();

  if (exercises.length === 0) return null;

  function handleShare() {
    setShareState("pending");
    startShareTransition(async () => {
      const result = await shareWorkoutSession(sessionId);
      if (result.success) {
        setShareState("shared");
        setTimeout(() => setShareState("idle"), 3000);
      } else {
        setShareState("error");
        setTimeout(() => setShareState("idle"), 3000);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Exercises
        </h2>
        <button
          type="button"
          onClick={handleShare}
          disabled={shareState === "pending" || shareState === "shared"}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
          aria-label="Share workout to community"
        >
          <Share2 className="size-3.5" />
          {shareState === "pending" ? "Sharing…" : shareState === "shared" ? "Shared!" : shareState === "error" ? "Failed" : "Share"}
        </button>
      </div>
      {exercises.map((group) => (
        <ExerciseGroupCard key={group.name} sessionId={sessionId} group={group} videoUrl={videoUrls[group.name]} />
      ))}
    </div>
  );
}
