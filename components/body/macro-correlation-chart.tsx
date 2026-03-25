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
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { MacroCorrelationPoint } from "@/actions/diet-actions";
import { convertWeight } from "@/lib/weight";
import type { WeightUnit } from "@/lib/weight";

interface Props {
  data: MacroCorrelationPoint[];
  displayUnit: WeightUnit;
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
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === "Adherence"
            ? `${p.name}: ${Math.round(p.value)}% of target`
            : `${p.name}: ${p.value}`}
        </p>
      ))}
    </div>
  );
};

export function MacroCorrelationChart({ data, displayUnit }: Props) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: format(parseISO(d.date), "MMM d"),
        adherence: d.calorieAdherence !== null ? Math.round(d.calorieAdherence) : null,
        weight: d.bodyWeight !== null
          ? convertWeight(d.bodyWeight, (d.weightUnit as WeightUnit) || "lb", displayUnit)
          : null,
      })),
    [data, displayUnit]
  );

  const weightUnit = displayUnit;

  const hasAdherence = chartData.some((d) => d.adherence !== null);
  const hasWeight = chartData.some((d) => d.weight !== null);

  if (!hasAdherence && !hasWeight) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Log diet and body weight to see the correlation.
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            interval={Math.ceil(chartData.length / 10) - 1}
          />
          {/* Left axis: body weight */}
          <YAxis
            yAxisId="weight"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
            label={{
              value: weightUnit,
              angle: -90,
              position: "insideLeft",
              fontSize: 10,
              fill: "var(--muted-foreground)",
            }}
          />
          {/* Right axis: calorie adherence % */}
          <YAxis
            yAxisId="adherence"
            orientation="right"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            domain={[0, 200]}
            label={{
              value: "% target",
              angle: 90,
              position: "insideRight",
              fontSize: 10,
              fill: "var(--muted-foreground)",
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {hasWeight && (
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="weight"
              name={`Weight (${weightUnit})`}
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls
            />
          )}
          {hasAdherence && (
            <Line
              yAxisId="adherence"
              type="monotone"
              dataKey="adherence"
              name="Adherence"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls
              strokeDasharray="4 2"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[10px] text-muted-foreground">
        Body weight (left) vs calorie adherence % of target (right, dashed) — last 90 days
      </p>
    </div>
  );
}
