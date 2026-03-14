"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddExercise } from "./add-exercise";
import { createWorkoutSession } from "@/actions/workout-actions";

const setSchema = z.object({
  setNumber: z.number().int().min(1),
  weight: z.number().min(0, "Must be 0 or more"),
  reps: z.number().int().min(1, "At least 1 rep"),
});

const exerciseSchema = z.object({
  name: z.string().min(1, "Exercise name required"),
  sets: z.array(setSchema).min(1, "Add at least one set"),
});

const workoutFormSchema = z.object({
  name: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  exercises: z.array(exerciseSchema).min(1, "Add at least one exercise"),
});

export type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

const inputClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const textareaClass =
  "min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none";

export function WorkoutForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      name: "",
      date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
      exercises: [
        { name: "", sets: [{ setNumber: 1, weight: 0, reps: 0 }] },
      ],
    },
  });

  const { fields: exerciseFields, append: appendExercise, remove: removeExercise } =
    useFieldArray({ control: form.control, name: "exercises" });

  function onSubmit(values: WorkoutFormValues) {
    startTransition(async () => {
      const result = await createWorkoutSession(values);
      if (result.success) {
        router.push("/training");
        router.refresh();
      } else {
        form.setError("root", { message: result.error });
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Session details */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Session Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Session name <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              {...form.register("name")}
              placeholder="e.g. Push Day"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Date</label>
            <input
              {...form.register("date")}
              type="date"
              className={inputClass}
            />
            {form.formState.errors.date && (
              <p className="text-xs text-destructive">
                {form.formState.errors.date.message}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            Notes <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            {...form.register("notes")}
            placeholder="How did it feel? Any PRs?"
            className={textareaClass}
          />
        </div>
      </div>

      {/* Exercises */}
      {exerciseFields.map((field, index) => (
        <AddExercise
          key={field.id}
          exerciseIndex={index}
          control={form.control}
          register={form.register}
          errors={form.formState.errors}
          onRemove={() => removeExercise(index)}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          appendExercise({ name: "", sets: [{ setNumber: 1, weight: 0, reps: 0 }] })
        }
      >
        <Plus className="size-4" />
        Add Exercise
      </Button>

      {form.formState.errors.exercises?.root && (
        <p className="text-sm text-destructive">
          {form.formState.errors.exercises.root.message}
        </p>
      )}

      {form.formState.errors.root && (
        <p className="text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="sm:self-end sm:px-10">
        {isPending ? "Saving..." : "Save Workout"}
      </Button>
    </form>
  );
}
