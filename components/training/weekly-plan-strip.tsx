"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
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
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const now = new Date();
    setTodayStr(format(now, "yyyy-MM-dd"));
  }, []);

  // Auto-dismiss popover after 3 seconds
  useEffect(() => {
    if (activeDay) {
      dismissTimer.current = setTimeout(() => setActiveDay(null), 3000);
      return () => {
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
      };
    }
  }, [activeDay]);

  // Dismiss on outside click
  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
      setActiveDay(null);
    }
  }, []);

  useEffect(() => {
    if (activeDay) {
      document.addEventListener("click", handleOutsideClick, true);
      return () => document.removeEventListener("click", handleOutsideClick, true);
    }
  }, [activeDay, handleOutsideClick]);

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
    <div className="mb-6 rounded-xl border border-border bg-card p-5 animate-fade-up">
      <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        This Week
      </p>
      <div role="grid" aria-label="Weekly training plan" className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const key = format(day, "yyyy-MM-dd");
          const daySessions = sessionsByDate.get(key) ?? [];
          const today = todayStr !== "" && key === todayStr;
          const isPast = todayStr !== "" && key < todayStr;
          const hasSessions = daySessions.length > 0;
          const isActive = activeDay === key;

          return (
            <div key={key} className="relative">
              {hasSessions ? (
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDay(isActive ? null : key);
                  }}
                  onMouseEnter={() => {
                    if (window.matchMedia("(hover: hover)").matches) {
                      setActiveDay(key);
                    }
                  }}
                  onMouseLeave={() => {
                    if (window.matchMedia("(hover: hover)").matches) {
                      setActiveDay(null);
                    }
                  }}
                  className={`flex w-full flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-center cursor-pointer transition-colors hover:bg-muted/50 ${
                    today ? "bg-primary/10 ring-1 ring-primary/30" : ""
                  }`}
                >
                  <span className={`text-[10px] font-medium ${today ? "text-primary" : "text-muted-foreground"}`}>
                    {DAY_LABELS[i]}
                  </span>
                  <span className={`text-xs font-semibold ${today ? "text-primary" : isPast ? "text-muted-foreground/60" : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
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
                </button>
              ) : (
                <Link
                  href={`/training/new?date=${key}`}
                  suppressHydrationWarning
                  className={`flex flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-center cursor-pointer transition-colors hover:bg-muted/50 ${
                    today ? "bg-primary/10 ring-1 ring-primary/30" : ""
                  }`}
                >
                  <span className={`text-[10px] font-medium ${today ? "text-primary" : "text-muted-foreground"}`}>
                    {DAY_LABELS[i]}
                  </span>
                  <span className={`text-xs font-semibold ${today ? "text-primary" : isPast ? "text-muted-foreground/60" : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  <span className="size-2" />
                </Link>
              )}

              {/* Day detail popover */}
              {isActive && hasSessions && (
                <div
                  ref={popoverRef}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-20 w-44 rounded-lg border border-border bg-card p-3 shadow-lg animate-fade-up"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col gap-2">
                    {daySessions.map((s) => (
                      <Link
                        key={s.id}
                        href={`/training/${s.id}`}
                        className="flex items-center gap-2 rounded-md px-1.5 py-1 -mx-1.5 hover:bg-muted/50 transition-colors"
                        onClick={() => setActiveDay(null)}
                      >
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${BODY_TARGET_STYLES[s.bodyTarget].badge}`}>
                          {s.bodyTarget}
                        </span>
                        <span className="text-xs text-foreground truncate">
                          {s.name || s.bodyTarget}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
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
