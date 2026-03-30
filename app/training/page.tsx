export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Plus } from "lucide-react";
import { getWorkoutSessions, getRestDaySuggestions, getProgressiveOverloadSuggestions, getExerciseTags } from "@/actions/workout-actions";
import { getStreak } from "@/actions/streak-actions";
import { getInjuries } from "@/actions/injury-actions";
import { getPrograms } from "@/actions/program-actions";
import { SessionsView } from "@/components/training/sessions-view";
import { RestDaySuggestions } from "@/components/training/rest-day-suggestions";
import { OverloadSuggestions } from "@/components/training/overload-suggestions";
import { InjuryLog } from "@/components/training/injury-log";
import { StreakBanner } from "@/components/training/streak-banner";
import { StartFromProgramCard } from "@/components/training/start-from-program-card";
import { WeeklyPlanStrip } from "@/components/training/weekly-plan-strip";
import { Button } from "@/components/ui/button";
import { OnboardingTip } from "@/components/ui/onboarding-tip";
import { EmptyState } from "@/components/ui/empty-state";
import { Dumbbell } from "lucide-react";

export default async function TrainingPage() {
  const [result, suggestionsResult, overloadResult, injuriesResult, streakResult, programsResult, tagsResult] = await Promise.all([
    getWorkoutSessions(),
    getRestDaySuggestions(),
    getProgressiveOverloadSuggestions(),
    getInjuries(),
    getStreak(),
    getPrograms(),
    getExerciseTags(),
  ]);
  const sessions = result.success ? result.data : [];
  const suggestions = suggestionsResult.success ? suggestionsResult.data : [];
  const overloadSuggestions = overloadResult.success ? overloadResult.data : [];
  const injuries = injuriesResult.success ? injuriesResult.data : [];
  const streak = streakResult.success ? streakResult.data : null;
  const programs = programsResult.success ? programsResult.data : [];
  const tagsMap = tagsResult.success ? tagsResult.data : {};

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sessions.length} workout{sessions.length !== 1 ? "s" : ""} logged
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center">
          <Button size="sm" className="w-full sm:w-auto" render={<Link href="/training/new" />}>
            <Plus className="size-4" />
            Log Workout
          </Button>
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <Button size="sm" variant="outline" render={<Link href="/training/analytics" />}>
              Analytics
            </Button>
            <Button size="sm" variant="outline" render={<Link href="/training/exercises" />}>
              Exercises
            </Button>
            <Button size="sm" variant="outline" render={<Link href="/training/programs" />}>
              Programs
            </Button>
            <Button size="sm" variant="outline" render={<Link href="/training/1rm" />}>
              1RM
            </Button>
            <Button size="sm" variant="outline" render={<Link href="/training/report" />}>
              Report
            </Button>
          </div>
        </div>
      </div>

      {sessions.length < 3 && (
        <OnboardingTip
          tipKey="training-start"
          title="Get started with your first workout"
          description="Tap &quot;Log Workout&quot; to create a session. Add exercises, track sets with weight and reps, and watch your progress build over time."
          className="mb-6"
        />
      )}
      {streak && <StreakBanner streak={streak} />}
      <WeeklyPlanStrip sessions={sessions} />
      {suggestions.length > 0 && <RestDaySuggestions suggestions={suggestions} />}
      {overloadSuggestions.length > 0 && <OverloadSuggestions suggestions={overloadSuggestions} />}
      <InjuryLog injuries={injuries} />

      <StartFromProgramCard programs={programs} />


      {sessions.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No workouts logged yet"
          description="Start tracking your progress by logging your first workout."
          action={
            <Button variant="outline" size="sm" render={<Link href="/training/new" />}>
              Log your first workout
            </Button>
          }
        />
      ) : (
        <SessionsView sessions={sessions} tagsMap={tagsMap} />
      )}
    </div>
  );
}
