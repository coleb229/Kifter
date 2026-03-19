"use client";

import { format } from "date-fns";
import type { ImplementationNote, ImplementationOutcome } from "@/types";

const OUTCOME_STYLES: Record<ImplementationOutcome, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  partial: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  skipped: "bg-muted text-muted-foreground",
  failed: "bg-destructive/10 text-destructive",
  too_complex: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
};

const OUTCOME_LABELS: Record<ImplementationOutcome, string> = {
  success: "success",
  partial: "partial",
  skipped: "skipped",
  failed: "failed",
  too_complex: "too complex",
};

interface Props {
  notes: ImplementationNote[];
}

export function ImplementationLog({ notes }: Props) {
  if (!notes.length) return null;

  const sorted = [...notes].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Implementation Log
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-2">
        {sorted.map((note, i) => (
          <div key={i} className="rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${OUTCOME_STYLES[note.outcome]}`}>
                {OUTCOME_LABELS[note.outcome]}
              </span>
              <span className="text-muted-foreground">
                {format(new Date(note.timestamp), "MMM d, yyyy · h:mm a")}
              </span>
              {note.commandSource && (
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                  {note.commandSource}
                </span>
              )}
            </div>

            <p className="font-medium leading-snug">{note.summary}</p>

            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{note.details}</p>

            {note.filesChanged && note.filesChanged.length > 0 && (
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Files changed</p>
                <ul className="space-y-0.5">
                  {note.filesChanged.map((f) => (
                    <li key={f} className="font-mono text-[10px] text-muted-foreground">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
