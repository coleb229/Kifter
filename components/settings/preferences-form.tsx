"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { updatePreferences } from "@/actions/user-actions";
import type { UserSummary } from "@/types";

const DRAFT_PREF_KEY = "kifted-draft-duration";
type CacheDuration = "1h" | "24h" | "7d" | "off";

interface Props {
  user: UserSummary | null;
}

const ACCENT_OPTIONS = [
  { value: "indigo", label: "Indigo", color: "bg-indigo-500" },
  { value: "violet", label: "Violet", color: "bg-violet-500" },
  { value: "rose",   label: "Rose",   color: "bg-rose-500" },
  { value: "emerald",label: "Emerald",color: "bg-emerald-500" },
  { value: "amber",  label: "Amber",  color: "bg-amber-500" },
] as const;

type AccentColor = typeof ACCENT_OPTIONS[number]["value"];
type Theme = "light" | "dark" | "system";

export function PreferencesForm({ user }: Props) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const [unit, setUnit]           = useState<"lb" | "kg">(user?.preferences?.defaultWeightUnit ?? "lb");
  const [theme, setThemeState]    = useState<Theme>(user?.preferences?.theme ?? "system");
  const [accent, setAccent]       = useState<AccentColor>(user?.preferences?.accentColor ?? "indigo");
  const [visibility, setVisibility] = useState({
    showTraining:     user?.preferences?.profileVisibility?.showTraining     ?? true,
    showNutrition:    user?.preferences?.profileVisibility?.showNutrition    ?? true,
    showCardio:       user?.preferences?.profileVisibility?.showCardio       ?? true,
    showBodyMetrics:  user?.preferences?.profileVisibility?.showBodyMetrics  ?? false,
  });
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(
    user?.preferences?.showOnLeaderboard ?? false
  );
  const [cacheDuration, setCacheDuration] = useState<CacheDuration>(
    user?.preferences?.formCacheDuration ?? "24h"
  );

  // Sync stored localStorage cache duration with user preference on mount
  useEffect(() => {
    const stored = localStorage.getItem(DRAFT_PREF_KEY) as CacheDuration | null;
    if (stored) setCacheDuration(stored);
  }, []);

  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await updatePreferences({
        defaultWeightUnit: unit,
        theme,
        accentColor: accent,
        profileVisibility: visibility,
        showOnLeaderboard,
        formCacheDuration: cacheDuration,
      });
      if (result.success) {
        setTheme(theme);
        // Sync cache duration to localStorage so the hook can read it client-side
        if (cacheDuration === "off") {
          localStorage.removeItem(DRAFT_PREF_KEY);
        } else {
          localStorage.setItem(DRAFT_PREF_KEY, cacheDuration);
        }
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Weight unit */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">Default weight unit</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Used when logging new sets</p>
        </div>
        <div className="flex gap-2">
          {(["lb", "kg"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
                unit === u
                  ? "bg-primary text-primary-foreground shadow"
                  : "border border-border bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">Theme</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Controls the site color scheme</p>
        </div>
        <div className="flex gap-2">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setThemeState(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                theme === t
                  ? "bg-primary text-primary-foreground shadow"
                  : "border border-border bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Accent color */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">Accent color</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Used for buttons, highlights, and interactive elements</p>
        </div>
        <div className="flex gap-3">
          {ACCENT_OPTIONS.map(({ value, label, color }) => (
            <button
              key={value}
              type="button"
              title={label}
              onClick={() => setAccent(value)}
              className={`flex size-8 items-center justify-center rounded-full transition-all ${color} ${
                accent === value
                  ? "ring-2 ring-offset-2 ring-offset-background ring-current scale-110"
                  : "opacity-60 hover:opacity-90"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Profile visibility */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">Public profile visibility</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Choose which logged data is visible on your public profile</p>
        </div>
        <div className="flex flex-col gap-2">
          {(
            [
              { key: "showTraining",    label: "Training sessions" },
              { key: "showNutrition",   label: "Nutrition logs" },
              { key: "showCardio",      label: "Cardio sessions" },
              { key: "showBodyMetrics", label: "Body weight" },
            ] as const
          ).map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
              <span className="text-sm">{label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={visibility[key]}
                onClick={() => setVisibility((v) => ({ ...v, [key]: !v[key] }))}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                  visibility[key] ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`block size-4 rounded-full bg-white shadow transition-transform ${
                    visibility[key] ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </div>

      {/* Community leaderboard opt-in */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">Community leaderboard</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Show your weekly workout volume on the community leaderboard</p>
        </div>
        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <span className="text-sm">Appear on leaderboard</span>
          <button
            type="button"
            role="switch"
            aria-checked={showOnLeaderboard}
            onClick={() => setShowOnLeaderboard((v) => !v)}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
              showOnLeaderboard ? "bg-primary" : "bg-muted"
            }`}
          >
            <span className={`block size-4 rounded-full bg-white shadow transition-transform ${showOnLeaderboard ? "translate-x-4" : "translate-x-0"}`} />
          </button>
        </label>
      </div>

      {/* Form draft cache duration */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">Form draft caching</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            How long to keep unsaved form drafts if you navigate away or close the tab
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            { value: "1h",  label: "1 hour" },
            { value: "24h", label: "24 hours" },
            { value: "7d",  label: "7 days" },
            { value: "off", label: "Off" },
          ] as { value: CacheDuration; label: string }[]).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCacheDuration(value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                cacheDuration === value
                  ? "bg-primary text-primary-foreground shadow"
                  : "border border-border bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-emerald-600 dark:text-emerald-400">Preferences saved!</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
