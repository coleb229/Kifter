"use client";

import { Lightbulb } from "lucide-react";
import { RestDaySuggestions } from "@/components/training/rest-day-suggestions";
import { OverloadSuggestions } from "@/components/training/overload-suggestions";
import { StartFromProgramCard } from "@/components/training/start-from-program-card";
import type { RestDaySuggestion, ProgressiveOverloadSuggestion } from "@/actions/workout-actions";
import type { WorkoutProgram } from "@/types";

interface Props {
  suggestions: RestDaySuggestion[];
  overloadSuggestions: ProgressiveOverloadSuggestion[];
  programs: WorkoutProgram[];
}

export function InsightsSection({ suggestions, overloadSuggestions, programs }: Props) {
  const count = (suggestions.length > 0 ? 1 : 0) + (overloadSuggestions.length > 0 ? 1 : 0) + (programs.length > 0 ? 1 : 0);
  if (count === 0) return null;

  return (
    <details className="group mb-6 rounded-xl border border-border bg-card" open>
      <summary className="flex cursor-pointer items-center gap-2.5 px-5 py-3.5 text-sm font-semibold select-none list-none [&::-webkit-details-marker]:hidden">
        <Lightbulb className="size-4 text-muted-foreground" />
        Insights & Recommendations
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
          {count}
        </span>
        <svg className="size-4 text-muted-foreground transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </summary>
      <div className="px-5 pb-5 space-y-0">
        {suggestions.length > 0 && <RestDaySuggestions suggestions={suggestions} />}
        {overloadSuggestions.length > 0 && <OverloadSuggestions suggestions={overloadSuggestions} />}
        <StartFromProgramCard programs={programs} />
      </div>
    </details>
  );
}
