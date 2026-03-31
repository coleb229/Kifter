"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { MACRO_COLORS } from "@/lib/label-colors";

interface Props {
  totals: { protein: number; carbs: number; fat: number };
}

export function MacroPieChart({ totals }: Props) {
  const proteinKcal = totals.protein * 4;
  const carbsKcal = totals.carbs * 4;
  const fatKcal = totals.fat * 9;
  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal;

  if (totalMacroKcal === 0) return null;

  const pct = (v: number) => Math.round((v / totalMacroKcal) * 100);
  const pieData = [
    { name: "Protein", value: proteinKcal, color: MACRO_COLORS.protein.hex },
    { name: "Carbs",   value: carbsKcal,   color: MACRO_COLORS.carbs.hex },
    { name: "Fat",     value: fatKcal,      color: MACRO_COLORS.fat.hex },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-fade-up" style={{ animationDelay: "70ms" }}>
      <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Macro Split</p>
      <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-6">
        <ResponsiveContainer width="100%" height={180} className="sm:max-w-[220px]">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              dataKey="value"
              label={({ cx, cy }) => (
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="fill-foreground">
                  <tspan x={cx} dy="-0.3em" fontSize={18} fontWeight={600}>{Math.round(totalMacroKcal)}</tspan>
                  <tspan x={cx} dy="1.4em" fontSize={11} fill="currentColor" opacity={0.5}>kcal</tspan>
                </text>
              )}
              labelLine={false}
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            {/* Tooltip removed — hover-only tooltips don't work on mobile touch devices.
                The legend below shows percentages, which is sufficient. */}
          </PieChart>
        </ResponsiveContainer>
        <div className="flex gap-4 text-sm sm:flex-col sm:gap-2">
          {pieData.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="text-muted-foreground">{d.name}</span>
              <span className="font-medium">{pct(d.value)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
