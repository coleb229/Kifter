"use client";

import { useState } from "react";
import { Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { ExercisePRHistory } from "@/actions/workout-actions";

interface Props {
  initialData: ExercisePRHistory[];
}

export function PRHistoryTimeline({ initialData }: Props) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = initialData.filter((e) =>
    e.exercise.toLowerCase().includes(search.toLowerCase())
  );

  if (initialData.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <Trophy className="mx-auto mb-2 size-8 text-muted-foreground/40" />
        <p className="font-medium">No PR history yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Log workouts to start tracking personal records.</p>
      </div>
    );
  }

  function toggle(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-1 text-sm font-semibold">PR History</h2>
      <p className="mb-4 text-xs text-muted-foreground">Personal records over time, by exercise</p>

      <input
        type="search"
        placeholder="Search exercises…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 h-8 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No exercises match &ldquo;{search}&rdquo;</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((ex) => {
            const isOpen = expanded.has(ex.exercise);
            const latest = ex.entries[0];
            return (
              <div key={ex.exercise} className="rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggle(ex.exercise)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Trophy className="size-4 shrink-0 text-amber-500" />
                    <span className="truncate font-medium text-sm">{ex.exercise}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {ex.entries.length} PR{ex.entries.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {latest.weight}{latest.weightUnit} × {latest.reps}
                    </span>
                    {isOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border divide-y divide-border">
                    {ex.entries.map((entry, i) => (
                      <div key={entry.date + i} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          {i === 0 && <Trophy className="size-3.5 shrink-0 text-amber-500" />}
                          {i !== 0 && <div className="size-3.5 shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {entry.weight}{entry.weightUnit} × {entry.reps}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {format(parseISO(entry.date), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-muted-foreground">Est. 1RM</p>
                          <p className="text-sm font-semibold">{Math.round(entry.estimated1RM)} lb</p>
                          {entry.deltaVsPrev !== null && (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                              +{entry.deltaVsPrev} lb
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
