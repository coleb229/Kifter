"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { format, subDays, startOfWeek, eachWeekOfInterval, getDay } from "date-fns";

interface Props {
  dates: string[]; // "YYYY-MM-DD" array
}

const INTENSITY_CLASSES = [
  "bg-muted dark:bg-muted/60",                           // 0
  "bg-indigo-200 dark:bg-indigo-900/60",                 // 1
  "bg-indigo-400 dark:bg-indigo-700",                    // 2–3
  "bg-indigo-600 dark:bg-indigo-500",                    // 4+
] as const;

function intensityIndex(count: number): 0 | 1 | 2 | 3 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  return 3;
}

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export function TrainingHeatmap({ dates }: Props) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const { countMap, weeks, monthPositions } = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const d of dates) {
      countMap.set(d, (countMap.get(d) ?? 0) + 1);
    }

    const today = new Date();
    const start = subDays(today, 364);
    const weekStart = startOfWeek(start, { weekStartsOn: 0 }); // Sunday

    const weekStarts = eachWeekOfInterval({ start: weekStart, end: today }, { weekStartsOn: 0 });

    const weeks: (string | null)[][] = weekStarts.map((ws) =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(ws);
        d.setDate(d.getDate() + i);
        const key = format(d, "yyyy-MM-dd");
        // Only include dates within our range
        if (d < start || d > today) return null;
        return key;
      })
    );

    // Build month label positions (column index where each month first appears)
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

    return { countMap, weeks, monthPositions };
  }, [dates]);

  const totalSessions = dates.length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {totalSessions} workout{totalSessions !== 1 ? "s" : ""} in the last year
        </p>
        {/* Legend */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Less</span>
          {INTENSITY_CLASSES.map((cls, i) => (
            <div key={i} className={`size-3 rounded-sm ${cls}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div ref={scrollRef} role="img" aria-label="Training frequency heatmap, last 12 months" className="overflow-x-auto pb-1">
        <div style={{ minWidth: "max-content" }}>
          {/* Month labels */}
          <div className="mb-1 flex pl-7">
            {weeks.map((_, col) => {
              const mp = monthPositions.find((m) => m.col === col);
              return (
                <div key={col} className="w-[14px] shrink-0">
                  {mp ? (
                    <span className="text-[10px] text-muted-foreground">{mp.label}</span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Grid with weekday labels */}
          <div className="flex gap-0">
            {/* Weekday labels column */}
            <div className="mr-1 flex flex-col">
              {WEEKDAY_LABELS.map((label, i) => (
                <div key={i} className="flex h-[14px] items-center">
                  <span className="w-6 text-right text-[9px] leading-none text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, col) => (
              <div key={col} className="flex flex-col gap-[2px] mr-[2px]">
                {week.map((dateKey, row) => {
                  if (!dateKey) {
                    return <div key={row} className="size-[12px]" />;
                  }
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

      {/* Tooltip */}
      {tooltip && (
        <p className="mt-2 text-xs text-muted-foreground">
          {tooltip.count > 0
            ? `${tooltip.count} workout${tooltip.count !== 1 ? "s" : ""} on ${format(new Date(tooltip.date + "T00:00:00"), "MMM d, yyyy")}`
            : `No workouts on ${format(new Date(tooltip.date + "T00:00:00"), "MMM d, yyyy")}`}
        </p>
      )}
    </div>
  );
}
