"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addExerciseToSession, getLastWeightForExercise, getLastSessionSetsForExercise, getRecentSessionsForExercise } from "@/actions/workout-actions";
import { format } from "date-fns";
import type { WeightUnit } from "@/lib/weight";

const schema = z.object({
  exercise: z.string().min(1, "Exercise required"),
  sets: z
    .array(
      z.object({
        weight: z.number().min(0, "Must be 0 or more"),
        reps: z.number().int().min(1, "At least 1 rep"),
      })
    )
    .min(1, "Add at least one set"),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface ExerciseLoggerProps {
  sessionId: string;
  exercises: string[];
}

export function ExerciseLogger({ sessionId, exercises }: ExerciseLoggerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [unit, setUnit] = useState<WeightUnit>("lb");
  const [suggested, setSuggested] = useState<{ weight: number; unit: WeightUnit } | null>(null);
  const [lastSession, setLastSession] = useState<{ date: string; sets: { setNumber: number; weight: number; weightUnit: string; reps: number }[] } | null>(null);
  const [history, setHistory] = useState<{ date: string; maxWeight: number; weightUnit: string }[]>([]);
  const [query, setQuery] = useState("");
  const [comboOpen, setComboOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const comboRef = useRef<HTMLDivElement>(null);
  const DEFAULT_REST = 90;
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState<number>(DEFAULT_REST);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function handleRestTimerStart() {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission();
      }
      const stored = localStorage.getItem("kifted_rest_duration");
      const duration = stored ? parseInt(stored, 10) : DEFAULT_REST;
      setRestTimer(duration);
      setRestTotal(duration);
    }
    window.addEventListener("rest-timer-start", handleRestTimerStart);
    return () => window.removeEventListener("rest-timer-start", handleRestTimerStart);
  }, []);

  useEffect(() => {
    if (restTimer === null) return;
    if (restTimer === 0) {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Rest over — next set!", {
          body: "Time to get back to it.",
          icon: "/icons/192x192.png",
        });
      }
      return;
    }
    const id = setTimeout(() => setRestTimer((t) => (t !== null && t > 0 ? t - 1 : 0)), 1000);
    return () => clearTimeout(id);
  }, [restTimer]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      exercise: "",
      sets: [{ weight: 0, reps: 0 }],
    },
  });

  const { fields, remove } = useFieldArray({
    control: form.control,
    name: "sets",
  });

  const watchedSets = useWatch({ control: form.control, name: "sets" });

  async function handleExerciseChange(name: string) {
    form.setValue("exercise", name, { shouldValidate: true });
    if (!name) {
      setSuggested(null);
      setLastSession(null);
      setHistory([]);
      return;
    }
    const [weightResult, lastSessionResult, historyResult] = await Promise.all([
      getLastWeightForExercise(name),
      getLastSessionSetsForExercise(name),
      getRecentSessionsForExercise(name, 3),
    ]);
    if (weightResult.success && weightResult.data) {
      setUnit(weightResult.data.unit);
      const { weight } = weightResult.data;
      const increment = weightResult.data.unit === "kg" ? 1.25 : 2.5;
      setSuggested({ weight: weight + increment, unit: weightResult.data.unit });
    } else {
      setSuggested(null);
    }
    // Pre-fill sets from last session (weight + reps), falling back to weight-only if no reps
    if (lastSessionResult.success && lastSessionResult.data) {
      const lastSets = lastSessionResult.data.sets;
      form.setValue("sets", lastSets.map((s) => ({
        weight: s.weight,
        reps: s.reps,
      })));
    } else if (weightResult.success && weightResult.data) {
      const { weight } = weightResult.data;
      const currentSets = form.getValues("sets");
      currentSets.forEach((_, i) => {
        form.setValue(`sets.${i}.weight`, weight);
      });
    }
    setLastSession(lastSessionResult.success ? (lastSessionResult.data ?? null) : null);
    setHistory(historyResult.success ? historyResult.data : []);
  }

  function incrementWeight(index: number) {
    const current = form.getValues(`sets.${index}.weight`);
    const step = unit === "kg" ? 1.25 : 2.5;
    form.setValue(`sets.${index}.weight`, Math.round((current + step) * 100) / 100);
  }

  function decrementWeight(index: number) {
    const current = form.getValues(`sets.${index}.weight`);
    const step = unit === "kg" ? 1.25 : 2.5;
    form.setValue(`sets.${index}.weight`, Math.max(0, Math.round((current - step) * 100) / 100));
  }

  function incrementReps(index: number) {
    const current = form.getValues(`sets.${index}.reps`);
    form.setValue(`sets.${index}.reps`, current + 1);
  }

  function decrementReps(index: number) {
    const current = form.getValues(`sets.${index}.reps`);
    form.setValue(`sets.${index}.reps`, Math.max(1, current - 1));
  }

  function onSubmit(values: FormValues) {
    if (!navigator.onLine) {
      form.setError("root", { message: "You're offline. Your data is saved locally and will sync when you reconnect." });
      return;
    }
    startTransition(async () => {
      const result = await addExerciseToSession(sessionId, {
        exercise: values.exercise,
        sets: values.sets.map((s, i) => ({
          setNumber: i + 1,
          weight: s.weight,
          weightUnit: unit,
          reps: s.reps,
        })),
      });
      if (result.success) {
        form.reset({ exercise: "", sets: [{ weight: 0, reps: 0 }] });
        setQuery("");
        setSuggested(null);
        setLastSession(null);
        setHistory([]);
        const stored = localStorage.getItem("kifted_rest_duration");
        setRestTimer(stored ? parseInt(stored, 10) : DEFAULT_REST);
        // Track session activity for PWA install prompt
        const count = parseInt(localStorage.getItem("kifted_session_count") ?? "0", 10);
        localStorage.setItem("kifted_session_count", String(count + 1));
        router.refresh();
      } else {
        form.setError("root", { message: result.error });
      }
    });
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Log Exercise
          </h2>
          {/* Inline unit toggle — single source of truth */}
          <div className="flex items-center rounded-lg border border-border bg-muted p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setUnit("kg")}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                unit === "kg"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              kg
            </button>
            <button
              type="button"
              onClick={() => setUnit("lb")}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                unit === "lb"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              lb
            </button>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Exercise combobox */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Exercise</label>
            <div ref={comboRef} className="relative">
              {(() => {
                const filtered = exercises.filter((name) => name.toLowerCase().includes(query.toLowerCase()));
                return (
                  <>
                    <input
                      type="text"
                      value={comboOpen ? query : (query || form.getValues("exercise"))}
                      placeholder="Search exercises…"
                      className={inputClass}
                      role="combobox"
                      aria-expanded={comboOpen}
                      aria-controls="exercise-listbox"
                      aria-activedescendant={activeIndex >= 0 ? `exercise-option-${activeIndex}` : undefined}
                      onFocus={() => { setQuery(""); setComboOpen(true); setActiveIndex(-1); }}
                      onChange={(e) => { setQuery(e.target.value); setComboOpen(true); setActiveIndex(-1); }}
                      onKeyDown={(e) => {
                        if (!comboOpen) return;
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setActiveIndex((i) => Math.max(i - 1, 0));
                        } else if (e.key === "Enter" && activeIndex >= 0) {
                          e.preventDefault();
                          setQuery("");
                          setComboOpen(false);
                          handleExerciseChange(filtered[activeIndex]);
                          setActiveIndex(-1);
                        } else if (e.key === "Escape") {
                          setComboOpen(false);
                          setActiveIndex(-1);
                        }
                      }}
                    />
                    {comboOpen && (
                      <ul id="exercise-listbox" role="listbox" className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-md">
                        {filtered.map((name, i) => (
                          <li
                            key={name}
                            id={`exercise-option-${i}`}
                            role="option"
                            aria-selected={i === activeIndex}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setQuery("");
                              setComboOpen(false);
                              handleExerciseChange(name);
                              setActiveIndex(-1);
                            }}
                            className={`cursor-pointer px-3 py-2 text-sm transition-colors ${i === activeIndex ? "bg-muted" : "hover:bg-muted"}`}
                          >
                            {name}
                          </li>
                        ))}
                        {filtered.length === 0 && (
                          <li className="px-3 py-2 text-sm text-muted-foreground">No matches</li>
                        )}
                      </ul>
                    )}
                  </>
                );
              })()}
            </div>
            {form.formState.errors.exercise && (
              <p className="text-xs text-destructive">
                {form.formState.errors.exercise.message}
              </p>
            )}
            {suggested && (
              <button
                type="button"
                onClick={() => {
                  const currentSets = form.getValues("sets");
                  currentSets.forEach((_, i) => {
                    form.setValue(`sets.${i}.weight`, suggested.weight);
                  });
                }}
                className="self-start rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Suggested: {suggested.weight} {suggested.unit} (+{suggested.unit === "kg" ? 1.25 : 2.5})
              </button>
            )}
            {lastSession && (
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium">Last ({format(new Date(lastSession.date), "MMM d")}):</span>
                {lastSession.sets.map((s, i) => (
                  <span key={i}> · {s.weight}{s.weightUnit}×{s.reps}</span>
                ))}
              </div>
            )}
            {history.length > 0 && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer select-none hover:text-foreground">History</summary>
                <div className="mt-1 space-y-0.5 pl-2">
                  {history.map((s) => (
                    <div key={s.date}>{format(new Date(s.date), "MMM d")}: {s.maxWeight}{s.weightUnit}</div>
                  ))}
                </div>
              </details>
            )}
          </div>

          {/* Sets with stepper controls */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[1.75rem_1fr_auto] items-center gap-3 px-1 text-xs font-medium text-muted-foreground">
              <span className="text-center">#</span>
              <div className="grid grid-cols-2 gap-2">
                <span>Weight ({unit})</span>
                <span>Reps</span>
              </div>
              <span className="w-7" />
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-[1.75rem_1fr_auto] items-center gap-3"
              >
                <span className="text-center text-sm text-muted-foreground">
                  {index + 1}
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {/* Weight stepper */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => decrementWeight(index)}
                      className="flex h-11 w-10 sm:h-10 sm:w-8 shrink-0 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 touch-manipulation"
                      aria-label="Decrease weight"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={watchedSets?.[index]?.weight || ""}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "" || v === ".") { form.setValue(`sets.${index}.weight`, 0); return; }
                        const n = parseFloat(v);
                        if (!isNaN(n)) form.setValue(`sets.${index}.weight`, n);
                      }}
                      className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-1 py-2 text-center text-base sm:text-sm focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                    <button
                      type="button"
                      onClick={() => incrementWeight(index)}
                      className="flex h-11 w-10 sm:h-10 sm:w-8 shrink-0 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 touch-manipulation"
                      aria-label="Increase weight"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  {/* Reps stepper */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => decrementReps(index)}
                      className="flex h-11 w-10 sm:h-10 sm:w-8 shrink-0 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 touch-manipulation"
                      aria-label="Decrease reps"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={watchedSets?.[index]?.reps || ""}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") { form.setValue(`sets.${index}.reps`, 0); return; }
                        const n = parseInt(v, 10);
                        if (!isNaN(n) && n >= 0) form.setValue(`sets.${index}.reps`, n);
                      }}
                      className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-1 py-2 text-center text-base sm:text-sm focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                    <button
                      type="button"
                      onClick={() => incrementReps(index)}
                      className="flex h-11 w-10 sm:h-10 sm:w-8 shrink-0 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 touch-manipulation"
                      aria-label="Increase reps"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  aria-label="Remove set"
                  className="w-7"
                >
                  <Minus className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {form.formState.errors.root && (
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}

          <Button type="submit" disabled={isPending} className="w-full sm:w-auto sm:self-end sm:px-8">
            {isPending ? "Saving…" : "Log Exercise"}
          </Button>
        </form>
      </div>

      {/* Sticky rest timer — rendered via portal so it floats above everything */}
      {mounted && restTimer !== null && createPortal(
        <div role="timer" aria-live="assertive" aria-label="Rest timer" className="fixed bottom-24 inset-x-4 z-40 rounded-2xl border border-border bg-card px-4 py-3 shadow-xl sm:inset-x-auto sm:right-6 sm:w-72">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rest Timer</p>
              <p className={`text-2xl font-bold tabular-nums transition-colors ${restTimer > 0 && restTimer <= 10 ? "text-destructive" : restTimer === 0 ? "text-emerald-500" : ""}`}>
                {restTimer > 0 ? `${restTimer}s` : "Go!"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRestTimer(null)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Done
            </button>
          </div>
          {/* Progress bar */}
          {restTimer !== null && restTotal > 0 && (
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  restTimer === 0 ? "bg-emerald-500" : restTimer / restTotal <= 0.1 ? "bg-destructive" : restTimer / restTotal <= 0.3 ? "bg-amber-500" : "bg-primary"
                }`}
                style={{ width: `${restTotal > 0 ? (restTimer / restTotal) * 100 : 0}%` }}
              />
            </div>
          )}
          <div className="mt-2 flex gap-1.5">
            {[60, 90, 120, 180].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  localStorage.setItem("kifted_rest_duration", String(s));
                  setRestTimer(s);
                  setRestTotal(s);
                }}
                className="flex-1 rounded-md border border-border py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {s}s
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
