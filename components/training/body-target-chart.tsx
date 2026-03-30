"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { BodyTargetVolume } from "@/actions/workout-actions";

const TARGET_COLORS: Record<string, string> = {
  Push:         "#3b82f6",
  Pull:         "#8b5cf6",
  Legs:         "#22c55e",
  Cardio:       "#f97316",
  Core:         "#64748b",
  "Upper Body": "#64748b",
  "Lower Body": "#64748b",
  "Full Body":  "#64748b",
  Other:        "#64748b",
};

interface Props {
  data: BodyTargetVolume[];
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: BodyTargetVolume }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold">{d.target}</p>
      <p className="text-muted-foreground">{d.volume.toLocaleString()} lb</p>
      <p className="text-muted-foreground">{d.sessionCount} session{d.sessionCount !== 1 ? "s" : ""}</p>
      <p className="text-muted-foreground">{d.percentage}% of total</p>
    </div>
  );
}

export function BodyTargetChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No training data in the last 4 weeks</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-1 text-base font-semibold">Muscle Group Volume</h2>
      <p className="mb-4 text-xs text-muted-foreground">Last 4 weeks</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={36} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <XAxis dataKey="target" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", radius: 6 }} />
          <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.target} fill={TARGET_COLORS[entry.target] ?? "#64748b"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
