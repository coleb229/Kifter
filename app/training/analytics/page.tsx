import Link from "next/link";
import { ArrowLeft, BarChart2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getExercisesWithHistory,
  getExerciseHistory,
  getAppleHealthTrainingSessions,
  getMuscleGroupWeeklyVolume,
} from "@/actions/analytics-actions";
import { getSessionDates, getDeloadRecommendation, getPersonalRecords, getBodyTargetDistribution, getVolumeHistory, getPRHistory } from "@/actions/workout-actions";
import { auth } from "@/auth";
import { AnalyticsDashboard } from "@/components/training/analytics-dashboard";
import { AIInsights } from "@/components/training/ai-insights";
import { TrainingHeatmap } from "@/components/training/training-heatmap";
import { DeloadRecommendation } from "@/components/training/deload-recommendation";
import { PersonalRecords } from "@/components/training/personal-records";
import { BodyTargetChart } from "@/components/training/body-target-chart";
import { AppleHealthTrainingChart } from "@/components/training/apple-health-training-chart";
import { VolumeChart } from "@/components/training/volume-chart";
import { PRHistoryTimeline } from "@/components/training/pr-history-timeline";
import { PrHeatmap } from "@/components/training/pr-heatmap";
import { MuscleHeatmap } from "@/components/training/muscle-heatmap";

export default async function AnalyticsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  const [exercisesResult, sessionDatesResult, deloadResult, prResult, bodyTargetResult, ahResult, volumeResult, prHistoryResult, muscleVolumeResult] = await Promise.all([
    getExercisesWithHistory(),
    getSessionDates(365),
    getDeloadRecommendation(),
    getPersonalRecords(),
    getBodyTargetDistribution(),
    getAppleHealthTrainingSessions(),
    getVolumeHistory(30),
    getPRHistory(),
    getMuscleGroupWeeklyVolume(),
  ]);
  const exercises = exercisesResult.success ? exercisesResult.data : [];
  const sessionDates = sessionDatesResult.success ? sessionDatesResult.data : [];
  const deloadData = deloadResult.success ? deloadResult.data : null;
  const prData = prResult.success ? prResult.data : [];
  const bodyTargetData = bodyTargetResult.success ? bodyTargetResult.data : [];
  const ahData = ahResult.success ? ahResult.data : [];
  const volumeData = volumeResult.success ? volumeResult.data : [];
  const prHistoryData = prHistoryResult.success ? prHistoryResult.data : [];
  const muscleVolumeData = muscleVolumeResult.success ? muscleVolumeResult.data : [];

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
        Training
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/40">
          <BarChart2 className="size-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your progress over time
          </p>
        </div>
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

      {volumeData.length > 0 && <VolumeChart initialData={volumeData} />}

      {ahData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-1 text-sm font-semibold">Apple Health Training</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Imported from Apple Health — duration, heart rate &amp; calorie trends
          </p>
          <AppleHealthTrainingChart data={ahData} />
        </div>
      )}

      {/* Exercise Analysis */}
      {exercises.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="No data yet"
          description="Log some workouts to see your progress here."
        />
      ) : (
        <details className="group" open>
          <summary className="flex cursor-pointer items-center gap-2 text-base font-semibold select-none list-none [&::-webkit-details-marker]:hidden">
            <svg className="size-4 text-muted-foreground transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
            Exercise Analysis
          </summary>
          <div className="mt-4 flex flex-col gap-8">
            <AnalyticsDashboard
              exercises={exercises}
              initialExercise={exercises[0]}
              initialData={initialData ?? []}
            />
            {isAdmin && <AIInsights />}
            <MuscleHeatmap data={muscleVolumeData} />
          </div>
        </details>
      )}

      {/* Records & PRs */}
      <details className="group" open>
        <summary className="flex cursor-pointer items-center gap-2 text-base font-semibold select-none list-none [&::-webkit-details-marker]:hidden">
          <svg className="size-4 text-muted-foreground transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          Records &amp; PRs
        </summary>
        <div className="mt-4 flex flex-col gap-8">
          <PersonalRecords records={prData} />
          {prHistoryData.length > 0 && <PrHeatmap prHistory={prHistoryData} />}
          {prHistoryData.length > 0 && <PRHistoryTimeline initialData={prHistoryData} />}
        </div>
      </details>
    </div>
  );
}
