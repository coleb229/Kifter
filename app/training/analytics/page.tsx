import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getExercisesWithHistory,
  getExerciseHistory,
} from "@/actions/analytics-actions";
import { AnalyticsDashboard } from "@/components/training/analytics-dashboard";
import { AIInsights } from "@/components/training/ai-insights";

export default async function AnalyticsPage() {
  const exercisesResult = await getExercisesWithHistory();
  const exercises = exercisesResult.success ? exercisesResult.data : [];

  let initialData = null;
  if (exercises.length > 0) {
    const historyResult = await getExerciseHistory(exercises[0]);
    initialData = historyResult.success ? historyResult.data : [];
  }

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/training"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All sessions
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your progress over time
        </p>
      </div>

      {exercises.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <p className="font-medium">No data yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Log some workouts to see your progress here.
          </p>
        </div>
      ) : (
        <>
          <AnalyticsDashboard
            exercises={exercises}
            initialExercise={exercises[0]}
            initialData={initialData ?? []}
          />
          <AIInsights />
        </>
      )}
    </div>
  );
}
