"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Dumbbell, Utensils, Activity, MessageCircle, BrainCircuit, RotateCcw } from "lucide-react";
import { getUserData, setUserRestrictions, setUserAiRateLimit, resetUserAiUsage, setAdminPermissions } from "@/actions/admin-actions";
import type { UserSummary } from "@/types";

interface Props {
  user: UserSummary;
  onClose: () => void;
}

const FEATURE_KEYS = [
  { key: "training" as const,  label: "Training",  icon: Dumbbell },
  { key: "nutrition" as const, label: "Nutrition",  icon: Utensils },
  { key: "cardio" as const,    label: "Cardio",     icon: Activity },
  { key: "community" as const, label: "Community",  icon: MessageCircle },
];

export function UserDetailDrawer({ user, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isResetting, startReset] = useTransition();
  const [counts, setCounts] = useState<{ workoutSessions: number; dietEntries: number; cardioSessions: number; posts: number; todayAiUsage: number } | null>(null);
  const [restrictions, setRestrictions] = useState(user.restrictions ?? {});
  const [adminPerms, setAdminPerms] = useState(user.adminPermissions ?? {});
  const [aiDisabled, setAiDisabled] = useState(user.aiRateLimit?.disabled ?? false);
  const [aiDailyLimit, setAiDailyLimit] = useState<string>(
    user.aiRateLimit?.dailyLimit != null ? String(user.aiRateLimit.dailyLimit) : ""
  );

  useEffect(() => {
    getUserData(user.id).then((r) => {
      if (r.success) setCounts(r.data);
    });
  }, [user.id]);

  function toggleRestriction(key: keyof typeof restrictions) {
    setRestrictions((r) => ({ ...r, [key]: !r[key] }));
  }

  function handleSave() {
    startTransition(async () => {
      const parsedLimit = aiDailyLimit.trim() !== "" ? parseInt(aiDailyLimit) : undefined;
      await Promise.all([
        setUserRestrictions(user.id, restrictions),
        setAdminPermissions(user.id, adminPerms),
        setUserAiRateLimit(user.id, {
          disabled: aiDisabled,
          ...(parsedLimit != null ? { dailyLimit: parsedLimit } : {}),
        }),
      ]);
      router.refresh();
      onClose();
    });
  }

  function handleResetUsage() {
    startReset(async () => {
      await resetUserAiUsage(user.id);
      setCounts((c) => c ? { ...c, todayAiUsage: 0 } : c);
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-semibold">{user.displayName ?? user.name ?? "User"}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
          {/* Stats */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Activity</p>
            {counts ? (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Workouts",  value: counts.workoutSessions },
                  { label: "Diet entries", value: counts.dietEntries },
                  { label: "Cardio sessions", value: counts.cardioSessions },
                  { label: "Posts",     value: counts.posts },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                    <p className="text-lg font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
                {user.role}
              </span>
              {user.bannedAt && (
                <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                  Banned
                </span>
              )}
              {user.createdAt && (
                <span className="text-xs text-muted-foreground self-center">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Feature restrictions */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Feature access</p>
            <div className="flex flex-col gap-2">
              {FEATURE_KEYS.map(({ key, label, icon: Icon }) => {
                const restricted = !!restrictions[key];
                return (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Icon className="size-3.5 text-muted-foreground" />
                      <span className="text-sm">{label}</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!restricted}
                      onClick={() => toggleRestriction(key)}
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                        restricted ? "bg-destructive/60" : "bg-primary"
                      }`}
                    >
                      <span className={`block size-4 rounded-full bg-white shadow transition-transform ${restricted ? "translate-x-0" : "translate-x-4"}`} />
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Toggle off to restrict access to that feature for this user.</p>
          </div>

          {/* Admin permissions — only for non-admin users */}
          {user.role !== "admin" && (
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Admin privileges</p>
              <div className="flex flex-col gap-2">
                {(
                  [
                    { key: "manageUsers" as const, label: "Manage users" },
                    { key: "viewBugReports" as const, label: "View bug reports" },
                    { key: "manageSuggestions" as const, label: "Manage suggestions" },
                  ] as const
                ).map(({ key, label }) => {
                  const enabled = !!adminPerms[key];
                  return (
                    <div key={key} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                      <span className="text-sm">{label}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        onClick={() => setAdminPerms((p) => ({ ...p, [key]: !p[key] }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
                      >
                        <span className={`block size-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Grant access to specific admin sections without full admin role.</p>
            </div>
          )}

          {/* AI rate limits */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">AI rate limit</p>
            <div className="flex flex-col gap-2">
              {/* Today's usage */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="size-3.5 text-muted-foreground" />
                  <span className="text-sm">Today&apos;s usage</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tabular-nums">
                    {counts != null ? counts.todayAiUsage : "—"}
                  </span>
                  <button
                    type="button"
                    onClick={handleResetUsage}
                    disabled={isResetting || counts?.todayAiUsage === 0}
                    title="Reset today's count"
                    className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Disable AI toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                <span className="text-sm">Disable AI entirely</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={aiDisabled}
                  onClick={() => setAiDisabled((v) => !v)}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${aiDisabled ? "bg-destructive/60" : "bg-muted"}`}
                >
                  <span className={`block size-4 rounded-full bg-white shadow transition-transform ${aiDisabled ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Custom daily limit */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                <div>
                  <p className="text-sm">Custom daily limit</p>
                  <p className="text-xs text-muted-foreground">Overrides site default. Leave blank to use default.</p>
                </div>
                <input
                  type="number"
                  min={0}
                  placeholder="Default"
                  value={aiDailyLimit}
                  onChange={(e) => setAiDailyLimit(e.target.value)}
                  className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </>
  );
}
