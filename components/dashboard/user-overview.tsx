import Link from "next/link";
import { format, subDays, parseISO } from "date-fns";
import { Dumbbell, Flame, TrendingUp, Calendar, Plus, Utensils } from "lucide-react";
import { getWorkoutSessions } from "@/actions/workout-actions";
import { getDietEntries, getMacroTargets, getDietHistory } from "@/actions/diet-actions";
import { TrainingWeekChart } from "@/components/dashboard/training-week-chart";
import { MacroWeekChart } from "@/components/dashboard/macro-week-chart";
import { Button } from "@/components/ui/button";

export async function UserOverview() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [sessionsResult, dietResult, targetsResult, historyResult] = await Promise.all([
    getWorkoutSessions(30),
    getDietEntries(today),
    getMacroTargets(),
    getDietHistory(7),
  ]);

  const sessions = sessionsResult.success ? sessionsResult.data : [];
  const dietEntries = dietResult.success ? dietResult.data : [];
  const targets = targetsResult.success ? targetsResult.data : null;
  const dietHistory = historyResult.success ? historyResult.data : [];

  // Build last-7-days date keys
  const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), "yyyy-MM-dd"));

  // Training: sessions per day last 7 days
  const sessionsByDay = new Map<string, number>();
  for (const s of sessions) {
    const key = format(parseISO(s.date), "yyyy-MM-dd");
    if (last7.includes(key)) {
      sessionsByDay.set(key, (sessionsByDay.get(key) ?? 0) + 1);
    }
  }

  const trainingChartData = last7.map((d) => ({
    day: format(parseISO(d), "EEE"),
    sessions: sessionsByDay.get(d) ?? 0,
  }));

  // Macro chart data
  const macroChartData = dietHistory.map((d) => ({
    day: format(parseISO(d.date), "EEE"),
    protein: Math.round(d.protein),
    carbs: Math.round(d.carbs),
    fat: Math.round(d.fat),
    calories: Math.round(d.calories),
    target: targets?.calories ?? 0,
  }));

  // Stats
  const workoutsThisWeek = last7.reduce((sum, d) => sum + (sessionsByDay.get(d) ?? 0), 0);
  const todayKcal = dietEntries.reduce((s, e) => s + e.calories, 0);
  const todayProtein = dietEntries.reduce((s, e) => s + e.protein, 0);

  // Streak: consecutive days with at least one session going back from today
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const key = format(subDays(new Date(), i), "yyyy-MM-dd");
    const hasSessions = sessions.some((s) => format(parseISO(s.date), "yyyy-MM-dd") === key);
    if (!hasSessions) break;
    streak++;
  }

  const recentSessions = sessions.slice(0, 3);

  const weekStart = format(subDays(new Date(), 6), "MMM d");
  const weekEnd = format(new Date(), "MMM d");

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Section header */}
      <div className="mb-6 animate-fade-up">
        <h2 className="text-2xl font-bold tracking-tight">Your Week</h2>
        <p className="mt-1 text-sm text-muted-foreground">{weekStart} – {weekEnd}</p>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Workouts",
            value: workoutsThisWeek,
            suffix: "this week",
            icon: Dumbbell,
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-100 dark:bg-indigo-950/40",
          },
          {
            label: "Kcal Today",
            value: todayKcal > 0 ? todayKcal.toLocaleString() : "—",
            suffix: targets?.calories ? `/ ${targets.calories.toLocaleString()}` : "",
            icon: Flame,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-100 dark:bg-amber-950/40",
          },
          {
            label: "Protein Today",
            value: todayProtein > 0 ? `${Math.round(todayProtein)}g` : "—",
            suffix: targets?.protein ? `/ ${targets.protein}g` : "",
            icon: TrendingUp,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-100 dark:bg-emerald-950/40",
          },
          {
            label: "Streak",
            value: streak,
            suffix: streak === 1 ? "day" : "days",
            icon: Calendar,
            color: "text-violet-600 dark:text-violet-400",
            bg: "bg-violet-100 dark:bg-violet-950/40",
          },
        ].map(({ label, value, suffix, icon: Icon, color, bg }, i) => (
          <div
            key={label}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`size-4 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-bold leading-tight">{value}</p>
              {suffix && <p className="text-xs text-muted-foreground">{suffix}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 animate-fade-up" style={{ animationDelay: "240ms" }}>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-1 flex items-center gap-2">
            <Dumbbell className="size-4 text-indigo-500" />
            <h3 className="text-sm font-semibold">Training</h3>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">Workouts per day</p>
          <TrainingWeekChart data={trainingChartData} />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-1 flex items-center gap-2">
            <Utensils className="size-4 text-amber-500" />
            <h3 className="text-sm font-semibold">Nutrition</h3>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">Daily macros</p>
          <MacroWeekChart data={macroChartData} />
        </div>
      </div>

      {/* Recent workouts + Quick actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-fade-up" style={{ animationDelay: "320ms" }}>
        {/* Recent sessions */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent Workouts</h3>
            <Link href="/training" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              View all
            </Link>
          </div>
          {recentSessions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No workouts logged yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/training/${s.id}`}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-2.5">
                    <Dumbbell className="size-3.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium">
                        {s.name ?? format(parseISO(s.date), "EEE, MMM d")}
                      </p>
                      {s.exerciseNames && s.exerciseNames.length > 0 && (
                        <p className="text-[10px] text-muted-foreground truncate max-w-40">
                          {s.exerciseNames.join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium shrink-0">
                    {s.bodyTarget}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold">Quick Actions</h3>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              render={<Link href="/training/new" />}
            >
              <Plus className="size-4 text-indigo-500" />
              Log Workout
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              render={<Link href="/diet" />}
            >
              <Utensils className="size-4 text-amber-500" />
              Log Food
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              render={<Link href="/training/analytics" />}
            >
              <TrendingUp className="size-4 text-emerald-500" />
              View Analytics
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
