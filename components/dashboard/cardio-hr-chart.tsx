"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from "recharts";

interface SessionData {
  date: string;
  avgHr: number;
  activity: string;
}

interface Props {
  data: SessionData[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: SessionData }[];
}) {
  if (!active || !payload?.length) return null;
  const { value, payload: session } = payload[0];
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-semibold">{session.date}</p>
      <p className="text-muted-foreground mt-0.5">{session.activity}</p>
      <p className="text-rose-500 font-medium">{value} bpm avg</p>
    </div>
  );
}

export function CardioHrChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border">
        <p className="text-xs text-muted-foreground">No heart rate data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          className="fill-muted-foreground"
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          domain={["auto", "auto"]}
          className="fill-muted-foreground"
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="avgHr"
          stroke="#f43f5e"
          strokeWidth={2}
          dot={<Dot r={3} fill="#f43f5e" strokeWidth={0} />}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
