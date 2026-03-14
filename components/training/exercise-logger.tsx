"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeightUnitToggle } from "./weight-unit-toggle";
import { useWeightUnit } from "@/hooks/use-weight-unit";
import { toKg } from "@/lib/weight";
import { addExerciseToSession } from "@/actions/workout-actions";

const schema = z.object({
  exercise: z.string().min(1, "Exercise name required"),
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
}

export function ExerciseLogger({ sessionId }: ExerciseLoggerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { unit } = useWeightUnit();

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

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await addExerciseToSession(sessionId, {
        exercise: values.exercise,
        sets: values.sets.map((s, i) => ({
          setNumber: i + 1,
          weight: toKg(s.weight, unit),
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
        <WeightUnitToggle />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Exercise name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Exercise</label>
          <input
            {...form.register("exercise")}
            placeholder="e.g. Bench Press"
            className={inputClass}
          />
          {form.formState.errors.exercise && (
            <p className="text-xs text-destructive">
              {form.formState.errors.exercise.message}
            </p>
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
                className={inputClass}
              />
              <input
                {...form.register(`sets.${index}.reps`, { valueAsNumber: true })}
                type="number"
                min="1"
                placeholder="0"
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
          onClick={() => append({ weight: 0, reps: 0 })}
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
          {isPending ? "Saving..." : "Log Exercise"}
        </Button>
      </form>
    </div>
  );
}
