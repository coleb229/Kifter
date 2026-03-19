"use client";

import { useMemo } from "react";
import { subDays, parseISO, format } from "date-fns";
import type { CardioSession } from "@/types";

interface Props {
  sessions: CardioSession[];
}

function getZone(acwr: number): { label: string; color: string; bg: string; description: string } {
  if (acwr < 0.8) return { label: "Under-trained", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950/40", description: "Load is low relative to your baseline — consider increasing training." };
  if (acwr <= 1.3) return { label: "Optimal", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950/40", description: "Workload is well-balanced. This is the sweet spot for fitness gains." };
  if (acwr <= 1.5) return { label: "Caution", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950/40", description: "Acute load is elevated. Monitor for early fatigue or soreness." };
  return { label: "High Risk", color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-950/40", description: "Workload spike detected. Consider a recovery day to avoid overtraining." };
}

export function CardioLoadScore({ sessions }: Props) {
  const { acwr, acuteLoad, chronicLoad, zone, recentSessions } = useMemo(() => {
    const now = new Date();
    const day7 = subDays(now, 7);
    const day28 = subDays(now, 28);

    // Use duration as the load metric (minutes)
    const recent = sessions.filter((s) => parseISO(s.date) >= day28);

    const acute = sessions
      .filter((s) => parseISO(s.date) >= day7)
      .reduce((sum, s) => sum + s.duration, 0);

    const chronic =
      recent.length > 0
        ? recent.reduce((sum, s) => sum + s.duration, 0) / 4 // 28-day average ÷ 4 weeks
        : 0;

    const ratio = chronic > 0 ? acute / chronic : 0;

    const last7sessions = sessions
      .filter((s) => parseISO(s.date) >= day7)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    return {
      acwr: ratio,
      acuteLoad: acute,
      chronicLoad: chronic,
      zone: getZone(ratio),
      recentSessions: last7sessions,
    };
  }, [sessions]);

  if (sessions.length < 4) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Log at least 4 cardio sessions over 28 days to see your load score.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Score display */}
      <div className="flex items-start gap-4">
        <div className={`flex flex-col items-center justify-center rounded-xl p-4 min-w-[100px] ${zone.bg}`}>
          <span className={`text-4xl font-bold tabular-nums ${zone.color}`}>
            {acwr.toFixed(2)}
          </span>
          <span className={`mt-1 text-xs font-semibold ${zone.color}`}>{zone.label}</span>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <p className="text-sm text-muted-foreground">{zone.description}</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">{Math.round(acuteLoad)} min</span>
              {" "}acute (7d)
            </span>
            <span>
              <span className="font-medium text-foreground">{Math.round(chronicLoad)} min</span>
              {" "}chronic/week (28d avg)
            </span>
          </div>
        </div>
      </div>

      {/* ACWR scale bar */}
      <div className="flex flex-col gap-1">
        <div className="relative h-3 w-full rounded-full overflow-hidden">
          <div className="absolute inset-0 flex">
            <div className="h-full bg-blue-200 dark:bg-blue-900" style={{ width: "40%" }} />
            <div className="h-full bg-emerald-200 dark:bg-emerald-900" style={{ width: "25%" }} />
            <div className="h-full bg-amber-200 dark:bg-amber-900" style={{ width: "10%" }} />
            <div className="h-full bg-red-200 dark:bg-red-900" style={{ width: "25%" }} />
          </div>
          {/* Needle */}
          <div
            className="absolute top-0 h-full w-1 rounded-full bg-foreground shadow"
            style={{ left: `${Math.min(Math.max((acwr / 2) * 100, 2), 98)}%`, transform: "translateX(-50%)" }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0.8 Under</span>
          <span>0.8–1.3 Optimal</span>
          <span>1.3–1.5 Caution</span>
          <span>1.5+ Risk</span>
        </div>
      </div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Last 7 days</p>
          <div className="flex flex-col gap-1">
            {recentSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs">
                <span className="font-medium">{s.activityType}</span>
                <span className="text-muted-foreground">{format(parseISO(s.date), "MMM d")} · {s.duration} min</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
