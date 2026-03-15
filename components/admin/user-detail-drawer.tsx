"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Dumbbell, Utensils, Activity, MessageCircle } from "lucide-react";
import { getUserData, setUserRestrictions } from "@/actions/admin-actions";
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
  const [counts, setCounts] = useState<{ workoutSessions: number; dietEntries: number; cardioSessions: number; posts: number } | null>(null);
  const [restrictions, setRestrictions] = useState(user.restrictions ?? {});

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
      await setUserRestrictions(user.id, restrictions);
      router.refresh();
      onClose();
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
        </div>

        <div className="border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save restrictions"}
          </button>
        </div>
      </div>
    </>
  );
}
