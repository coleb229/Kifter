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

interface DayData {
  day: string;
  sessions: number;
  exercises: number;
}

interface Props {
  data: DayData[];
}

type ChartMode = "sessions" | "exercises";

function CustomTooltip({
  active,
  payload,
  label,
  mode,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  mode: ChartMode;
}) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-semibold">{label}</p>
      <p className="text-muted-foreground mt-0.5">
        {mode === "sessions"
          ? `${val} workout${val !== 1 ? "s" : ""}`
          : `${val} exercise${val !== 1 ? "s" : ""}`}
      </p>
    </div>
  );
}

export function TrainingWeekChart({ data }: Props) {
  const [mode, setMode] = useState<ChartMode>("sessions");
  const dataKey = mode === "sessions" ? "sessions" : "exercises";
  const hasData = data.some((d) => d[dataKey] > 0);

  if (!hasData) {
    return (
      <div>
        <ModeToggle mode={mode} onChange={setMode} />
        <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-border mt-3">
          <p className="text-xs text-muted-foreground">No workouts in the last 7 days</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ModeToggle mode={mode} onChange={setMode} />
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            className="fill-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            className="fill-muted-foreground"
          />
          <Tooltip content={<CustomTooltip mode={mode} />} cursor={{ fill: "transparent" }} />
          <Bar
            dataKey={dataKey}
            fill={mode === "sessions" ? "#6366f1" : "#10b981"}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: ChartMode; onChange: (m: ChartMode) => void }) {
  return (
    <div className="flex gap-1 mb-1">
      {(["sessions", "exercises"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
            mode === m
              ? m === "sessions"
                ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {m === "sessions" ? "Sessions" : "Exercises"}
        </button>
      ))}
    </div>
  );
}
