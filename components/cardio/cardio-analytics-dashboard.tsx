"use client";

import { Activity, Clock, Footprints, Flame } from "lucide-react";
import { CardioAnalyticsChart } from "@/components/cardio/cardio-analytics-chart";
import type { CardioSession, CardioActivity } from "@/types";

function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface Props {
  sessions: CardioSession[];
}

export function CardioAnalyticsDashboard({ sessions }: Props) {
  const totalSessions = sessions.length;

  const totalMinutes = sessions.reduce((s, e) => s + e.duration, 0);

  const totalDistanceKm = sessions.reduce((s, e) => {
    if (e.distance === undefined) return s;
    return s + (e.distanceUnit === "mi" ? e.distance * 1.60934 : e.distance);
  }, 0);

  const totalCalories = sessions.reduce((s, e) => s + (e.caloriesBurned ?? 0), 0);

  const avgDuration = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

  // Activity breakdown
  const activityCounts = new Map<CardioActivity, number>();
  for (const s of sessions) {
    activityCounts.set(s.activityType, (activityCounts.get(s.activityType) ?? 0) + 1);
  }
  const activityBreakdown = Array.from(activityCounts.entries())
    .sort((a, b) => b[1] - a[1]);

  const stats = [
    {
      label: "Total Sessions",
      value: totalSessions,
      suffix: "",
      icon: Activity,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-100 dark:bg-sky-950/40",
    },
    {
      label: "Total Time",
      value: formatDuration(totalMinutes),
      suffix: "",
      icon: Clock,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-100 dark:bg-indigo-950/40",
    },
    {
      label: "Total Distance",
      value: totalDistanceKm > 0 ? `${totalDistanceKm.toFixed(1)} km` : "—",
      suffix: "",
      icon: Footprints,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-950/40",
    },
    {
      label: "Calories Burned",
      value: totalCalories > 0 ? totalCalories.toLocaleString() : "—",
      suffix: totalCalories > 0 ? "kcal total" : "",
      icon: Flame,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-950/40",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value, suffix, icon: Icon, color, bg }, i) => (
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

      {/* Activity breakdown */}
      {activityBreakdown.length > 0 && (
        <div
          className="rounded-xl border border-border bg-card p-5 animate-fade-up"
          style={{ animationDelay: "240ms" }}
        >
          <h3 className="mb-3 text-sm font-semibold">Activity Breakdown</h3>
          <div className="flex flex-wrap gap-2">
            {activityBreakdown.map(([activity, count]) => (
              <span
                key={activity}
                className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium"
              >
                {activity}
                <span className="rounded-full bg-sky-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {count}
                </span>
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Avg session: {formatDuration(avgDuration)}
          </p>
        </div>
      )}

      {/* Chart */}
      <div
        className="animate-fade-up"
        style={{ animationDelay: "320ms" }}
      >
        <CardioAnalyticsChart sessions={sessions} />
      </div>
    </div>
  );
}
