"use client";

import { useState, useTransition } from "react";
import {
  BarChart2,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  Trophy,
  Loader2,
} from "lucide-react";
import { generateAdminInsights } from "@/actions/ai-actions";
import type { AIInsight, InsightType } from "@/types";

// ── Config ────────────────────────────────────────────────────────────────────

const insightConfig: Record<
  InsightType,
  { icon: React.ElementType; iconBg: string; iconColor: string; badgeClass: string }
> = {
  achievement: {
    icon: Trophy,
    iconBg: "bg-indigo-100 dark:bg-indigo-950/40",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    badgeClass: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  },
  progress: {
    icon: TrendingUp,
    iconBg: "bg-emerald-100 dark:bg-emerald-950/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  suggestion: {
    icon: Lightbulb,
    iconBg: "bg-amber-100 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-rose-100 dark:bg-rose-950/40",
    iconColor: "text-rose-600 dark:text-rose-400",
    badgeClass: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  },
};

// ── InsightCard ───────────────────────────────────────────────────────────────

function InsightCard({ insight, index }: { insight: AIInsight; index: number }) {
  const cfg = insightConfig[insight.type] ?? insightConfig.suggestion;
  const Icon = cfg.icon;

  return (
    <div
      className="rounded-xl border border-border bg-card p-5 animate-fade-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${cfg.iconBg}`}
        >
          <Icon className={`size-4 ${cfg.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{insight.title}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${cfg.badgeClass}`}
            >
              {insight.type}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{insight.body}</p>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function InsightSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 size-8 shrink-0 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 w-2/5 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-3/4 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

// ── AISiteInsights ────────────────────────────────────────────────────────────

export function AISiteInsights() {
  const [insights, setInsights] = useState<AIInsight[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateAdminInsights();
      if (result.success) {
        setInsights(result.data);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="size-4 text-indigo-500" />
          <h2 className="text-sm font-semibold">Site Intelligence</h2>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
            All users
          </span>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <BarChart2 className="size-3.5" />
              {insights ? "Re-analyze" : "Analyze Site"}
            </>
          )}
        </button>
      </div>

      {/* Pending */}
      {isPending && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <InsightSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {!isPending && error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Idle */}
      {!isPending && !error && !insights && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <BarChart2 className="mx-auto mb-3 size-6 text-muted-foreground/40" />
          <p className="text-sm font-medium">No analysis yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Click "Analyze Site" to generate AI-powered insights on user growth, engagement, and
            platform health.
          </p>
        </div>
      )}

      {/* Results */}
      {!isPending && insights && insights.length > 0 && (
        <div className="flex flex-col gap-3">
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
