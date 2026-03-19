"use client";

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from "recharts";
import type { MacroAdherenceData } from "@/actions/diet-actions";

interface Props {
  data: MacroAdherenceData;
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-600 dark:text-emerald-400"
    : score >= 50 ? "text-amber-600 dark:text-amber-400"
    : "text-destructive";
  const ring = score >= 80 ? "bg-emerald-100 dark:bg-emerald-950/40"
    : score >= 50 ? "bg-amber-100 dark:bg-amber-950/40"
    : "bg-red-100 dark:bg-red-950/40";

  return (
    <div className={`flex size-20 flex-col items-center justify-center rounded-full ${ring} shrink-0`}>
      <span className={`text-2xl font-bold leading-none tabular-nums ${color}`}>{score}%</span>
      <span className="text-[10px] text-muted-foreground mt-0.5">score</span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.filter((p) => p.value > 0).map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {Math.round(p.value)}{p.name === "Target" ? "" : "kcal"}</p>
      ))}
    </div>
  );
};

export function MacroAdherenceWidget({ data }: Props) {
  const { score, hitDays, loggedDays, chartData, insight } = data;

  // Compact chart data: show 14 days if 28 is too dense
  const displayData = chartData.slice(-14).map((d) => ({
    ...d,
    date: d.date.slice(5), // "MM-DD"
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start gap-4">
        <ScoreGauge score={score} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Macro Adherence</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {loggedDays > 0 ? `${hitDays}/${loggedDays} logged days hit calorie target` : "No data logged yet"}
          </p>
          <p className="mt-2 text-xs text-foreground/80">{insight}</p>
        </div>
      </div>

      {displayData.some((d) => d.calories > 0) && (
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={displayData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} interval={2} />
            <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {data.chartData[0]?.target > 0 && (
              <ReferenceLine y={data.chartData[0].target} stroke="#818cf8" strokeDasharray="4 4" label={{ value: "Target", position: "right", fontSize: 9, fill: "#818cf8" }} />
            )}
            <Bar dataKey="protein" name="Protein" stackId="macros" fill="#22c55e" fillOpacity={0.8} maxBarSize={20} />
            <Bar dataKey="carbs" name="Carbs" stackId="macros" fill="#f59e0b" fillOpacity={0.8} maxBarSize={20} />
            <Bar dataKey="fat" name="Fat" stackId="macros" fill="#ef4444" fillOpacity={0.8} maxBarSize={20} radius={[2, 2, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
