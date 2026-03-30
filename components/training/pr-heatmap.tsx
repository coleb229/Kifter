"use client";

import { useMemo, useState } from "react";
import { format, subDays, startOfWeek, eachWeekOfInterval, differenceInDays } from "date-fns";
import type { ExercisePRHistory } from "@/actions/workout-actions";

interface Props {
  prHistory: ExercisePRHistory[];
}

const INTENSITY_CLASSES = [
  "bg-muted dark:bg-muted/60",
  "bg-amber-200 dark:bg-amber-900/60",
  "bg-amber-400 dark:bg-amber-700",
  "bg-amber-600 dark:bg-amber-500",
] as const;

function intensityIndex(count: number): 0 | 1 | 2 | 3 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 2) return 2;
  return 3;
}

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export function PrHeatmap({ prHistory }: Props) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number } | null>(null);

  const { prDates, countMap, weeks, monthPositions, stalestExercises } = useMemo(() => {
    // Collect all PR dates and count per day
    const countMap = new Map<string, number>();
    const prDates: string[] = [];

    for (const ex of prHistory) {
      for (const entry of ex.entries) {
        const dateKey = entry.date.slice(0, 10);
        prDates.push(dateKey);
        countMap.set(dateKey, (countMap.get(dateKey) ?? 0) + 1);
      }
    }

    // Build week grid (same as TrainingHeatmap)
    const today = new Date();
    const start = subDays(today, 364);
    const weekStart = startOfWeek(start, { weekStartsOn: 0 });
    const weekStarts = eachWeekOfInterval({ start: weekStart, end: today }, { weekStartsOn: 0 });

    const weeks: (string | null)[][] = weekStarts.map((ws) =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(ws);
        d.setDate(d.getDate() + i);
        if (d < start || d > today) return null;
        return format(d, "yyyy-MM-dd");
      })
    );

    const monthPositions: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, col) => {
      const firstDate = week.find((d) => d !== null);
      if (!firstDate) return;
      const month = parseInt(firstDate.slice(5, 7), 10) - 1;
      if (month !== lastMonth) {
        monthPositions.push({ label: MONTHS[month], col });
        lastMonth = month;
      }
    });

    // Stalest PRs: exercises with the most days since last PR
    const todayStr = format(today, "yyyy-MM-dd");
    const stalestExercises = prHistory
      .map((ex) => {
        const latestEntry = ex.entries[0]; // already newest-first
        const daysSince = latestEntry
          ? differenceInDays(new Date(todayStr), new Date(latestEntry.date.slice(0, 10)))
          : 9999;
        return { exercise: ex.exercise, daysSince, lastDate: latestEntry?.date?.slice(0, 10) ?? null };
      })
      .sort((a, b) => b.daysSince - a.daysSince)
      .slice(0, 10);

    return { prDates, countMap, weeks, monthPositions, stalestExercises };
  }, [prHistory]);

  const totalPRs = prDates.length;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-1 text-base font-semibold">Personal Records Calendar</h2>
      <p className="mb-4 text-xs text-muted-foreground">Days where you set a new PR on any exercise — last 12 months</p>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{totalPRs} PR{totalPRs !== 1 ? "s" : ""} set in the last year</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Less</span>
          {INTENSITY_CLASSES.map((cls, i) => (
            <div key={i} className={`size-3 rounded-sm ${cls}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div style={{ minWidth: "max-content" }}>
          {/* Month labels */}
          <div className="mb-1 flex pl-7">
            {weeks.map((_, col) => {
              const mp = monthPositions.find((m) => m.col === col);
              return (
                <div key={col} className="w-[14px] shrink-0">
                  {mp ? <span className="text-[10px] text-muted-foreground">{mp.label}</span> : null}
                </div>
              );
            })}
          </div>

          <div className="flex gap-0">
            <div className="mr-1 flex flex-col">
              {WEEKDAY_LABELS.map((label, i) => (
                <div key={i} className="flex h-[14px] items-center">
                  <span className="w-6 text-right text-[9px] leading-none text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>

            {weeks.map((week, col) => (
              <div key={col} className="flex flex-col gap-[2px] mr-[2px]">
                {week.map((dateKey, row) => {
                  if (!dateKey) return <div key={row} className="size-[12px]" />;
                  const count = countMap.get(dateKey) ?? 0;
                  const idx = intensityIndex(count);
                  return (
                    <div
                      key={row}
                      className={`size-[12px] rounded-sm ${INTENSITY_CLASSES[idx]} cursor-default transition-opacity hover:opacity-70`}
                      onMouseEnter={() => setTooltip({ date: dateKey, count })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {tooltip && (
        <p className="mt-2 text-xs text-muted-foreground">
          {tooltip.count > 0
            ? `${tooltip.count} PR${tooltip.count !== 1 ? "s" : ""} on ${format(new Date(tooltip.date + "T00:00:00"), "MMM d, yyyy")}`
            : `No PRs on ${format(new Date(tooltip.date + "T00:00:00"), "MMM d, yyyy")}`}
        </p>
      )}

      {/* Stalest PRs sidebar */}
      {stalestExercises.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stalest PRs</p>
          <div className="flex flex-col gap-1.5">
            {stalestExercises.map(({ exercise, daysSince }) => (
              <div key={exercise} className="flex items-center justify-between">
                <span className="text-xs font-medium truncate max-w-[60%]">{exercise}</span>
                <span className={`text-xs ${daysSince > 30 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                  {daysSince === 9999 ? "never" : `${daysSince}d ago`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
