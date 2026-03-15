"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Medal, Trophy, Users } from "lucide-react";
import type { LeaderboardEntry } from "@/actions/leaderboard-actions";

interface Props {
  entries: LeaderboardEntry[];
}

const MEDAL_CONFIG = [
  { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-950/40" },
  { icon: Medal,  color: "text-slate-400",  bg: "bg-slate-100 dark:bg-slate-800/40" },
  { icon: Medal,  color: "text-amber-600",  bg: "bg-amber-100 dark:bg-amber-950/40" },
] as const;

function formatVolume(lb: number): string {
  if (lb >= 1_000_000) return `${(lb / 1_000_000).toFixed(1)}M lb`;
  if (lb >= 1_000) return `${(lb / 1_000).toFixed(1)}k lb`;
  return `${lb.toLocaleString()} lb`;
}

export function LeaderboardView({ entries }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="animate-fade-up">
        <Link
          href="/community"
          className="mb-4 flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Community
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-950/40">
            <Trophy className="size-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">Weekly workout volume · resets each Monday</p>
          </div>
        </div>
      </div>

      {/* Opt-in notice */}
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: "60ms" }}>
        Rankings show total lifting volume (weight × reps) for the current week.{" "}
        <Link href="/settings/preferences" className="font-medium text-foreground underline underline-offset-2 hover:no-underline">
          Opt in via Preferences
        </Link>{" "}
        to appear here.
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center animate-fade-up">
          <Users className="mx-auto mb-3 size-8 text-muted-foreground/30" />
          <p className="font-medium">No participants yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Be the first — opt in from your preferences.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry, i) => {
            const medalCfg = i < 3 ? MEDAL_CONFIG[i] : null;
            const MedalIcon = medalCfg?.icon;
            return (
              <div
                key={entry.userId}
                className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Rank */}
                <div className="w-8 shrink-0 text-center">
                  {MedalIcon ? (
                    <div className={`mx-auto flex size-7 items-center justify-center rounded-full ${medalCfg.bg}`}>
                      <MedalIcon className={`size-4 ${medalCfg.color}`} />
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">#{entry.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="size-9 shrink-0 overflow-hidden rounded-full bg-muted">
                  {entry.profileImage ? (
                    <Image src={entry.profileImage} alt={entry.displayName} width={36} height={36} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-xs font-semibold text-muted-foreground">
                      {entry.displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{entry.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.sessionCount} session{entry.sessionCount !== 1 ? "s" : ""} this week
                  </p>
                </div>

                {/* Volume */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold">{formatVolume(entry.weeklyVolumeLb)}</p>
                  <p className="text-xs text-muted-foreground">volume</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
