"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { addDays, parseISO, differenceInDays, format } from "date-fns";
import type { SessionDataPoint } from "@/actions/analytics-actions";

interface Props {
  data: SessionDataPoint[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p) =>
        p.value != null ? (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {Math.round(p.value)} lb
          </p>
        ) : null
      )}
    </div>
  );
};

export function StrengthProgressionCurve({ data }: Props) {
  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    const sorted = [...data].sort((a, b) => a.isoDate.localeCompare(b.isoDate));

    // Build historical points (date → estimated1RM)
    const historical = sorted.map((p) => ({
      date: p.date,
      isoDate: p.isoDate,
      actual1RM: Math.round(p.estimated1RM),
      projected1RM: null as number | null,
    }));

    // Compute 30-day linear projection from last 30 days of data
    const now = new Date();
    const cutoff = addDays(now, -30);
    const recent = sorted.filter((p) => parseISO(p.isoDate) >= cutoff);

    if (recent.length >= 2) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      const daySpan = differenceInDays(parseISO(last.isoDate), parseISO(first.isoDate));
      const delta1RM = last.estimated1RM - first.estimated1RM;
      const dailyRate = daySpan > 0 ? delta1RM / daySpan : 0;

      // Add projection points for next 30 days
      const lastDate = parseISO(last.isoDate);
      for (let d = 7; d <= 30; d += 7) {
        const projDate = addDays(lastDate, d);
        const projected1RM = Math.round(last.estimated1RM + dailyRate * d);
        historical.push({
          date: format(projDate, "MMM d"),
          isoDate: projDate.toISOString(),
          actual1RM: null as unknown as number,
          projected1RM,
        });
      }
    }

    return historical.sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  }, [data]);

  const todayLabel = format(new Date(), "MMM d");

  if (chartData.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Log more sessions to see the 1RM progression curve.
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            interval={Math.ceil(chartData.length / 10) - 1}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
            label={{
              value: "1RM (lb)",
              angle: -90,
              position: "insideLeft",
              fontSize: 10,
              fill: "var(--muted-foreground)",
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine
            x={todayLabel}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 2"
            label={{ value: "Today", fontSize: 9, fill: "var(--muted-foreground)" }}
          />
          <Line
            type="monotone"
            dataKey="actual1RM"
            name="Est. 1RM"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="projected1RM"
            name="30-day projection"
            stroke="#6366f1"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[10px] text-muted-foreground">
        Estimated 1RM (Epley formula) over time · dashed = 30-day linear projection
      </p>
    </div>
  );
}
