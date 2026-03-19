"use client";

import { useMemo } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { format, subDays, parseISO } from "date-fns";
import type { CardioSession } from "@/types";

interface Props {
  sessions: CardioSession[];
  days?: number;
}

interface TrendPoint {
  date: string;
  avgHr: number | null;
  pace: number | null; // min/km
  durationMin: number;
  activity: string;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === "Pace" && p.value
            ? `${p.name}: ${Math.floor(p.value)}:${String(Math.round((p.value % 1) * 60)).padStart(2, "0")} min/km`
            : p.name === "Duration"
            ? `${p.name}: ${Math.round(p.value)} min`
            : p.name === "Avg HR"
            ? `${p.name}: ${Math.round(p.value)} bpm`
            : `${p.name}: ${p.value}`}
        </p>
      ))}
    </div>
  );
};

export function CardioTrendChart({ sessions, days = 90 }: Props) {
  const trendData = useMemo((): TrendPoint[] => {
    const cutoff = subDays(new Date(), days);
    const recent = sessions
      .filter((s) => parseISO(s.date) >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date));

    return recent.map((s) => {
      let pace: number | null = null;
      if (s.distance && s.distance > 0 && s.duration > 0) {
        const distKm = s.distanceUnit === "mi" ? s.distance * 1.60934 : s.distance;
        const durationMin = s.duration; // already in minutes
        pace = durationMin / distKm;
      }

      return {
        date: format(parseISO(s.date), "MMM d"),
        avgHr: s.avgHeartRate ?? null,
        pace,
        durationMin: s.duration,
        activity: s.activityType,
      };
    });
  }, [sessions, days]);

  const hasHrData = trendData.some((d) => d.avgHr !== null);
  const hasPaceData = trendData.some((d) => d.pace !== null);

  if (trendData.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Not enough data — log more cardio sessions to see trends.
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={trendData} margin={{ top: 8, right: hasPaceData ? 40 : 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            interval={Math.ceil(trendData.length / 10) - 1}
          />
          {/* Left axis: HR */}
          <YAxis
            yAxisId="hr"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
            label={{ value: "bpm", angle: -90, position: "insideLeft", fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          {/* Right axis: Pace */}
          {hasPaceData && (
            <YAxis
              yAxisId="pace"
              orientation="right"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
              label={{ value: "min/km", angle: 90, position: "insideRight", fontSize: 10, fill: "var(--muted-foreground)" }}
              reversed
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {/* Duration as subtle bars */}
          <Bar
            yAxisId="hr"
            dataKey="durationMin"
            name="Duration"
            fill="var(--muted)"
            fillOpacity={0.4}
            maxBarSize={24}
            radius={[2, 2, 0, 0]}
          />
          {/* HR line */}
          {hasHrData && (
            <Line
              yAxisId="hr"
              type="monotone"
              dataKey="avgHr"
              name="Avg HR"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls
            />
          )}
          {/* Pace line */}
          {hasPaceData && (
            <Line
              yAxisId="pace"
              type="monotone"
              dataKey="pace"
              name="Pace"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[10px] text-muted-foreground">
        {hasHrData && hasPaceData
          ? "HR (bpm) on left axis · Pace (min/km, lower = faster) on right axis · bars = session duration"
          : hasHrData
          ? "Avg HR per session over the past 90 days"
          : "Pace per session (min/km) — lower is faster"}
      </p>
    </div>
  );
}
