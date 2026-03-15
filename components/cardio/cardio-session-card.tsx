"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Activity, Bike, Footprints, Waves, Zap, Trash2 } from "lucide-react";
import { deleteCardioSession } from "@/actions/cardio-actions";
import type { CardioSession, CardioActivity, CardioIntensity } from "@/types";

function ActivityIcon({ activity }: { activity: CardioActivity }) {
  const cls = "size-4 shrink-0";
  switch (activity) {
    case "Run": return <Footprints className={cls} />;
    case "Walk": return <Footprints className={cls} />;
    case "Cycle": return <Bike className={cls} />;
    case "Swim": return <Waves className={cls} />;
    case "HIIT": return <Zap className={cls} />;
    default: return <Activity className={cls} />;
  }
}

const intensityStyles: Record<CardioIntensity, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  moderate: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  hard: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
  max: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface Props {
  session: CardioSession;
  index?: number;
}

export function CardioSessionCard({ session, index }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const date = parseISO(session.date);

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      await deleteCardioSession(session.id);
      router.refresh();
    });
  }

  return (
    <div
      className="group relative animate-fade-up"
      style={index !== undefined ? { animationDelay: `${index * 80}ms` } : undefined}
    >
      <a
        href={`/cardio/${session.id}`}
        className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5 text-card-foreground transition-colors hover:bg-muted/30"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
              <ActivityIcon activity={session.activityType} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{session.activityType}</p>
              <p className="text-xs text-muted-foreground">
                {format(date, "MMMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${intensityStyles[session.intensity]}`}>
              {session.intensity}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDuration(session.duration)}
            </span>
          </div>
        </div>

        {/* Metrics row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {session.distance != null && (
            <span>
              {session.distance.toFixed(1)} {session.distanceUnit ?? "km"}
            </span>
          )}
          {session.caloriesBurned != null && (
            <span>{session.caloriesBurned} kcal</span>
          )}
          {session.avgHeartRate != null && (
            <span>avg {session.avgHeartRate} bpm</span>
          )}
          {session.notes && (
            <span className="truncate max-w-48 italic">{session.notes}</span>
          )}
        </div>
      </a>

      {/* Delete control */}
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
