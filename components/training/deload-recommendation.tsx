"use client";

import { BatteryWarning } from "lucide-react";
import { BarChart, Bar, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { DeloadRecommendation } from "@/actions/workout-actions";

const INTENSITY_STYLES = {
  low:      { card: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40",   icon: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400",   bar: "#f59e0b" },
  moderate: { card: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/40", icon: "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400", bar: "#f97316" },
  high:     { card: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40",           icon: "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400",           bar: "#ef4444" },
};

interface Props {
  recommendation: DeloadRecommendation;
}

export function DeloadRecommendation({ recommendation }: Props) {
  if (!recommendation.shouldDeload) return null;

  const styles = INTENSITY_STYLES[recommendation.intensity];

  return (
    <div className={`rounded-xl border p-5 animate-fade-up ${styles.card}`}>
      <div className="flex items-start gap-3">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}>
          <BatteryWarning className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold">Deload Week Recommended</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{recommendation.reason}</p>

          {recommendation.weeklyVolumes.some((w) => w.volume > 0) && (
            <div className="mt-3">
              <p className="mb-1 text-[10px] text-muted-foreground uppercase tracking-wide">Weekly volume (last 6 wks)</p>
              <ResponsiveContainer width="100%" height={56}>
                <BarChart data={recommendation.weeklyVolumes} barSize={10}>
                  <Tooltip
                    contentStyle={{ fontSize: 11, padding: "4px 8px" }}
                    formatter={(v) => [`${Number(v).toLocaleString()} lb`, "Volume"]}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
                    {recommendation.weeklyVolumes.map((_, i) => (
                      <Cell key={i} fill={styles.bar} fillOpacity={0.4 + (i / recommendation.weeklyVolumes.length) * 0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <p className="mt-3 text-[11px] text-muted-foreground">
            Tip: Reduce weights by 40–50% and sets by 30–40% this week to let your body recover.
          </p>
        </div>
      </div>
    </div>
  );
}
