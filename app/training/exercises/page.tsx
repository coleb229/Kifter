import Link from "next/link";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { getUserExercises } from "@/actions/workout-actions";
import { DEFAULT_EXERCISES } from "@/lib/exercises";
import { ExerciseManager } from "@/components/training/exercise-manager";

export default async function ExercisesPage() {
  const result = await getUserExercises();
  const allExercises = result.success ? result.data : DEFAULT_EXERCISES;
  const customExercises = allExercises.filter(
    (name) => !DEFAULT_EXERCISES.includes(name)
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/training"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Training
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <Dumbbell className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exercises</h1>
          <p className="text-sm text-muted-foreground">
            Manage the exercises available when logging workouts.
          </p>
        </div>
      </div>

      <ExerciseManager customExercises={customExercises} />
    </div>
  );
}
