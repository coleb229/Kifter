"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Dumbbell, Trash2, Heart, Clock, Flame, RotateCcw } from "lucide-react";
import { deleteSession, replaySession } from "@/actions/workout-actions";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import type { WorkoutSession } from "@/types";
import { BODY_TARGET_STYLES } from "@/lib/label-colors";

interface SessionCardProps {
  session: WorkoutSession;
  index?: number;
}

export function SessionCard({ session, index }: SessionCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [replayMode, setReplayMode] = useState(false);
  const [replayDate, setReplayDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [replayPending, startReplayTransition] = useTransition();
  const [replaySheet, setReplaySheet] = useState(false);
  const date = new Date(session.date.slice(0, 10) + "T00:00:00");

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

  function handleReplay(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (window.matchMedia("(max-width: 639px)").matches) {
      setReplaySheet(true);
    } else {
      setReplayMode(true);
    }
    setConfirming(false);
  }

  function handleReplayConfirm(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    startReplayTransition(async () => {
      const result = await replaySession(session.id, replayDate);
      if (result.success) {
        setReplaySheet(false);
        setReplayMode(false);
        router.push(`/training/${result.data.newSessionId}`);
      }
    });
  }

  return (
    <div
      className="group relative animate-fade-up"
      style={index !== undefined ? { animationDelay: `${index * 100}ms` } : undefined}
    >
      <a
        href={`/training/${session.id}`}
        className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5 text-card-foreground transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold truncate">
              {session.name ?? format(date, "EEEE, MMM d")}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(date, "MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${BODY_TARGET_STYLES[session.bodyTarget].badge}`}>
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

        {/* Desktop hover detail */}
        {session.exerciseNames && session.exerciseNames.length > 0 && (
          <div className="hidden max-h-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:max-h-24 group-hover:opacity-100 lg:block">
            <div className="mt-1 flex flex-wrap gap-1.5">
              {session.exerciseNames.slice(0, 5).map((name) => (
                <span key={name} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {name}
                </span>
              ))}
              {session.exerciseNames.length > 5 && (
                <span className="text-[11px] text-muted-foreground">+{session.exerciseNames.length - 5} more</span>
              )}
            </div>
          </div>
        )}

        {session.appleHealth && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {session.appleHealth.heartRateAvg && (
              <span className="flex items-center gap-1">
                <Heart className="size-3 text-rose-500" />
                {session.appleHealth.heartRateAvg} bpm avg
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {session.appleHealth.duration} min
            </span>
            {session.appleHealth.caloriesBurned && (
              <span className="flex items-center gap-1">
                <Flame className="size-3 text-amber-500" />
                {session.appleHealth.caloriesBurned} kcal
              </span>
            )}
          </div>
        )}
      </a>

      {/* Controls — floated over the card, outside the <a> */}
      <div className="absolute right-3 bottom-3 flex items-center gap-2">
        {replayMode && (
          <>
            <input
              type="date"
              value={replayDate}
              suppressHydrationWarning
              onChange={(e) => { e.stopPropagation(); setReplayDate(e.target.value); }}
              onClick={(e) => e.stopPropagation()}
              className="rounded border border-border bg-background px-2 py-0.5 text-xs outline-none focus:border-ring"
            />
            <button
              type="button"
              onClick={(e) => handleReplayConfirm(e)}
              disabled={replayPending}
              className="text-xs font-medium text-primary transition-colors hover:underline disabled:opacity-50"
            >
              {replayPending ? "Creating…" : "Go"}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setReplayMode(false); }}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </>
        )}
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
        {!confirming && !replayMode && (
          <>
            <button
              type="button"
              onClick={handleReplay}
              aria-label="Replay session"
              className="rounded p-2 sm:p-1 text-muted-foreground sm:opacity-0 transition-all hover:text-primary sm:group-hover:opacity-100"
            >
              <RotateCcw className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              aria-label="Delete session"
              className="rounded p-2 sm:p-1 text-muted-foreground sm:opacity-0 transition-all hover:text-destructive sm:group-hover:opacity-100"
            >
              <Trash2 className="size-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Mobile replay bottom sheet */}
      <BottomSheet open={replaySheet} onClose={() => setReplaySheet(false)} title="Replay Workout">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${BODY_TARGET_STYLES[session.bodyTarget].badge}`}>
              {session.bodyTarget}
            </span>
            <span className="text-sm text-foreground truncate">
              {session.name ?? format(date, "EEEE, MMM d")}
            </span>
          </div>

          {session.exerciseNames && session.exerciseNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {session.exerciseNames.map((name) => (
                <span key={name} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {name}
                </span>
              ))}
            </div>
          )}

          <div>
            <label htmlFor={`replay-date-${session.id}`} className="mb-1.5 block text-sm font-medium text-foreground">
              Date
            </label>
            <input
              id={`replay-date-${session.id}`}
              type="date"
              value={replayDate}
              onChange={(e) => setReplayDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => handleReplayConfirm()}
              disabled={replayPending || !replayDate}
            >
              {replayPending ? "Creating…" : "Create Session"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReplaySheet(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
