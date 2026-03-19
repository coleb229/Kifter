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
  addExerciseTag,
  removeExerciseTag,
  linkSuperset,
  unlinkSuperset,
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
  supersetGroupId?: string;
}

function groupByExercise(sets: WorkoutSet[]): ExerciseGroup[] {
  const map = new Map<string, WorkoutSet[]>();
  for (const set of sets) {
    if (!map.has(set.exercise)) map.set(set.exercise, []);
    map.get(set.exercise)!.push(set);
  }
  return Array.from(map.entries()).map(([name, sets]) => ({
    name,
    sets,
    supersetGroupId: sets[0]?.supersetGroupId,
  }));
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

const PRESET_TAGS = ["Compound", "Isolation", "Push", "Pull", "Legs", "Core"];

function ExerciseGroupCard({
  sessionId,
  group,
  videoUrl,
  initialTags = [],
  allUserTags = [],
  pendingSuperset,
  onStartSuperset,
  onCompleteSuperset,
  onRemoveSuperset,
}: {
  sessionId: string;
  group: ExerciseGroup;
  videoUrl?: string;
  initialTags?: string[];
  allUserTags?: string[];
  pendingSuperset?: string | null;
  onStartSuperset?: () => void;
  onCompleteSuperset?: () => void;
  onRemoveSuperset?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [exerciseState, setExerciseState] = useState<ExerciseEditState>({ type: "none" });
  const [setStates, setSetStates] = useState<Record<string, SetEditState>>({});
  const [addingSet, setAddingSet] = useState<{ weight: number; weightUnit: WeightUnit; reps: number } | null>(null);

  // Tags state
  const [tags, setTags] = useState<string[]>(initialTags);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [, startTagTransition] = useTransition();

  function handleAddTag(tag: string) {
    const t = tag.trim();
    if (!t || tags.includes(t)) { setShowTagInput(false); setTagInput(""); return; }
    setTags((prev) => [...prev, t]);
    setShowTagInput(false);
    setTagInput("");
    startTagTransition(async () => { await addExerciseTag(group.name, t); });
  }

  function handleRemoveTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
    startTagTransition(async () => { await removeExerciseTag(group.name, tag); });
  }

  const tagSuggestions = [...new Set([...PRESET_TAGS, ...allUserTags])].filter(
    (t) => !tags.includes(t) && t.toLowerCase().includes(tagInput.toLowerCase())
  );

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

      {/* Tags row */}
      {exerciseState.type === "none" && !editingVideo && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              {tag}
              <button type="button" onClick={() => handleRemoveTag(tag)} className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${tag}`}>
                <X className="size-3" />
              </button>
            </span>
          ))}
          {showTagInput ? (
            <div className="relative">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTag(tagInput);
                  if (e.key === "Escape") { setShowTagInput(false); setTagInput(""); }
                }}
                placeholder="Tag name"
                autoFocus
                className="h-6 w-24 rounded-full border border-input bg-background px-2 text-xs focus-visible:outline-none"
              />
              {tagSuggestions.length > 0 && tagInput.length === 0 && (
                <div className="absolute left-0 top-7 z-10 flex flex-wrap gap-1 rounded-lg border border-border bg-popover p-2 shadow-md w-40">
                  {tagSuggestions.slice(0, 8).map((s) => (
                    <button key={s} type="button" onClick={() => handleAddTag(s)} className="rounded-full bg-muted px-2 py-0.5 text-xs hover:bg-muted/80">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowTagInput(true)}
              className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-muted-foreground/40 px-2 py-0.5 text-xs text-muted-foreground hover:border-foreground hover:text-foreground"
            >
              <Plus className="size-3" /> tag
            </button>
          )}
          {pendingSuperset === null && onStartSuperset && !group.supersetGroupId && (
            <button
              type="button"
              onClick={onStartSuperset}
              className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-muted-foreground/40 px-2 py-0.5 text-xs text-muted-foreground hover:border-indigo-500 hover:text-indigo-500"
            >
              SS
            </button>
          )}
          {pendingSuperset !== null && pendingSuperset !== group.name && onCompleteSuperset && !group.supersetGroupId && (
            <button
              type="button"
              onClick={onCompleteSuperset}
              className="inline-flex items-center gap-0.5 rounded-full border border-indigo-500 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-950/30 hover:bg-indigo-100"
            >
              Link with {pendingSuperset}
            </button>
          )}
          {group.supersetGroupId && onRemoveSuperset && (
            <button
              type="button"
              onClick={onRemoveSuperset}
              className="inline-flex items-center gap-0.5 rounded-full border border-amber-400 bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950/30 hover:bg-amber-100"
            >
              Remove SS
            </button>
          )}
        </div>
      )}

      {/* Sets */}
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-[2rem_1fr_1fr_4rem] items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="text-center">#</span>
          <span>Weight</span>
          <span>Reps</span>
          <span />
        </div>

        {optimisticSets.map((set, idx) => {
          const state = getSetState(set.id);
          const isLastSet = idx === optimisticSets.length - 1;

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
              className="group relative grid grid-cols-[2rem_1fr_1fr_4rem] items-center gap-2 min-h-10 py-1 rounded-md transition-transform"
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
              <button
                type="button"
                onClick={() => handleToggleComplete(set)}
                aria-label={set.completed ? "Mark incomplete" : "Mark complete"}
                className={`flex size-full items-center justify-center rounded text-sm transition-colors hover:bg-muted ${set.completed ? "text-emerald-500" : "text-muted-foreground hover:text-emerald-500"}`}
              >
                {set.completed ? <Check className="size-3.5 mx-auto" /> : set.setNumber}
              </button>
              <span className={`text-sm ${set.completed ? "line-through text-muted-foreground" : ""}`}>
                {set.weight} {set.weightUnit}
              </span>
              <span className={`text-sm ${set.completed ? "line-through text-muted-foreground" : ""}`}>{set.reps}</span>
              <div className={`flex items-center gap-0.5 opacity-100 sm:transition-opacity sm:group-hover:opacity-100 ${isLastSet ? "" : "sm:opacity-0"}`}>
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
          <div className="mt-2 flex items-center gap-2">
            {lastSet ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  const tempSet: WorkoutSet = {
                    id: "optimistic-" + Date.now(),
                    sessionId,
                    userId: "",
                    exercise: group.name,
                    setNumber: optimisticSets.length + 1,
                    weight: lastSet.weight,
                    weightUnit: lastSet.weightUnit,
                    reps: lastSet.reps,
                    completed: false,
                    createdAt: new Date().toISOString(),
                  };
                  startTransition(async () => {
                    dispatchOptimistic({ type: "add", set: tempSet });
                    await addExerciseToSession(sessionId, {
                      exercise: group.name,
                      sets: [{ setNumber: tempSet.setNumber, weight: lastSet.weight, weightUnit: lastSet.weightUnit, reps: lastSet.reps }],
                    });
                    router.refresh();
                  });
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 sm:flex-none sm:justify-start"
              >
                <Plus className="size-3.5" />
                Add same ({lastSet.weight}{lastSet.weightUnit} × {lastSet.reps})
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleAddSetOpen}
              className={`flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground ${lastSet ? "shrink-0" : "mt-1"}`}
            >
              <Plus className="size-3.5" />
              {lastSet ? "Custom" : "Add set"}
            </button>
          </div>
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
  tagsMap?: Record<string, string[]>;
  allUserTags?: string[];
}

export function SessionExercises({ sessionId, sets, videoUrls = {}, tagsMap = {}, allUserTags = [] }: SessionExercisesProps) {
  const router = useRouter();
  const exercises = groupByExercise(sets);
  const [shareState, setShareState] = useState<"idle" | "pending" | "shared" | "error">("idle");
  const [, startShareTransition] = useTransition();
  const [pendingSuperset, setPendingSuperset] = useState<string | null>(null);
  const [, startSupersetTransition] = useTransition();

  const totalVolumeKg = sets.reduce((sum, s) => {
    const kg = s.weightUnit === "lb" ? s.weight / 2.20462 : s.weight;
    return sum + kg * s.reps;
  }, 0);

  function handleStartSuperset(exerciseName: string) {
    setPendingSuperset(exerciseName);
  }

  function handleCompleteSuperset(exerciseName: string) {
    if (!pendingSuperset) return;
    const ex1 = pendingSuperset;
    const ex2 = exerciseName;
    setPendingSuperset(null);
    startSupersetTransition(async () => {
      await linkSuperset(sessionId, ex1, ex2);
      router.refresh();
    });
  }

  function handleRemoveSuperset(groupId: string) {
    startSupersetTransition(async () => {
      await unlinkSuperset(sessionId, groupId);
      router.refresh();
    });
  }

  // Group exercises into superset pairs or singles
  type RenderGroup =
    | { type: "single"; exercise: ExerciseGroup }
    | { type: "superset"; exercises: ExerciseGroup[]; groupId: string };

  const renderGroups: RenderGroup[] = [];
  const seenSupersets = new Set<string>();
  for (const ex of exercises) {
    if (ex.supersetGroupId) {
      if (seenSupersets.has(ex.supersetGroupId)) continue;
      seenSupersets.add(ex.supersetGroupId);
      const pair = exercises.filter((e) => e.supersetGroupId === ex.supersetGroupId);
      renderGroups.push({ type: "superset", exercises: pair, groupId: ex.supersetGroupId });
    } else {
      renderGroups.push({ type: "single", exercise: ex });
    }
  }

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
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Exercises
          </h2>
          {totalVolumeKg > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Total volume: {Math.round(totalVolumeKg).toLocaleString()} kg
            </p>
          )}
        </div>
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
      {renderGroups.map((rg) =>
        rg.type === "superset" ? (
          <div
            key={rg.groupId}
            className="rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 p-1 flex flex-col gap-1 relative"
          >
            <span className="absolute -top-2.5 left-3 rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-bold text-white">SS</span>
            {rg.exercises.map((ex) => (
              <ExerciseGroupCard
                key={ex.name}
                sessionId={sessionId}
                group={ex}
                videoUrl={videoUrls[ex.name]}
                initialTags={tagsMap[ex.name] ?? []}
                allUserTags={allUserTags}
                pendingSuperset={pendingSuperset}
                onStartSuperset={() => handleStartSuperset(ex.name)}
                onCompleteSuperset={() => handleCompleteSuperset(ex.name)}
                onRemoveSuperset={() => handleRemoveSuperset(rg.groupId)}
              />
            ))}
          </div>
        ) : (
          <ExerciseGroupCard
            key={rg.exercise.name}
            sessionId={sessionId}
            group={rg.exercise}
            videoUrl={videoUrls[rg.exercise.name]}
            initialTags={tagsMap[rg.exercise.name] ?? []}
            allUserTags={allUserTags}
            pendingSuperset={pendingSuperset}
            onStartSuperset={() => handleStartSuperset(rg.exercise.name)}
            onCompleteSuperset={() => handleCompleteSuperset(rg.exercise.name)}
          />
        )
      )}
    </div>
  );
}
