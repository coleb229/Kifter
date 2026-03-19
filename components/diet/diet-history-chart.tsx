"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { DietDaySummary, MacroTarget } from "@/types";

interface Props {
  history: DietDaySummary[];
  targets: MacroTarget | null;
  mode?: "daily" | "monthly";
}

interface TooltipPayloadEntry {
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
  payload?: TooltipPayloadEntry[];
  label?: string;
  mode?: "daily" | "monthly";
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-semibold">{label}{mode === "monthly" ? " avg/day" : ""}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-medium">
            {p.name === "calories" || p.name === "target" ? `${Math.round(p.value)} kcal` : `${Math.round(p.value)}g`}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DietHistoryChart({ history, targets, mode = "daily" }: Props) {
  const data = history.map((d) => ({
    date: mode === "monthly"
      ? format(parseISO(d.date), "MMM")
      : format(parseISO(d.date), "EEE"),
    protein: Math.round(d.protein),
    carbs: Math.round(d.carbs),
    fat: Math.round(d.fat),
    calories: Math.round(d.calories),
    target: targets?.calories ?? 0,
  }));

  const hasData = history.some((d) => d.calories > 0);

  if (!hasData) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border">
        <p className="text-sm text-muted-foreground">
          {mode === "monthly" ? "No diet data for this year" : "No diet data in the last 7 days"}
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: targets ? 48 : 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          className="fill-muted-foreground"
        />
        {/* Left axis: macro grams */}
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          className="fill-muted-foreground"
        />
        {/* Right axis: calories / target (kcal) */}
        {targets && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            className="fill-muted-foreground"
            tickFormatter={(v) => `${Math.round(v)}`}
            width={44}
          />
        )}
        <Tooltip content={<CustomTooltip mode={mode} />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
        />
        <Bar yAxisId="left" dataKey="protein" stackId="macros" fill="#10b981" name="protein" radius={[0, 0, 0, 0]} />
        <Bar yAxisId="left" dataKey="carbs" stackId="macros" fill="#f59e0b" name="carbs" radius={[0, 0, 0, 0]} />
        <Bar yAxisId="left" dataKey="fat" stackId="macros" fill="#f43f5e" name="fat" radius={[4, 4, 0, 0]} />
        {targets && (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="target"
            stroke="#6366f1"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
            name="target"
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
