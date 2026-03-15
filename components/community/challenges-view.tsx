"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Trophy, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  createChallenge,
  joinChallenge,
  leaveChallenge,
  deleteChallenge,
  getChallengeLeaderboard,
} from "@/actions/challenge-actions";
import type { Challenge, ChallengeMetric, ChallengeParticipant } from "@/types";

const METRIC_LABELS: Record<ChallengeMetric, { label: string; unit: string }> = {
  workout_count:   { label: "Workouts",         unit: "sessions" },
  cardio_distance: { label: "Cardio Distance",  unit: "km" },
  total_volume:    { label: "Total Volume",     unit: "lb" },
};

interface Props {
  challenges: Challenge[];
  currentUserId: string;
}

export function ChallengesView({ challenges: initialChallenges, currentUserId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    metric: "workout_count" as ChallengeMetric,
    targetValue: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [leaderboards, setLeaderboards] = useState<Record<string, ChallengeParticipant[]>>({});
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<string | null>(null);

  function handleCreate() {
    const target = parseFloat(form.targetValue);
    if (!form.title.trim() || isNaN(target) || target <= 0) {
      setFormError("Title and a positive target value are required.");
      return;
    }
    setFormError(null);
    startTransition(async () => {
      const result = await createChallenge({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        metric: form.metric,
        targetValue: target,
      });
      if (result.success) {
        setShowCreateForm(false);
        setForm({ title: "", description: "", metric: "workout_count", targetValue: "" });
        router.refresh();
      } else {
        setFormError(result.error);
      }
    });
  }

  function handleJoin(id: string) {
    startTransition(async () => { await joinChallenge(id); router.refresh(); });
  }

  function handleLeave(id: string) {
    startTransition(async () => { await leaveChallenge(id); router.refresh(); });
  }

  function handleDelete(id: string) {
    startTransition(async () => { await deleteChallenge(id); router.refresh(); });
  }

  async function handleToggleLeaderboard(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!leaderboards[id]) {
      setLoadingLeaderboard(id);
      const result = await getChallengeLeaderboard(id);
      if (result.success) setLeaderboards((prev) => ({ ...prev, [id]: result.data }));
      setLoadingLeaderboard(null);
    }
  }

  const inputClass = "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
  const selectClass = "h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full";

  return (
    <div>
      {/* Header row */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {initialChallenges.length} active challenge{initialChallenges.length !== 1 ? "s" : ""}
        </p>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-3.5" />
          Create Challenge
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold">New 30-Day Challenge</h3>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. 20 Workouts in 30 Days"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Description (optional)</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What's this challenge about?"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Metric</label>
              <select
                value={form.metric}
                onChange={(e) => setForm({ ...form, metric: e.target.value as ChallengeMetric })}
                className={selectClass}
              >
                {(Object.entries(METRIC_LABELS) as [ChallengeMetric, { label: string; unit: string }][]).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Target ({METRIC_LABELS[form.metric].unit})
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.targetValue}
                onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                placeholder="e.g. 20"
                className={inputClass}
              />
            </div>
          </div>
          {formError && <p className="text-xs text-destructive">{formError}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={isPending}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Challenge cards */}
      {initialChallenges.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Trophy className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm font-medium">No active challenges</p>
          <p className="mt-1 text-xs text-muted-foreground">Create one to get started!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {initialChallenges.map((challenge) => {
            const { label, unit } = METRIC_LABELS[challenge.metric];
            const isExpanded = expandedId === challenge.id;
            const lb = leaderboards[challenge.id];

            return (
              <div key={challenge.id} className="rounded-xl border border-border bg-card p-5">
                {/* Title row */}
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm">{challenge.title}</h3>
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                        {label}
                      </span>
                    </div>
                    {challenge.description && (
                      <p className="text-xs text-muted-foreground">{challenge.description}</p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      by {challenge.creatorName} · ends {format(new Date(challenge.endDate + "T00:00:00"), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {challenge.creatorId === currentUserId && (
                      <button
                        type="button"
                        onClick={() => handleDelete(challenge.id)}
                        disabled={isPending}
                        className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                        aria-label="Delete challenge"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {challenge.isParticipating && (
                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {challenge.myCurrentValue.toLocaleString()} / {challenge.targetValue.toLocaleString()} {unit}
                      </span>
                      <span className="font-medium">{challenge.myPercentComplete}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${challenge.myPercentComplete}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Footer row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="size-3" />
                      {challenge.participantCount}
                    </span>
                    <span>{challenge.daysRemaining}d left</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {challenge.isParticipating ? (
                      challenge.creatorId !== currentUserId && (
                        <button
                          type="button"
                          onClick={() => handleLeave(challenge.id)}
                          disabled={isPending}
                          className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                        >
                          Leave
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleJoin(challenge.id)}
                        disabled={isPending}
                        className="rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        Join
                      </button>
                    )}
                    {challenge.isParticipating && (
                      <button
                        type="button"
                        onClick={() => handleToggleLeaderboard(challenge.id)}
                        className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Trophy className="size-3" />
                        Leaderboard
                        {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Leaderboard */}
                {isExpanded && (
                  <div className="mt-4 border-t border-border pt-4">
                    {loadingLeaderboard === challenge.id ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                        <Loader2 className="size-3.5 animate-spin" /> Loading…
                      </div>
                    ) : lb ? (
                      <div className="flex flex-col gap-2">
                        {lb.map((participant, i) => (
                          <div key={participant.userId} className="flex items-center gap-3">
                            <span className="w-5 text-xs font-medium text-muted-foreground text-right">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs font-medium truncate">{participant.displayName}</span>
                                <span className="text-xs text-muted-foreground ml-2 shrink-0">
                                  {participant.currentValue.toLocaleString()} {unit}
                                </span>
                              </div>
                              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-indigo-400 transition-all"
                                  style={{ width: `${participant.percentComplete}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Failed to load leaderboard.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
