"use client";

import { useState, useTransition } from "react";
import { DietHistoryChart } from "@/components/diet/diet-history-chart";
import { YearPicker } from "@/components/ui/year-picker";
import { MACRO_COLORS } from "@/lib/label-colors";
import { getDietMonthlyHistory } from "@/actions/diet-actions";
import type { DietDaySummary, MacroTarget } from "@/types";

interface Props {
  history: DietDaySummary[];
  targets: MacroTarget | null;
  dietYears: number[];
}

export function DietHistoryView({ history, targets, dietYears }: Props) {
  const [selectedHistoryYear, setSelectedHistoryYear] = useState<number | null>(null);
  const [yearlyHistory, setYearlyHistory] = useState<DietDaySummary[]>([]);
  const [, startYearTransition] = useTransition();

  // Weekly stats
  const activeDaysWeekly = history.filter((d) => d.entryCount > 0);
  const weeklyAvgKcal = activeDaysWeekly.length > 0
    ? Math.round(activeDaysWeekly.reduce((s, d) => s + d.calories, 0) / activeDaysWeekly.length)
    : 0;
  const weeklyAvgProtein = activeDaysWeekly.length > 0
    ? Math.round(activeDaysWeekly.reduce((s, d) => s + d.protein, 0) / activeDaysWeekly.length)
    : 0;
  const adherenceDays = targets?.calories
    ? history.filter((d) => d.calories >= targets.calories * 0.85 && d.calories <= targets.calories * 1.15).length
    : 0;

  function handleHistoryYearChange(year: number) {
    setSelectedHistoryYear(year);
    startYearTransition(async () => {
      const result = await getDietMonthlyHistory(year);
      if (result.success) setYearlyHistory(result.data);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {dietYears.length > 1 && (
        <div className="animate-fade-up">
          <YearPicker
            years={dietYears}
            selectedYear={selectedHistoryYear ?? new Date().getFullYear()}
            onChange={handleHistoryYearChange}
          />
        </div>
      )}

      {selectedHistoryYear !== null ? (
        <>
          <div className="rounded-xl border border-border bg-card p-5 animate-fade-up">
            <h2 className="mb-1 text-sm font-semibold">{selectedHistoryYear} Overview</h2>
            <p className="mb-4 text-xs text-muted-foreground">Avg daily macros per month</p>
            <DietHistoryChart history={yearlyHistory} targets={targets} mode="monthly" />
          </div>

          {(() => {
            const activeDays = yearlyHistory.filter((d) => d.entryCount > 0);
            const annualAvgKcal = activeDays.length > 0
              ? Math.round(activeDays.reduce((s, d) => s + d.calories, 0) / activeDays.length)
              : 0;
            const annualAvgProtein = activeDays.length > 0
              ? Math.round(activeDays.reduce((s, d) => s + d.protein, 0) / activeDays.length)
              : 0;
            const annualAdherence = targets?.calories
              ? activeDays.filter((d) => d.calories >= targets.calories * 0.85 && d.calories <= targets.calories * 1.15).length
              : 0;
            return (
              <StatsGrid
                avgKcal={annualAvgKcal}
                avgProtein={annualAvgProtein}
                adherenceCount={annualAdherence}
                totalCount={activeDays.length}
                adherenceLabel="months (±15%)"
                targets={targets}
              />
            );
          })()}
        </>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-5 animate-fade-up">
            <h2 className="mb-1 text-sm font-semibold">Last 7 Days</h2>
            <p className="mb-4 text-xs text-muted-foreground">Macros stacked by day</p>
            <DietHistoryChart history={history} targets={targets} mode="daily" />
          </div>

          <StatsGrid
            avgKcal={weeklyAvgKcal}
            avgProtein={weeklyAvgProtein}
            adherenceCount={adherenceDays}
            totalCount={7}
            adherenceLabel="days (±15%)"
            targets={targets}
          />
        </>
      )}
    </div>
  );
}

function StatsGrid({ avgKcal, avgProtein, adherenceCount, totalCount, adherenceLabel, targets }: {
  avgKcal: number;
  avgProtein: number;
  adherenceCount: number;
  totalCount: number;
  adherenceLabel: string;
  targets: MacroTarget | null;
}) {
  return (
    <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: "80ms" }}>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground mb-1 truncate">Avg Daily Kcal</p>
        <p className={`text-xl font-bold tabular-nums ${MACRO_COLORS.calories.text}`}>
          {avgKcal > 0 ? avgKcal.toLocaleString() : "—"}
        </p>
        {targets && avgKcal > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">target {targets.calories.toLocaleString()}</p>
        )}
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground mb-1 truncate">Avg Protein</p>
        <p className={`text-xl font-bold tabular-nums ${MACRO_COLORS.protein.text}`}>
          {avgProtein > 0 ? `${avgProtein}g` : "—"}
        </p>
        {targets && avgProtein > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">target {targets.protein}g</p>
        )}
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground mb-1 truncate">On Target</p>
        <p className={`text-xl font-bold tabular-nums ${MACRO_COLORS.carbs.text}`}>
          {targets?.calories ? `${adherenceCount}/${totalCount}` : "—"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{adherenceLabel}</p>
      </div>
    </div>
  );
}
