import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getExercisesWithHistory,
  getExerciseHistory,
  getAppleHealthTrainingSessions,
} from "@/actions/analytics-actions";
import { getSessionDates, getDeloadRecommendation, getPersonalRecords, getBodyTargetDistribution } from "@/actions/workout-actions";
import { AnalyticsDashboard } from "@/components/training/analytics-dashboard";
import { AIInsights } from "@/components/training/ai-insights";
import { TrainingHeatmap } from "@/components/training/training-heatmap";
import { DeloadRecommendation } from "@/components/training/deload-recommendation";
import { PersonalRecords } from "@/components/training/personal-records";
import { BodyTargetChart } from "@/components/training/body-target-chart";
import { AppleHealthTrainingChart } from "@/components/training/apple-health-training-chart";

export default async function AnalyticsPage() {
  const [exercisesResult, sessionDatesResult, deloadResult, prResult, bodyTargetResult, ahResult] = await Promise.all([
    getExercisesWithHistory(),
    getSessionDates(365),
    getDeloadRecommendation(),
    getPersonalRecords(),
    getBodyTargetDistribution(),
    getAppleHealthTrainingSessions(),
  ]);
  const exercises = exercisesResult.success ? exercisesResult.data : [];
  const sessionDates = sessionDatesResult.success ? sessionDatesResult.data : [];
  const deloadData = deloadResult.success ? deloadResult.data : null;
  const prData = prResult.success ? prResult.data : [];
  const bodyTargetData = bodyTargetResult.success ? bodyTargetResult.data : [];
  const ahData = ahResult.success ? ahResult.data : [];

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

      {deloadData && <DeloadRecommendation recommendation={deloadData} />}

      {/* Training frequency heatmap — shown regardless of exercise data */}
      {sessionDates.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-1 text-sm font-semibold">Training Frequency</h2>
          <p className="mb-4 text-xs text-muted-foreground">Last 12 months</p>
          <TrainingHeatmap dates={sessionDates} />
        </div>
      )}

      {bodyTargetData.length > 0 && <BodyTargetChart data={bodyTargetData} />}

      {ahData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-1 text-sm font-semibold">Apple Health Training</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Imported from Apple Health — duration, heart rate &amp; calorie trends
          </p>
          <AppleHealthTrainingChart data={ahData} />
        </div>
      )}

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

      <PersonalRecords records={prData} />
    </div>
  );
}
