"use client";

import { useWeightUnit } from "@/hooks/use-weight-unit";
import { toDisplay } from "@/lib/weight";
import { WeightUnitToggle } from "./weight-unit-toggle";
import type { WorkoutSet } from "@/types";

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

interface SessionExercisesProps {
  sets: WorkoutSet[];
}

export function SessionExercises({ sets }: SessionExercisesProps) {
  const { unit } = useWeightUnit();
  const exercises = groupByExercise(sets);

  if (exercises.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Exercises
        </h2>
        <WeightUnitToggle />
      </div>

      {exercises.map((group) => (
        <div key={group.name} className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-semibold">{group.name}</h3>
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-[2rem_1fr_1fr] gap-2 text-xs font-medium text-muted-foreground">
              <span className="text-center">#</span>
              <span>Weight ({unit})</span>
              <span>Reps</span>
            </div>
            {group.sets.map((set) => (
              <div key={set.id} className="grid grid-cols-[2rem_1fr_1fr] gap-2 text-sm">
                <span className="text-center text-muted-foreground">{set.setNumber}</span>
                <span>{toDisplay(set.weight, unit)}</span>
                <span>{set.reps}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
