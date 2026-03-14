"use client";

import { useFieldArray, type Control, type UseFormRegister, type FieldErrors } from "react-hook-form";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkoutFormValues } from "./workout-form";

interface AddExerciseProps {
  exerciseIndex: number;
  control: Control<WorkoutFormValues>;
  register: UseFormRegister<WorkoutFormValues>;
  errors: FieldErrors<WorkoutFormValues>;
  onRemove: () => void;
}

const inputClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function AddExercise({
  exerciseIndex,
  control,
  register,
  errors,
  onRemove,
}: AddExerciseProps) {
  const { fields: setFields, append: appendSet, remove: removeSet } = useFieldArray({
    control,
    name: `exercises.${exerciseIndex}.sets`,
  });

  const exerciseError = errors.exercises?.[exerciseIndex];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-3">
        <input
          {...register(`exercises.${exerciseIndex}.name`)}
          placeholder="Exercise name (e.g. Bench Press)"
          className={`${inputClass} flex-1`}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Remove exercise"
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>

      {exerciseError?.name && (
        <p className="mb-2 text-xs text-destructive">{exerciseError.name.message}</p>
      )}

      {/* Set rows */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
          <span className="text-center">#</span>
          <span>Weight (kg)</span>
          <span>Reps</span>
          <span />
        </div>

        {setFields.map((setField, setIndex) => (
          <div
            key={setField.id}
            className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2"
          >
            <span className="text-center text-sm text-muted-foreground">
              {setIndex + 1}
            </span>
            <input
              {...register(`exercises.${exerciseIndex}.sets.${setIndex}.weight`, {
                valueAsNumber: true,
              })}
              type="number"
              min="0"
              step="0.5"
              placeholder="0"
              className={inputClass}
            />
            <input
              {...register(`exercises.${exerciseIndex}.sets.${setIndex}.reps`, {
                valueAsNumber: true,
              })}
              type="number"
              min="1"
              placeholder="0"
              className={inputClass}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeSet(setIndex)}
              disabled={setFields.length === 1}
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
        className="mt-3 text-muted-foreground"
        onClick={() =>
          appendSet({ setNumber: setFields.length + 1, weight: 0, reps: 0 })
        }
      >
        <Plus className="size-3.5" />
        Add Set
      </Button>
    </div>
  );
}
