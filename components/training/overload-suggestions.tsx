"use client";

import { useState } from "react";
import { ArrowRight, X, TrendingUp } from "lucide-react";
import type { ProgressiveOverloadSuggestion } from "@/actions/workout-actions";

interface Props {
  suggestions: ProgressiveOverloadSuggestion[];
}

export function OverloadSuggestions({ suggestions }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = suggestions.filter((s) => !dismissed.has(s.exercise));
  if (visible.length === 0) return null;

  return (
    <div className="mb-6 animate-fade-up" style={{ animationDelay: "60ms" }}>
      <div className="mb-2 flex items-center gap-2">
        <TrendingUp className="size-4 text-emerald-500" />
        <p className="text-base font-semibold">Ready to Progress</p>
        <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
          {visible.length}
        </span>
      </div>
      <div className="relative">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border" style={{ maskImage: "linear-gradient(to right, black calc(100% - 2rem), transparent)" }}>
        {visible.map((s) => (
          <div
            key={s.exercise}
            className="relative flex min-w-[180px] flex-col gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 border-l-3 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-3 shrink-0"
          >
            <button
              type="button"
              onClick={() => setDismissed((prev) => new Set([...prev, s.exercise]))}
              className="absolute right-2 top-2 rounded p-0.5 text-muted-foreground/60 hover:text-muted-foreground"
              aria-label="Dismiss"
            >
              <X className="size-3" />
            </button>

            <p className="pr-4 text-xs font-semibold leading-tight">{s.exercise}</p>

            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">{s.currentWeightDisplay} {s.currentWeightUnit}</span>
              <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{s.suggestedWeightDisplay} {s.currentWeightUnit}</span>
            </div>

            <p className="text-[10px] text-muted-foreground">
              {s.consecutiveSessions} sessions at same weight
            </p>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
