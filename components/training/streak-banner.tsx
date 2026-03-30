"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flame, Snowflake } from "lucide-react";
import { useStreakFreeze } from "@/actions/streak-actions";
import type { Streak } from "@/types";

interface Props {
  streak: Streak;
}

export function StreakBanner({ streak }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (streak.currentStreak === 0) return null;

  function handleFreeze() {
    startTransition(async () => {
      await useStreakFreeze();
      router.refresh();
    });
  }

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3.5 animate-fade-up">
      <Flame className="size-6 text-orange-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">
          {streak.currentStreak} day streak
          {streak.longestStreak > streak.currentStreak && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              · best: {streak.longestStreak}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">Keep logging workouts daily to grow your streak</p>
      </div>
      {streak.freezeTokens > 0 && (
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            {Array.from({ length: streak.freezeTokens }).map((_, i) => (
              <Snowflake key={i} className="size-3.5 text-sky-400" />
            ))}
          </div>
          <button
            type="button"
            onClick={handleFreeze}
            disabled={isPending}
            className="rounded-full border border-sky-300 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-50 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-950/60"
          >
            {isPending ? "Using…" : "Use Freeze"}
          </button>
        </div>
      )}
    </div>
  );
}
