"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addExerciseToSession, getLastWeightForExercise } from "@/actions/workout-actions";
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
  "h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface ExerciseLoggerProps {
  sessionId: string;
  exercises: string[];
}

export function ExerciseLogger({ sessionId, exercises }: ExerciseLoggerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [unit, setUnit] = useState<WeightUnit>("lb");
  const [suggested, setSuggested] = useState<{ weight: number; unit: WeightUnit } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      exercise: "",
      sets: [{ weight: 0, reps: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sets",
  });

  async function handleExerciseChange(name: string) {
    form.setValue("exercise", name, { shouldValidate: true });
    if (!name) { setSuggested(null); return; }
    const result = await getLastWeightForExercise(name);
    if (result.success && result.data) {
      setUnit(result.data.unit);
      const { weight } = result.data;
      const currentSets = form.getValues("sets");
      currentSets.forEach((_, i) => {
        form.setValue(`sets.${i}.weight`, weight);
      });
      const increment = result.data.unit === "kg" ? 1.25 : 2.5;
      setSuggested({ weight: weight + increment, unit: result.data.unit });
    } else {
      setSuggested(null);
    }
  }

  function onSubmit(values: FormValues) {
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
        router.refresh();
      } else {
        form.setError("root", { message: result.error });
      }
    });
  }

  return (
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
        {/* Exercise select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Exercise</label>
          <select
            value={form.watch("exercise")}
            onChange={(e) => handleExerciseChange(e.target.value)}
            className={inputClass}
          >
            <option value="">Select an exercise…</option>
            {exercises.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
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
        </div>

        {/* Sets */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
            <span className="text-center">#</span>
            <span>Weight ({unit})</span>
            <span>Reps</span>
            <span />
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2"
            >
              <span className="text-center text-sm text-muted-foreground">
                {index + 1}
              </span>
              <input
                {...form.register(`sets.${index}.weight`, { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                onFocus={(e) => e.target.select()}
                className={inputClass}
              />
              <input
                {...form.register(`sets.${index}.reps`, { valueAsNumber: true })}
                type="number"
                min="1"
                placeholder="0"
                onFocus={(e) => e.target.select()}
                className={inputClass}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                aria-label="Remove set"
              >
                <Minus className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start text-muted-foreground"
          onClick={() => {
            const currentSets = form.getValues("sets");
            const last = currentSets[currentSets.length - 1];
            append({ weight: last?.weight ?? 0, reps: 0 });
          }}
        >
          <Plus className="size-3.5" />
          Add Set
        </Button>

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="sm:self-end sm:px-8">
          {isPending ? "Saving…" : "Log Exercise"}
        </Button>
      </form>
    </div>
  );
}
