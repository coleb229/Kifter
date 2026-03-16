"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Medal, Trophy, Users, Dumbbell, ChevronDown } from "lucide-react";
import {
  getBodyTargetLeaderboard,
  getExercisePRLeaderboard,
  type LeaderboardEntry,
  type BodyTargetLeaderboardEntry,
  type ExercisePREntry,
} from "@/actions/leaderboard-actions";
import { BODY_TARGETS, type BodyTarget } from "@/types";

type Tab = "volume" | "body-target" | "exercise-pr";

interface Props {
  entries: LeaderboardEntry[];
  exercises: string[];
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

function EntryRow({
  rank,
  displayName,
  profileImage,
  primary,
  secondary,
  index,
}: {
  rank: number;
  displayName: string;
  profileImage?: string;
  primary: string;
  secondary: string;
  index: number;
}) {
  const i = rank - 1;
  const medalCfg = i < 3 ? MEDAL_CONFIG[i] : null;
  const MedalIcon = medalCfg?.icon;

  return (
    <div
      className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 animate-fade-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="w-8 shrink-0 text-center">
        {MedalIcon ? (
          <div className={`mx-auto flex size-7 items-center justify-center rounded-full ${medalCfg.bg}`}>
            <MedalIcon className={`size-4 ${medalCfg.color}`} />
          </div>
        ) : (
          <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
        )}
      </div>
      <div className="size-9 shrink-0 overflow-hidden rounded-full bg-muted">
        {profileImage ? (
          <Image src={profileImage} alt={displayName} width={36} height={36} className="h-full w-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-xs font-semibold text-muted-foreground">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{displayName}</p>
        <p className="text-xs text-muted-foreground">{secondary}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold">{primary}</p>
      </div>
    </div>
  );
}

export function LeaderboardView({ entries, exercises }: Props) {
  const [tab, setTab] = useState<Tab>("volume");
  const [isPending, startTransition] = useTransition();

  const [selectedTarget, setSelectedTarget] = useState<BodyTarget>("Push");
  const [selectedExercise, setSelectedExercise] = useState<string>(exercises[0] ?? "");

  const [targetEntries, setTargetEntries] = useState<BodyTargetLeaderboardEntry[]>([]);
  const [prEntries, setPrEntries] = useState<ExercisePREntry[]>([]);
  const [targetLoaded, setTargetLoaded] = useState(false);
  const [prLoaded, setPrLoaded] = useState(false);

  function loadBodyTarget(bt: BodyTarget) {
    setSelectedTarget(bt);
    setTargetLoaded(false);
    startTransition(async () => {
      const result = await getBodyTargetLeaderboard(bt);
      if (result.success) setTargetEntries(result.data);
      setTargetLoaded(true);
    });
  }

  function loadExercisePR(exercise: string) {
    setSelectedExercise(exercise);
    setPrLoaded(false);
    startTransition(async () => {
      const result = await getExercisePRLeaderboard(exercise);
      if (result.success) setPrEntries(result.data);
      setPrLoaded(true);
    });
  }

  function handleTabChange(t: Tab) {
    setTab(t);
    if (t === "body-target" && !targetLoaded) loadBodyTarget(selectedTarget);
    if (t === "exercise-pr" && !prLoaded && selectedExercise) loadExercisePR(selectedExercise);
  }

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
            <p className="text-sm text-muted-foreground">Community rankings across volume, muscle groups &amp; PRs</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 flex-wrap animate-fade-up" style={{ animationDelay: "40ms" }}>
        {([
          { key: "volume",      label: "Weekly Volume" },
          { key: "body-target", label: "By Muscle Group" },
          { key: "exercise-pr", label: "Exercise PRs" },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => handleTabChange(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-foreground shadow"
                : "border border-border bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Opt-in notice */}
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: "60ms" }}>
        {tab === "exercise-pr"
          ? "Rankings show each user's all-time max weight for the selected exercise."
          : "Rankings show total lifting volume (weight × reps) for the current week."}{" "}
        <Link href="/settings/preferences" className="font-medium text-foreground underline underline-offset-2 hover:no-underline">
          Opt in via Preferences
        </Link>{" "}
        to appear here.
      </div>

      {/* Body target selector */}
      {tab === "body-target" && (
        <div className="flex flex-wrap gap-2 animate-fade-up">
          {(BODY_TARGETS.filter((bt) => bt !== "Cardio" && bt !== "Other") as BodyTarget[]).map((bt) => (
            <button
              key={bt}
              type="button"
              onClick={() => loadBodyTarget(bt)}
              disabled={isPending}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedTarget === bt
                  ? "bg-indigo-600 text-white"
                  : "border border-border bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {bt}
            </button>
          ))}
        </div>
      )}

      {/* Exercise selector */}
      {tab === "exercise-pr" && exercises.length > 0 && (
        <div className="flex items-center gap-2 animate-fade-up">
          <Dumbbell className="size-4 text-muted-foreground shrink-0" />
          <div className="relative">
            <select
              value={selectedExercise}
              onChange={(e) => loadExercisePR(e.target.value)}
              disabled={isPending}
              className="appearance-none rounded-lg border border-border bg-background pl-3 pr-8 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
            >
              {exercises.map((ex) => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground">All-time max weight</span>
        </div>
      )}

      {/* Loading */}
      {isPending && (
        <div className="flex h-24 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      )}

      {/* Volume tab */}
      {tab === "volume" && !isPending && (
        entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-16 text-center animate-fade-up">
            <Users className="mx-auto mb-3 size-8 text-muted-foreground/30" />
            <p className="font-medium">No participants yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Be the first — opt in from your preferences.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry, i) => (
              <EntryRow
                key={entry.userId}
                rank={entry.rank}
                displayName={entry.displayName}
                profileImage={entry.profileImage}
                primary={formatVolume(entry.weeklyVolumeLb)}
                secondary={`${entry.sessionCount} session${entry.sessionCount !== 1 ? "s" : ""} this week`}
                index={i}
              />
            ))}
          </div>
        )
      )}

      {/* Body target tab */}
      {tab === "body-target" && !isPending && targetLoaded && (
        targetEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">No opted-in users have {selectedTarget} sessions this week.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {targetEntries.map((entry, i) => (
              <EntryRow
                key={entry.userId}
                rank={entry.rank}
                displayName={entry.displayName}
                profileImage={entry.profileImage}
                primary={formatVolume(entry.weeklyVolumeLb)}
                secondary={`${entry.sessionCount} ${selectedTarget} session${entry.sessionCount !== 1 ? "s" : ""} this week`}
                index={i}
              />
            ))}
          </div>
        )
      )}

      {/* Exercise PR tab */}
      {tab === "exercise-pr" && !isPending && prLoaded && (
        prEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            {exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground">No shared exercises logged yet between opted-in users.</p>
            ) : (
              <p className="text-sm text-muted-foreground">No data for this exercise yet.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {prEntries.map((entry, i) => (
              <EntryRow
                key={entry.userId}
                rank={entry.rank}
                displayName={entry.displayName}
                profileImage={entry.profileImage}
                primary={`${entry.maxWeightLb} lb`}
                secondary="all-time max"
                index={i}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
