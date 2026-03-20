"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Edit2, Activity, Bike, Footprints, Waves, Zap } from "lucide-react";
import { CardioSessionForm } from "@/components/cardio/cardio-session-form";
import { Button } from "@/components/ui/button";
import type { CardioSession, CardioActivity, CardioIntensity } from "@/types";

function ActivityIcon({ activity }: { activity: CardioActivity }) {
  const cls = "size-5 shrink-0";
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
}

export function CardioSessionDetail({ session }: Props) {
  const [editing, setEditing] = useState(false);
  const date = parseISO(session.date);

  if (editing) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Edit Session</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(date, "MMMM d, yyyy")}
          </p>
        </div>
        <CardioSessionForm editingSession={session} />
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel editing
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
            <ActivityIcon activity={session.activityType} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{session.activityType}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {format(date, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Edit2 className="size-3.5" />
          Edit
        </Button>
      </div>

      {/* Stats grid */}
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-up"
        style={{ animationDelay: "60ms" }}
      >
        {[
          { label: "Duration", value: formatDuration(session.duration) },
          {
            label: "Intensity",
            value: session.intensity.charAt(0).toUpperCase() + session.intensity.slice(1),
            extraClass: intensityStyles[session.intensity],
          },
          session.distance != null
            ? {
                label: "Distance",
                value: `${session.distance.toFixed(1)} ${session.distanceUnit ?? "km"}`,
              }
            : null,
          session.caloriesBurned != null
            ? { label: "Calories", value: `${session.caloriesBurned} kcal` }
            : null,
          session.avgHeartRate != null
            ? {
                label: "Heart Rate",
                value: session.minHeartRate != null && session.maxHeartRate != null
                  ? `${session.avgHeartRate} bpm avg`
                  : `${session.avgHeartRate} bpm`,
                sub: session.minHeartRate != null && session.maxHeartRate != null
                  ? `${session.minHeartRate}–${session.maxHeartRate} bpm range`
                  : undefined,
              }
            : null,
        ]
          .filter(Boolean)
          .map((stat) => (
            <div
              key={stat!.label}
              className="flex flex-col gap-0.5 rounded-xl border border-border bg-card p-4"
            >
              <p className="text-xs text-muted-foreground">{stat!.label}</p>
              <p className={`text-lg font-bold leading-tight ${stat!.extraClass ?? ""}`}>
                {stat!.value}
              </p>
              {"sub" in stat! && stat!.sub && (
                <p className="text-[11px] text-muted-foreground">{stat!.sub}</p>
              )}
            </div>
          ))}
      </div>

      {/* Notes */}
      {session.notes && (
        <div
          className="mt-4 rounded-xl border border-border bg-card p-4 animate-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
          <p className="text-sm">{session.notes}</p>
        </div>
      )}
    </div>
  );
}
