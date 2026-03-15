"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { format } from "date-fns";
import type { PersonalRecord } from "@/actions/workout-actions";

type SortKey = "date" | "exercise" | "1rm";

interface Props {
  records: PersonalRecord[];
}

export function PersonalRecords({ records }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("date");

  const sorted = [...records].sort((a, b) => {
    if (sortKey === "date") return new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime();
    if (sortKey === "exercise") return a.exercise.localeCompare(b.exercise);
    return b.estimated1RM - a.estimated1RM;
  });

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <Trophy className="mx-auto mb-2 size-7 text-muted-foreground" />
        <p className="text-sm font-medium">No personal records yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Complete some sets to see your all-time bests here.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-amber-500" />
          <h2 className="text-sm font-semibold">Personal Records</h2>
          <span className="text-xs text-muted-foreground">({records.length})</span>
        </div>
        <div className="flex gap-1">
          {(["date", "exercise", "1rm"] as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortKey(key)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                sortKey === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {key === "date" ? "Recent" : key === "exercise" ? "A–Z" : "Est. 1RM"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col divide-y divide-border">
        {sorted.map((rec) => (
          <div key={rec.exercise} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-x-4 gap-y-0 py-2.5 text-sm">
            <span className="font-medium truncate">{rec.exercise}</span>
            <span className="tabular-nums text-right">
              {rec.weight} {rec.weightUnit}
            </span>
            <span className="text-muted-foreground tabular-nums text-right">
              ×{rec.reps}
            </span>
            <span className="text-muted-foreground tabular-nums text-right text-xs">
              {rec.estimated1RM.toFixed(1)} lb 1RM
            </span>
            <span className="text-muted-foreground text-xs text-right whitespace-nowrap">
              {format(new Date(rec.sessionDate), "MMM d, yyyy")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
