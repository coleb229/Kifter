"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { CardioSession } from "@/types";

type ChartMode = "duration" | "distance" | "calories";

interface DataPoint {
  date: string;
  duration: number;
  distance: number;
  calories: number;
  activity: string;
}

interface TooltipPayload {
  value: number;
  payload: DataPoint;
}

function CustomTooltip({
  active,
  payload,
  label,
  mode,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  mode: ChartMode;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  const point = payload[0]?.payload;

  const unit =
    mode === "duration" ? "min" : mode === "distance" ? "km" : "kcal";

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">{point.activity}</p>
      <p className="mt-1 text-base font-bold">
        {value}{" "}
        <span className="text-sm font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

const MODES: { id: ChartMode; label: string; color: string; activeClass: string }[] = [
  { id: "duration", label: "Duration", color: "#0ea5e9", activeClass: "bg-sky-500 text-white shadow" },
  { id: "distance", label: "Distance", color: "#06b6d4", activeClass: "bg-cyan-500 text-white shadow" },
  { id: "calories", label: "Calories", color: "#f97316", activeClass: "bg-orange-500 text-white shadow" },
];

interface Props {
  sessions: CardioSession[];
}

export function CardioAnalyticsChart({ sessions }: Props) {
  const [mode, setMode] = useState<ChartMode>("duration");

  // Build per-session chart points, sorted by date ascending
  const data: DataPoint[] = [...sessions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => ({
      date: format(parseISO(s.date), "MMM d"),
      duration: s.duration,
      distance: s.distance !== undefined
        ? (s.distanceUnit === "mi" ? parseFloat((s.distance * 1.60934).toFixed(2)) : s.distance)
        : 0,
      calories: s.caloriesBurned ?? 0,
      activity: s.activityType,
    }));

  const activeMode = MODES.find((m) => m.id === mode)!;
  const unit = mode === "duration" ? "min" : mode === "distance" ? "km" : "kcal";

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-5 flex gap-1.5 flex-wrap">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === m.id
                ? m.activeClass
                : "border border-border bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {data.length < 2 ? (
        <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          {data.length === 0
            ? "No data yet."
            : "Log at least 2 sessions to see a trend."}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#888" strokeOpacity={0.15} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#888" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#888" }}
              axisLine={false}
              tickLine={false}
              label={{
                value: unit,
                angle: -90,
                position: "insideLeft",
                fontSize: 11,
                fill: "#888",
                dx: -2,
              }}
              width={48}
            />
            <Tooltip content={<CustomTooltip mode={mode} />} />
            <Bar
              dataKey={mode}
              fill={activeMode.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
