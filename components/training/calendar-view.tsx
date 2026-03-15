"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import type { WorkoutSession } from "@/types";
import { BODY_TARGET_STYLES } from "@/lib/label-colors";

interface Props {
  sessions: WorkoutSession[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ sessions }: Props) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const sessionsByDate = new Map<string, WorkoutSession[]>();
  for (const s of sessions) {
    const key = s.date.slice(0, 10);
    if (!sessionsByDate.has(key)) sessionsByDate.set(key, []);
    sessionsByDate.get(key)!.push(s);
  }

  const selectedSessions = selected
    ? (sessionsByDate.get(format(selected, "yyyy-MM-dd")) ?? [])
    : [];

  function prevMonth() {
    setCursor((d) => startOfMonth(new Date(d.getFullYear(), d.getMonth() - 1, 1)));
    setSelected(null);
  }
  function nextMonth() {
    setCursor((d) => startOfMonth(new Date(d.getFullYear(), d.getMonth() + 1, 1)));
    setSelected(null);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Month header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">{format(cursor, "MMMM yyyy")}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const daySessions = sessionsByDate.get(key) ?? [];
          const hasSessions = daySessions.length > 0;
          const isSelected = selected ? isSameDay(day, selected) : false;
          const today = isToday(day);
          const isHovered = hoveredKey === key;

          return (
            <div
              key={key}
              className="relative"
              onMouseEnter={() => hasSessions && !isSelected && setHoveredKey(key)}
              onMouseLeave={() => setHoveredKey(null)}
            >
              <button
                type="button"
                onClick={() => setSelected(isSelected ? null : day)}
                className={`relative flex w-full flex-col items-center gap-0.5 rounded-lg py-2 text-sm transition-colors ${
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : today
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                    : hasSessions
                    ? "hover:bg-muted cursor-pointer"
                    : "text-muted-foreground cursor-default"
                }`}
                disabled={!hasSessions}
              >
                <span className={`text-xs font-medium ${today && !isSelected ? "font-bold" : ""}`}>
                  {format(day, "d")}
                </span>
                {hasSessions && (
                  <div className="flex gap-0.5">
                    {daySessions.slice(0, 3).map((s, i) => (
                      <span
                        key={i}
                        className={`size-1 rounded-full ${
                          isSelected ? "bg-white/80" : BODY_TARGET_STYLES[s.bodyTarget].dot
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>

              {/* Hover preview — desktop only */}
              {isHovered && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-44 -translate-x-1/2 animate-fade-up rounded-lg border border-border bg-card shadow-lg sm:block">
                  <div className="p-2.5">
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {format(day, "EEE, MMM d")}
                    </p>
                    {daySessions.slice(0, 3).map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-2 py-0.5">
                        <p className="truncate text-xs font-medium">
                          {s.name ?? s.bodyTarget}
                        </p>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${BODY_TARGET_STYLES[s.bodyTarget].badge}`}>
                          {s.bodyTarget}
                        </span>
                      </div>
                    ))}
                    {daySessions.length > 3 && (
                      <p className="mt-1 text-[10px] text-muted-foreground">+{daySessions.length - 3} more</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selected && selectedSessions.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {format(selected, "EEEE, MMMM d")}
          </p>
          <div className="flex flex-col gap-2">
            {selectedSessions.map((s) => (
              <a
                key={s.id}
                href={`/training/${s.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-2.5">
                  <Dumbbell className="size-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{s.name ?? format(new Date(s.date.slice(0, 10) + "T00:00:00"), "EEEE, MMM d")}</p>
                    {s.exerciseNames && s.exerciseNames.length > 0 && (
                      <p className="text-xs text-muted-foreground truncate max-w-64">
                        {s.exerciseNames.join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BODY_TARGET_STYLES[s.bodyTarget].badge}`}>
                    {s.bodyTarget}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {s.setCount} set{s.setCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
