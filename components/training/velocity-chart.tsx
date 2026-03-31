"use client";

import { useMemo } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell, Legend,
} from "recharts";
import { format, startOfWeek, endOfWeek } from "date-fns";
import type { SessionDataPoint } from "@/actions/analytics-actions";

interface Props {
  data: SessionDataPoint[];
}

interface WeekBucket {
  weekLabel: string;
  weekStart: Date;
  avgWeight: number;
  totalVolume: number;
}

function buildWeeklyBuckets(data: SessionDataPoint[]): WeekBucket[] {
  if (data.length === 0) return [];

  const sorted = [...data].sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  const bucketMap = new Map<string, { weights: number[]; volumes: number[]; weekStart: Date }>();

  for (const pt of sorted) {
    const d = new Date(pt.isoDate);
    const ws = startOfWeek(d, { weekStartsOn: 1 }); // Mon start
    const key = format(ws, "yyyy-MM-dd");
    if (!bucketMap.has(key)) {
      bucketMap.set(key, { weights: [], volumes: [], weekStart: ws });
    }
    const bucket = bucketMap.get(key)!;
    bucket.weights.push(pt.maxWeightLb);
    bucket.volumes.push(pt.totalVolumeLb);
  }

  return Array.from(bucketMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, { weights, volumes, weekStart }]) => ({
      weekLabel: format(weekStart, "MMM d"),
      weekStart,
      avgWeight: weights.reduce((s, w) => s + w, 0) / weights.length,
      totalVolume: volumes.reduce((s, v) => s + v, 0),
    }));
}

interface VelocityPoint {
  weekLabel: string;
  velocity: number | null;
  rollingAvg: number | null;
  isDeload: boolean;
}

function computeVelocity(buckets: WeekBucket[]): VelocityPoint[] {
  if (buckets.length < 2) return [];

  const result: VelocityPoint[] = [];

  for (let i = 1; i < buckets.length; i++) {
    const prev = buckets[i - 1];
    const curr = buckets[i];
    const velocity = curr.avgWeight - prev.avgWeight;

    // Deload: volume dropped more than 40% from previous week
    const isDeload = prev.totalVolume > 0 && curr.totalVolume < prev.totalVolume * 0.6;

    result.push({ weekLabel: curr.weekLabel, velocity, rollingAvg: null, isDeload });
  }

  // 4-week rolling average of velocity
  const WINDOW = 4;
  for (let i = 0; i < result.length; i++) {
    const start = Math.max(0, i - WINDOW + 1);
    const window = result.slice(start, i + 1).map((r) => r.velocity ?? 0);
    result[i].rollingAvg = window.reduce((s, v) => s + v, 0) / window.length;
  }

  return result;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.name === "Velocity" ? (p.value >= 0 ? "#22c55e" : "#ef4444") : "#818cf8" }}>
          {p.name}: {p.value >= 0 ? "+" : ""}{p.value.toFixed(1)} lb/week
        </p>
      ))}
    </div>
  );
};

export function VelocityChart({ data }: Props) {
  const velocityPoints = useMemo(() => {
    const buckets = buildWeeklyBuckets(data);
    return computeVelocity(buckets);
  }, [data]);

  if (velocityPoints.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Not enough data to compute velocity — log at least 2 weeks of sessions.
      </div>
    );
  }

  const deloadWeeks = velocityPoints.filter((p) => p.isDeload).map((p) => p.weekLabel);

  return (
    <div role="img" aria-label="Rep velocity scatter chart">
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={velocityPoints} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="weekLabel"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(0)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={0} stroke="var(--border)" />
          {deloadWeeks.map((wk) => (
            <ReferenceLine
              key={wk}
              x={wk}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              label={{ value: "Deload", position: "insideTop", fontSize: 9, fill: "var(--muted-foreground)" }}
            />
          ))}
          <Bar dataKey="velocity" name="Velocity" maxBarSize={32} radius={[4, 4, 0, 0]}>
            {velocityPoints.map((entry, i) => (
              <Cell
                key={i}
                fill={(entry.velocity ?? 0) >= 0 ? "#22c55e" : "#ef4444"}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="rollingAvg"
            name="4-Wk Avg"
            stroke="#818cf8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[10px] text-muted-foreground">
        lb/week change in peak weight — green = gain, red = loss, dashed = likely deload
      </p>
    </div>
  );
}
