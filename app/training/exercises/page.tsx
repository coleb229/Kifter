import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
          Back to Training
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exercises</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the exercises available when logging workouts.
        </p>
      </div>

      <ExerciseManager customExercises={customExercises} />
    </div>
  );
}
