"use client";

import { useState, useTransition } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getVolumeHistory } from "@/actions/workout-actions";
import type { VolumeDayPoint } from "@/actions/workout-actions";

interface Props {
  initialData: VolumeDayPoint[];
  initialPeriod?: 30 | 90;
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function weekOverWeekChange(data: VolumeDayPoint[]): { pct: number; positive: boolean } | null {
  if (data.length < 14) return null;
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const last7 = sorted.slice(-7).reduce((s, d) => s + d.totalVolumeKg, 0);
  const prev7 = sorted.slice(-14, -7).reduce((s, d) => s + d.totalVolumeKg, 0);
  if (prev7 === 0) return null;
  const pct = Math.round(((last7 - prev7) / prev7) * 100);
  return { pct: Math.abs(pct), positive: pct >= 0 };
}

export function VolumeChart({ initialData, initialPeriod = 30 }: Props) {
  const [data, setData] = useState<VolumeDayPoint[]>(initialData);
  const [period, setPeriod] = useState<30 | 90>(initialPeriod);
  const [isPending, startTransition] = useTransition();

  function changePeriod(p: 30 | 90) {
    if (p === period) return;
    setPeriod(p);
    startTransition(async () => {
      const result = await getVolumeHistory(p);
      if (result.success) setData(result.data);
    });
  }

  const wow = weekOverWeekChange(data);
  const chartData = data.map((d) => ({ ...d, label: formatDate(d.date) }));

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Volume Load</h3>
          {wow && (
            <p className={`text-xs ${wow.positive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
              {wow.positive ? "↑" : "↓"} {wow.pct}% vs last week
            </p>
          )}
        </div>
        <div className="flex gap-1">
          {([30, 90] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => changePeriod(p)}
              disabled={isPending}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          No workout data in this period
        </div>
      ) : (
        <div role="img" aria-label="30-day training volume trend">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}kg`}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toLocaleString()} kg`, "Volume"]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="totalVolumeKg" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
