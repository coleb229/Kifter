"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Utensils, Activity, Users, AlertTriangle, BrainCircuit } from "lucide-react";
import { updateSiteSettings } from "@/actions/settings-actions";
import type { SiteSettingsDoc } from "@/types";

interface Props {
  settings: SiteSettingsDoc;
}

const FEATURE_CONFIG = [
  { key: "training" as const,  label: "Training",  description: "Workout logging & session history", icon: Dumbbell },
  { key: "nutrition" as const, label: "Nutrition",  description: "Diet tracking & macro targets",    icon: Utensils },
  { key: "cardio" as const,    label: "Cardio",     description: "Cardio session logging",           icon: Activity },
  { key: "community" as const, label: "Community",  description: "Posts & community feed",           icon: Users },
];

export function GlobalSettingsPanel({ settings }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [maintenance, setMaintenance] = useState(settings.maintenanceMode);
  const [features, setFeatures] = useState(settings.features);
  const [aiLimits, setAiLimits] = useState({
    enabled: settings.aiRateLimits?.enabled ?? false,
    sitewideDailyLimit: settings.aiRateLimits?.sitewideDailyLimit ?? 0,
    defaultUserDailyLimit: settings.aiRateLimits?.defaultUserDailyLimit ?? 0,
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await updateSiteSettings({ maintenanceMode: maintenance, features, aiRateLimits: aiLimits });
      setSaved(true);
      router.refresh();
    });
  }

  function toggle(key: keyof typeof features) {
    setFeatures((f) => ({ ...f, [key]: !f[key] }));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Maintenance mode */}
      <div className={`flex items-start justify-between gap-4 rounded-xl border p-5 transition-colors ${
        maintenance ? "border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20" : "border-border bg-card"
      }`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">Maintenance Mode</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Non-admin users see a maintenance page instead of the site
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={maintenance}
          onClick={() => setMaintenance((m) => !m)}
          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
            maintenance ? "bg-amber-500" : "bg-muted"
          }`}
        >
          <span className={`block size-4 rounded-full bg-white shadow transition-transform ${maintenance ? "translate-x-4" : "translate-x-0"}`} />
        </button>
      </div>

      {/* Feature flags */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Feature flags</p>
        {FEATURE_CONFIG.map(({ key, label, description, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
            <div className="flex items-center gap-3">
              <Icon className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={features[key]}
              onClick={() => toggle(key)}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                features[key] ? "bg-primary" : "bg-muted"
              }`}
            >
              <span className={`block size-4 rounded-full bg-white shadow transition-transform ${features[key] ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>
        ))}
      </div>

      {/* AI rate limits */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">AI rate limits</p>

        {/* Enable toggle */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
          <div className="flex items-center gap-3">
            <BrainCircuit className="size-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Enable rate limiting</p>
              <p className="text-xs text-muted-foreground">Enforce daily AI call limits site-wide</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={aiLimits.enabled}
            onClick={() => setAiLimits((l) => ({ ...l, enabled: !l.enabled }))}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${aiLimits.enabled ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`block size-4 rounded-full bg-white shadow transition-transform ${aiLimits.enabled ? "translate-x-4" : "translate-x-0"}`} />
          </button>
        </div>

        {aiLimits.enabled && (
          <div className="flex flex-col gap-3 pl-1">
            <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
              <div>
                <p className="text-sm font-medium">Default per-user daily limit</p>
                <p className="text-xs text-muted-foreground">Max AI calls per user per day (0 = unlimited)</p>
              </div>
              <input
                type="number"
                min={0}
                value={aiLimits.defaultUserDailyLimit}
                onChange={(e) => setAiLimits((l) => ({ ...l, defaultUserDailyLimit: parseInt(e.target.value) || 0 }))}
                className="w-20 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
              <div>
                <p className="text-sm font-medium">Site-wide daily limit</p>
                <p className="text-xs text-muted-foreground">Total AI calls across all users per day (0 = unlimited)</p>
              </div>
              <input
                type="number"
                min={0}
                value={aiLimits.sitewideDailyLimit}
                onChange={(e) => setAiLimits((l) => ({ ...l, sitewideDailyLimit: parseInt(e.target.value) || 0 }))}
                className="w-20 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && <p className="text-sm text-emerald-600 dark:text-emerald-400">Settings saved!</p>}
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
