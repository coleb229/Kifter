"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Dumbbell, Trash2 } from "lucide-react";
import { deleteSession } from "@/actions/workout-actions";
import type { WorkoutSession } from "@/types";

interface SessionCardProps {
  session: WorkoutSession;
  index?: number;
}

export function SessionCard({ session, index }: SessionCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const date = new Date(session.date);

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      await deleteSession(session.id);
      router.refresh();
    });
  }

  return (
    <div
      className="group relative animate-fade-up"
      style={index !== undefined ? { animationDelay: `${index * 100}ms` } : undefined}
    >
      <a
        href={`/training/${session.id}`}
        className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5 text-card-foreground transition-colors hover:bg-muted/30"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">
              {session.name ?? format(date, "EEEE, MMM d")}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(date, "MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium">
              {session.bodyTarget}
            </span>
            <span className="text-xs text-muted-foreground">
              {session.setCount} set{session.setCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {session.exerciseNames && session.exerciseNames.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Dumbbell className="size-3 shrink-0" />
            <span className="truncate">
              {session.exerciseNames.join(" · ")}
            </span>
          </div>
        )}
      </a>

      {/* Delete control — floated over the card, outside the <a> */}
      <div className="absolute right-3 bottom-3 flex items-center gap-2">
        {confirming && (
          <>
            <span className="text-xs text-muted-foreground">Delete?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs font-medium text-destructive transition-colors hover:underline"
            >
              {isPending ? "Deleting…" : "Yes"}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </>
        )}
        {!confirming && (
          <button
            type="button"
            onClick={handleDelete}
            aria-label="Delete session"
            className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
