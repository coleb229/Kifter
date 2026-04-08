"use client";

import { ExternalLink, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { RecipeSubmission } from "@/types";

interface RecipeSubmissionsPanelProps {
  submissions: RecipeSubmission[];
}

const STATUS_STYLES: Record<string, { icon: React.ReactNode; badge: string }> = {
  pending: {
    icon: <Clock className="size-3.5" />,
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  },
  approved: {
    icon: <CheckCircle2 className="size-3.5" />,
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  rejected: {
    icon: <XCircle className="size-3.5" />,
    badge: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  },
};

export function RecipeSubmissionsPanel({ submissions }: RecipeSubmissionsPanelProps) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No recipe submissions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((sub) => {
        const status = STATUS_STYLES[sub.status] ?? STATUS_STYLES.pending;
        const date = new Date(sub.createdAt);
        return (
          <div
            key={sub.id}
            className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex-1 min-w-0">
              <a
                href={sub.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-medium text-sm hover:underline break-all"
              >
                {sub.url}
                <ExternalLink className="size-3 shrink-0" />
              </a>
              {sub.notes && (
                <p className="mt-1 text-xs text-muted-foreground">{sub.notes}</p>
              )}
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                {date.toLocaleDateString()} by user {sub.userId.slice(0, 8)}...
              </p>
            </div>
            <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${status.badge}`}>
              {status.icon}
              {sub.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
