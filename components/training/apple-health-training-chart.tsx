"use client";

import { useMemo, useState } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Heart, Clock, Flame, Activity } from "lucide-react";
import { YearPicker } from "@/components/ui/year-picker";
import type { AppleHealthSessionPoint } from "@/actions/analytics-actions";

// ── Color palette per activity label ──────────────────────────────────────────

const LABEL_COLORS: Record<string, string> = {
  "Functional Strength": "#6366f1",
  "Strength Training":   "#6366f1",
  "Core Training":       "#10b981",
  "Pilates":             "#10b981",
  "HIIT":                "#f43f5e",
  "Cross Training":      "#8b5cf6",
  "Yoga":                "#64748b",
};

function colorForLabel(label: string): string {
  return LABEL_COLORS[label] ?? "#94a3b8";
}

// ── Mode config ────────────────────────────────────────────────────────────────

type Mode = "duration" | "heartRate" | "calories";

const MODES: { key: Mode; label: string; unit: string; icon: React.ReactNode }[] = [
  { key: "duration",  label: "Duration",   unit: "min", icon: <Clock  className="size-3.5" /> },
  { key: "heartRate", label: "Heart Rate", unit: "bpm", icon: <Heart  className="size-3.5" /> },
  { key: "calories",  label: "Calories",   unit: "kcal",icon: <Flame  className="size-3.5" /> },
];

function valueForMode(p: AppleHealthSessionPoint, mode: Mode): number | undefined {
  if (mode === "duration")  return p.duration;
  if (mode === "heartRate") return p.heartRateAvg;
  if (mode === "calories")  return p.caloriesBurned;
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────

interface TooltipEntry {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
  mode,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  mode: Mode;
}) {
  if (!active || !payload?.length) return null;
  const unit = MODES.find((m) => m.key === mode)?.unit ?? "";
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-semibold">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-medium">{Math.round(p.value)} {unit}</span>
        </div>
      ))}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}

// ── AppleHealthTrainingChart ───────────────────────────────────────────────────

interface Props {
  data: AppleHealthSessionPoint[];
}

export function AppleHealthTrainingChart({ data }: Props) {
  const [mode, setMode] = useState<Mode>("duration");

  const years = useMemo(
    () => [...new Set(data.map((p) => new Date(p.isoDate).getFullYear()))].sort((a, b) => b - a),
    [data]
  );
  const [selectedYear, setSelectedYear] = useState<number>(() => years[0] ?? new Date().getFullYear());

  const filtered = useMemo(
    () => data.filter((p) => new Date(p.isoDate).getFullYear() === selectedYear),
    [data, selectedYear]
  );

  // Distinct labels present in filtered data
  const labels = useMemo(
    () => [...new Set(filtered.map((p) => p.label))].sort(),
    [filtered]
  );

  // Build flat chart data: one row per session, keyed by date + label
  // For multiple sessions on same date, they stay as separate rows differentiated by time
  const chartData = useMemo(() => {
    return filtered.map((p) => {
      const row: Record<string, string | number> = { date: p.date };
      const val = valueForMode(p, mode);
      if (val !== undefined) row[p.label] = val;
      return row;
    });
  }, [filtered, mode]);

  // Summary stats
  const sessionCount = filtered.length;
  const hrSessions = filtered.filter((p) => p.heartRateAvg);
  const avgHR = hrSessions.length
    ? Math.round(hrSessions.reduce((s, p) => s + p.heartRateAvg!, 0) / hrSessions.length)
    : null;
  const avgDuration = sessionCount
    ? Math.round(filtered.reduce((s, p) => s + p.duration, 0) / sessionCount)
    : null;
  const totalCal = filtered.reduce((s, p) => s + (p.caloriesBurned ?? 0), 0);

  const hasDataForMode = filtered.some((p) => valueForMode(p, mode) !== undefined);

  return (
    <div className="flex flex-col gap-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Activity className="size-3.5" />}
          label="Sessions"
          value={sessionCount > 0 ? String(sessionCount) : "—"}
        />
        <StatCard
          icon={<Clock className="size-3.5" />}
          label="Avg Duration"
          value={avgDuration ? `${avgDuration} min` : "—"}
        />
        <StatCard
          icon={<Heart className="size-3.5" />}
          label="Avg Heart Rate"
          value={avgHR ? `${avgHR} bpm` : "—"}
        />
        <StatCard
          icon={<Flame className="size-3.5" />}
          label="Total Calories"
          value={totalCal > 0 ? `${totalCal.toLocaleString()} kcal` : "—"}
        />
      </div>

      {/* Year picker */}
      {years.length > 1 && (
        <YearPicker years={years} selectedYear={selectedYear} onChange={setSelectedYear} />
      )}

      {/* Mode toggle */}
      <div className="flex gap-1.5 flex-wrap">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === m.key
                ? "bg-primary text-primary-foreground shadow"
                : "border border-border bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {!hasDataForMode ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">No {MODES.find((m) => m.key === mode)?.label.toLowerCase()} data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <Tooltip content={<CustomTooltip mode={mode} />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
            {labels.map((label) => (
              <Line
                key={label}
                type="monotone"
                dataKey={label}
                stroke={colorForLabel(label)}
                strokeWidth={2}
                dot={{ r: 3, fill: colorForLabel(label) }}
                activeDot={{ r: 5 }}
                connectNulls={true}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
