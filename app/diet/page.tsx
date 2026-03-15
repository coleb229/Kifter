export const dynamic = 'force-dynamic';

import { Utensils } from "lucide-react";
import { format } from "date-fns";
import { getDietEntries, getMacroTargets, getDietHistory } from "@/actions/diet-actions";
import { DietLogView } from "@/components/diet/diet-log-view";

export default async function DietPage() {
  const today = format(new Date(), "yyyy-MM-dd");

  const [entriesResult, targetsResult, historyResult] = await Promise.all([
    getDietEntries(today),
    getMacroTargets(),
    getDietHistory(7),
  ]);

  const entries = entriesResult.success ? entriesResult.data : [];
  const targets = targetsResult.success ? targetsResult.data : null;
  const history = historyResult.success ? historyResult.data : [];

  const todayKcal = entries.reduce((sum, e) => sum + e.calories, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3 animate-fade-up">
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

      <DietLogView
        initialEntries={entries}
        initialTargets={targets}
        initialHistory={history}
        initialDate={today}
      />
    </div>
  );
}
