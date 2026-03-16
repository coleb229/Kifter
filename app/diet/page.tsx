export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Utensils, Pill } from "lucide-react";
import { QuickLogFAB } from "@/components/quick-log-fab";
import { format } from "date-fns";
import { auth } from "@/auth";
import { getDietEntries, getMacroTargets, getDietHistory } from "@/actions/diet-actions";
import { getWorkoutSessions } from "@/actions/workout-actions";
import { getBodyWeightHistory } from "@/actions/body-weight-actions";
import { toKg } from "@/lib/weight";
import { DietLogView } from "@/components/diet/diet-log-view";
import { NutritionAIInsights } from "@/components/diet/nutrition-ai-insights";
import { GroceryList } from "@/components/diet/grocery-list";
import { Button } from "@/components/ui/button";

export default async function DietPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const today = format(new Date(), "yyyy-MM-dd");

  const [entriesResult, targetsResult, historyResult, sessionsResult, bwResult] = await Promise.all([
    getDietEntries(today),
    getMacroTargets(),
    getDietHistory(7),
    getWorkoutSessions(20),
    getBodyWeightHistory(),
  ]);

  const entries = entriesResult.success ? entriesResult.data : [];
  const targets = targetsResult.success ? targetsResult.data : null;
  const history = historyResult.success ? historyResult.data : [];

  const todaySessions = (sessionsResult.success ? sessionsResult.data : [])
    .filter((s) => s.date.startsWith(today))
    .map((s) => ({ bodyTarget: s.bodyTarget, durationMinutes: s.appleHealth?.duration }));

  const bwEntries = bwResult.success ? bwResult.data : [];
  const latestBw = bwEntries.at(-1);
  const bodyWeightKg = latestBw ? toKg(latestBw.weight, latestBw.weightUnit) : 70;

  const todayKcal = entries.reduce((sum, e) => sum + e.calories, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
            <Utensils className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Diet</h1>
            <p className="text-sm text-muted-foreground">
              {todayKcal > 0 ? `${todayKcal} kcal logged today` : "No food logged today"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" render={<Link href="/diet/report" />}>
            Report
          </Button>
          <Button size="sm" variant="outline" render={<Link href="/diet/supplements" />}>
            <Pill className="size-4" />
            Supplements
          </Button>
        </div>
      </div>

      <DietLogView
        initialEntries={entries}
        initialTargets={targets}
        initialHistory={history}
        initialDate={today}
        initialTodaySessions={todaySessions}
        initialBodyWeightKg={bodyWeightKg}
      />

      {isAdmin && <NutritionAIInsights />}
      <GroceryList targets={targets} />
      <QuickLogFAB targetId="add-food-section" label="Add Food" />
    </div>
  );
}
