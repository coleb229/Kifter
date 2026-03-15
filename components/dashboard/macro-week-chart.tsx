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
} from "recharts";

interface DayData {
  day: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  target: number;
}

interface Props {
  data: DayData[];
}

interface TooltipEntry {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-semibold">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-medium">
            {p.name === "target" ? `${Math.round(p.value)} kcal` : `${Math.round(p.value)}g`}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MacroWeekChart({ data }: Props) {
  const hasData = data.some((d) => d.calories > 0);

  if (!hasData) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border">
        <p className="text-xs text-muted-foreground">No diet data in the last 7 days</p>
      </div>
    );
  }

  const hasTarget = data.some((d) => d.target > 0);

  return (
    <ResponsiveContainer width="100%" height={160}>
      <ComposedChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
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
          className="fill-muted-foreground"
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="protein" stackId="m" fill="#10b981" name="protein" radius={[0, 0, 0, 0]} />
        <Bar dataKey="carbs" stackId="m" fill="#f59e0b" name="carbs" radius={[0, 0, 0, 0]} />
        <Bar dataKey="fat" stackId="m" fill="#f43f5e" name="fat" radius={[4, 4, 0, 0]} />
        {hasTarget && (
          <Line
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
