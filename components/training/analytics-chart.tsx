"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import type { SessionDataPoint } from "@/actions/analytics-actions";

type ChartMode = "weight" | "volume" | "reps" | "1rm";

interface Props {
  data: SessionDataPoint[];
  isPending?: boolean;
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────

interface TooltipPayload {
  value: number;
  payload: SessionDataPoint;
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

  let displayValue = "";
  let unit = "";
  let subtitle = "";

  if (mode === "weight") {
    displayValue = point.maxWeightRaw.toString();
    unit = point.maxWeightUnit;
    subtitle = `${point.setCount} set${point.setCount !== 1 ? "s" : ""}`;
  } else if (mode === "volume") {
    displayValue = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString();
    unit = "lb";
    subtitle = `${point.totalReps} total reps`;
  } else if (mode === "1rm") {
    displayValue = value.toString();
    unit = "lb est.";
    subtitle = `${point.setCount} set${point.setCount !== 1 ? "s" : ""}`;
  } else {
    displayValue = value.toString();
    unit = "reps";
    subtitle = `${point.setCount} set${point.setCount !== 1 ? "s" : ""}`;
  }

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold">{label}</p>
      {point.sessionName && (
        <p className="text-xs text-muted-foreground">{point.sessionName}</p>
      )}
      <p className="mt-1 text-base font-bold">
        {displayValue}{" "}
        <span className="text-sm font-normal text-muted-foreground">{unit}</span>
      </p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

// ── Mode toggle ────────────────────────────────────────────────────────────────

const MODES: { id: ChartMode; label: string; color: string; activeClass: string }[] = [
  {
    id: "weight",
    label: "Max Weight",
    color: "#6366f1",
    activeClass: "bg-indigo-600 text-white shadow",
  },
  {
    id: "volume",
    label: "Volume",
    color: "#10b981",
    activeClass: "bg-emerald-500 text-white shadow",
  },
  {
    id: "reps",
    label: "Reps",
    color: "#f59e0b",
    activeClass: "bg-amber-500 text-white shadow",
  },
  {
    id: "1rm",
    label: "1RM Est.",
    color: "#e879f9",
    activeClass: "bg-fuchsia-500 text-white shadow",
  },
];

// ── Skeleton ───────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="flex h-75 items-end gap-2 px-2">
      {[40, 55, 35, 70, 60, 80, 65, 90, 75, 85].map((h, i) => (
        <div
          key={i}
          className="flex-1 animate-pulse rounded-t-sm bg-muted"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

// ── AnalyticsChart ─────────────────────────────────────────────────────────────

export function AnalyticsChart({ data, isPending }: Props) {
  const [mode, setMode] = useState<ChartMode>("weight");
  const activeMode = MODES.find((m) => m.id === mode)!;

  const yDataKey =
    mode === "weight" ? "maxWeightLb"
    : mode === "volume" ? "totalVolumeLb"
    : mode === "1rm" ? "estimated1RM"
    : "totalReps";

  const yLabel = mode === "volume" ? "lb" : mode === "reps" ? "reps" : "lb";

  const tickFormatter = (v: number) =>
    mode === "volume" && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);

  // PR point — highest value across all data
  const prPoint = data.reduce<SessionDataPoint | null>((best, p) => {
    const val = mode === "weight" ? p.maxWeightLb : mode === "volume" ? p.totalVolumeLb : mode === "1rm" ? p.estimated1RM : p.totalReps;
    const bestVal = best ? (mode === "weight" ? best.maxWeightLb : mode === "volume" ? best.totalVolumeLb : mode === "1rm" ? best.estimated1RM : best.totalReps) : -Infinity;
    return val > bestVal ? p : best;
  }, null);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Mode toggle */}
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

      {isPending ? (
        <ChartSkeleton />
      ) : data.length < 2 ? (
        <div className="flex h-75 lg:h-105 items-center justify-center text-sm text-muted-foreground">
          {data.length === 0
            ? "No data for this exercise."
            : "Log at least 2 sessions to see a trend."}
        </div>
      ) : mode === "weight" || mode === "1rm" ? (
        <ResponsiveContainer width="100%" height="100%" className="h-75 lg:h-105">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="irmGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e879f9" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#e879f9" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#888" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: "#888" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={tickFormatter}
              label={{ value: yLabel, angle: -90, position: "insideLeft", fontSize: 11, fill: "#888", dx: -2 }}
              width={48}
            />
            <Tooltip content={<CustomTooltip mode={mode} />} cursor={{ fill: "rgba(128,128,128,0.08)" }} />
            <Area
              type="monotone"
              dataKey={yDataKey}
              stroke={mode === "1rm" ? "#e879f9" : "#818cf8"}
              strokeWidth={3}
              fill={mode === "1rm" ? "url(#irmGradient)" : "url(#weightGradient)"}
              dot={{ fill: mode === "1rm" ? "#e879f9" : "#818cf8", r: 4, strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ fill: mode === "1rm" ? "#e879f9" : "#818cf8", r: 6, strokeWidth: 2, stroke: "#fff" }}
            />
            {prPoint && (
              <ReferenceDot
                x={prPoint.date}
                y={mode === "1rm" ? prPoint.estimated1RM : prPoint.maxWeightLb}
                r={7}
                fill={mode === "1rm" ? "#e879f9" : "#818cf8"}
                stroke="#fff"
                strokeWidth={2}
                label={{ value: "PR", position: "top", fontSize: 10, fill: mode === "1rm" ? "#e879f9" : "#818cf8", fontWeight: 700 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      ) : mode === "volume" ? (
        <ResponsiveContainer width="100%" height="100%" className="h-75 lg:h-105">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.85} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#888" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: "#888" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={tickFormatter}
              label={{ value: yLabel, angle: -90, position: "insideLeft", fontSize: 11, fill: "#888", dx: -2 }}
              width={48}
            />
            <Tooltip content={<CustomTooltip mode={mode} />} cursor={{ fill: "rgba(128,128,128,0.08)" }} />
            <Bar dataKey={yDataKey} fill="url(#volumeGradient)" radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height="100%" className="h-75 lg:h-105">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#888" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: "#888" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={tickFormatter}
              label={{ value: yLabel, angle: -90, position: "insideLeft", fontSize: 11, fill: "#888", dx: -2 }}
              width={48}
            />
            <Tooltip content={<CustomTooltip mode={mode} />} cursor={{ fill: "rgba(128,128,128,0.08)" }} />
            <Line
              type="monotone"
              dataKey={yDataKey}
              stroke="#fbbf24"
              strokeWidth={3}
              dot={{ fill: "#f87171", r: 4, strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ fill: "#f87171", r: 6, strokeWidth: 2, stroke: "#fff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
