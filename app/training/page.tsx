export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Plus, BookOpen, ChevronRight } from "lucide-react";
import { getWorkoutSessions, getRestDaySuggestions, getProgressiveOverloadSuggestions } from "@/actions/workout-actions";
import { getStreak } from "@/actions/streak-actions";
import { getInjuries } from "@/actions/injury-actions";
import { getPrograms } from "@/actions/program-actions";
import { SessionsView } from "@/components/training/sessions-view";
import { RestDaySuggestions } from "@/components/training/rest-day-suggestions";
import { OverloadSuggestions } from "@/components/training/overload-suggestions";
import { InjuryLog } from "@/components/training/injury-log";
import { StreakBanner } from "@/components/training/streak-banner";
import { StartFromProgramCard } from "@/components/training/start-from-program-card";
import { Button } from "@/components/ui/button";

export default async function TrainingPage() {
  const [result, suggestionsResult, overloadResult, injuriesResult, streakResult, programsResult] = await Promise.all([
    getWorkoutSessions(),
    getRestDaySuggestions(),
    getProgressiveOverloadSuggestions(),
    getInjuries(),
    getStreak(),
    getPrograms(),
  ]);
  const sessions = result.success ? result.data : [];
  const suggestions = suggestionsResult.success ? suggestionsResult.data : [];
  const overloadSuggestions = overloadResult.success ? overloadResult.data : [];
  const injuries = injuriesResult.success ? injuriesResult.data : [];
  const streak = streakResult.success ? streakResult.data : null;
  const programs = programsResult.success ? programsResult.data : [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sessions.length} workout{sessions.length !== 1 ? "s" : ""} logged
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button size="sm" render={<Link href="/training/new" />}>
            <Plus className="size-4" />
            Log Workout
          </Button>
        </div>
      </div>

      {streak && <StreakBanner streak={streak} />}
      {suggestions.length > 0 && <RestDaySuggestions suggestions={suggestions} />}
      {overloadSuggestions.length > 0 && <OverloadSuggestions suggestions={overloadSuggestions} />}
      <InjuryLog injuries={injuries} />

      <StartFromProgramCard programs={programs} />

      {/* Guides promo card */}
      <Link
        href="/training/guides"
        className="group mb-6 flex items-center gap-4 overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fade-up"
        style={{ animationDelay: "100ms" }}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600">
          <BookOpen className="size-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Guides & Resources</p>
          <p className="text-xs text-muted-foreground">
            36 guides on technique, programming, nutrition, and recovery
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No workouts logged yet.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            render={<Link href="/training/new" />}
          >
            Log your first workout
          </Button>
        </div>
      ) : (
        <SessionsView sessions={sessions} />
      )}
    </div>
  );
}
