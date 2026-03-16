"use client";

import { useState, useMemo } from "react";
import { Heart } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CardioSession } from "@/types";

// ── Zone definitions (% of max HR) ───────────────────────────────────────────

const ZONES = [
  { zone: 1, name: "Recovery",    min: 50, max: 60, color: "#64748b" },
  { zone: 2, name: "Aerobic",     min: 60, max: 70, color: "#10b981" },
  { zone: 3, name: "Tempo",       min: 70, max: 80, color: "#f59e0b" },
  { zone: 4, name: "Threshold",   min: 80, max: 90, color: "#f97316" },
  { zone: 5, name: "Max Effort",  min: 90, max: 100, color: "#ef4444" },
];

function getZone(hrPct: number) {
  return ZONES.find((z) => hrPct >= z.min && hrPct < z.max) ?? ZONES[ZONES.length - 1];
}

function getMaxHR(age: number) {
  return 220 - age;
}

interface ZoneRow {
  zone: number;
  name: string;
  color: string;
  minBpm: number;
  maxBpm: number;
  sessions: number;
  totalMin: number;
}

interface Props {
  sessions: CardioSession[];
}

export function HRZoneChart({ sessions }: Props) {
  const [age, setAge] = useState("30");

  const maxHR = useMemo(() => {
    const a = parseInt(age, 10);
    return a > 0 && a < 120 ? getMaxHR(a) : 190;
  }, [age]);

  // Sessions with HR data
  const hrSessions = useMemo(
    () => sessions.filter((s) => s.avgHeartRate && s.avgHeartRate > 0),
    [sessions]
  );

  // Zone breakdown
  const zoneData: ZoneRow[] = useMemo(() => {
    return ZONES.map((z) => {
      const minBpm = Math.round(maxHR * z.min / 100);
      const maxBpm = Math.round(maxHR * z.max / 100);
      const matching = hrSessions.filter(
        (s) => s.avgHeartRate! >= minBpm && s.avgHeartRate! < maxBpm
      );
      return {
        ...z,
        minBpm,
        maxBpm,
        sessions: matching.length,
        totalMin: matching.reduce((s, c) => s + c.duration, 0),
      };
    });
  }, [hrSessions, maxHR]);

  const zoneTargets = useMemo(() => {
    return ZONES.map((z) => ({
      ...z,
      minBpm: Math.round(maxHR * z.min / 100),
      maxBpm: Math.round(maxHR * z.max / 100),
    }));
  }, [maxHR]);

  return (
    <div className="flex flex-col gap-5">
      {/* Age input */}
      <div className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/40">
          <Heart className="size-4 text-rose-500" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Your age:</label>
          <input
            type="number"
            min="10"
            max="100"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm text-center outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          <span className="text-sm text-muted-foreground">→ Max HR: <strong>{maxHR} bpm</strong></span>
        </div>
      </div>

      {/* Zone reference table */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
        {zoneTargets.map((z) => (
          <div key={z.zone} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: z.color }} />
              <span className="text-xs font-semibold">Zone {z.zone}</span>
            </div>
            <p className="text-xs text-muted-foreground">{z.name}</p>
            <p className="text-sm font-bold mt-1 tabular-nums">{z.minBpm}–{z.maxBpm} bpm</p>
            <p className="text-xs text-muted-foreground">{z.min}–{z.max}% HRmax</p>
          </div>
        ))}
      </div>

      {/* Distribution chart */}
      {hrSessions.length > 0 ? (
        <>
          <div>
            <p className="text-sm font-medium mb-1">Session Distribution by Zone</p>
            <p className="text-xs text-muted-foreground">{hrSessions.length} sessions with heart rate data</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={zoneData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#888" strokeOpacity={0.12} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} className="fill-muted-foreground" allowDecimals={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as ZoneRow;
                  return (
                    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
                      <p className="font-semibold mb-1">Zone {d.zone}: {d.name}</p>
                      <p className="text-muted-foreground">{d.minBpm}–{d.maxBpm} bpm</p>
                      <p>{d.sessions} session{d.sessions !== 1 ? "s" : ""} · {d.totalMin} min</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                {zoneData.map((z) => (
                  <Cell key={z.zone} fill={z.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">Log cardio sessions with avg heart rate to see zone distribution</p>
        </div>
      )}
    </div>
  );
}
