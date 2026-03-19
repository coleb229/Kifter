"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import type { WorkoutSession } from "@/types";
import { BODY_TARGET_STYLES } from "@/lib/label-colors";

interface Props {
  sessions: WorkoutSession[];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeeklyPlanStrip({ sessions }: Props) {
  // Use a client-side date string to avoid SSR/timezone mismatch where the
  // server (UTC) and the user's browser are in different calendar days.
  const [todayStr, setTodayStr] = useState("");
  useEffect(() => {
    const now = new Date();
    setTodayStr(format(now, "yyyy-MM-dd"));
  }, []);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Group sessions by date
  const sessionsByDate = new Map<string, WorkoutSession[]>();
  for (const s of sessions) {
    const key = s.date.slice(0, 10);
    if (!sessionsByDate.has(key)) sessionsByDate.set(key, []);
    sessionsByDate.get(key)!.push(s);
  }

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-4 animate-fade-up">
      <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        This Week
      </p>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const key = format(day, "yyyy-MM-dd");
          const daySessions = sessionsByDate.get(key) ?? [];
          const today = todayStr !== "" && key === todayStr;
          const isPast = todayStr !== "" && key < todayStr;

          return (
            <div
              key={key}
              className={`flex flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-center ${
                today ? "bg-primary/10 ring-1 ring-primary/30" : ""
              }`}
            >
              <span className={`text-[10px] font-medium ${today ? "text-primary" : "text-muted-foreground"}`}>
                {DAY_LABELS[i]}
              </span>
              <span className={`text-xs font-semibold ${today ? "text-primary" : isPast ? "text-muted-foreground/60" : "text-foreground"}`}>
                {format(day, "d")}
              </span>

              {daySessions.length > 0 ? (
                <div className="flex flex-col gap-0.5 items-center">
                  {daySessions.slice(0, 2).map((s) => (
                    <span
                      key={s.id}
                      title={s.bodyTarget}
                      className={`inline-block size-2 rounded-full ${BODY_TARGET_STYLES[s.bodyTarget].dot}`}
                    />
                  ))}
                  {daySessions.length > 2 && (
                    <span className="text-[9px] text-muted-foreground">+{daySessions.length - 2}</span>
                  )}
                </div>
              ) : (
                <span className="size-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend: unique body targets trained this week */}
      {(() => {
        const thisWeekSessions = days.flatMap((day) => sessionsByDate.get(format(day, "yyyy-MM-dd")) ?? []);
        const targets = [...new Set(thisWeekSessions.map((s) => s.bodyTarget))];
        if (targets.length === 0) return (
          <p className="mt-3 text-center text-xs text-muted-foreground">No sessions logged this week</p>
        );
        return (
          <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
            {targets.map((t) => (
              <span key={t} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BODY_TARGET_STYLES[t].badge}`}>
                {t}
              </span>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
