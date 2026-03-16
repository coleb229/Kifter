"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { addBodyWeight, deleteBodyWeight } from "@/actions/body-weight-actions";
import type { BodyWeightEntry } from "@/types";
import type { WeightUnit } from "@/lib/weight";

interface Props {
  initialEntries: BodyWeightEntry[];
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; payload: BodyWeightEntry }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold">{label}</p>
      <p className="mt-0.5 text-base font-bold">
        {p.value}{" "}
        <span className="text-sm font-normal text-muted-foreground">
          {p.payload.weightUnit}
        </span>
      </p>
    </div>
  );
}

export function BodyWeightView({ initialEntries }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(todayStr());
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<WeightUnit>("lb");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const entries = initialEntries;

  // Stats
  const current = entries.at(-1);
  const weights = entries.map((e) => e.weight);
  const lowest = weights.length ? Math.min(...weights) : null;
  const highest = weights.length ? Math.max(...weights) : null;
  const last30 = entries.filter((e) => {
    const d = new Date(e.date + "T00:00:00");
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return d >= cutoff;
  });
  const avg30 =
    last30.length
      ? Math.round((last30.reduce((s, e) => s + e.weight, 0) / last30.length) * 10) / 10
      : null;

  // Chart data — format date labels
  const chartData = entries.map((e) => ({
    ...e,
    label: format(new Date(e.date + "T00:00:00"), "MMM d"),
  }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w || w <= 0) { setError("Enter a valid weight."); return; }
    setError("");
    startTransition(async () => {
      await addBodyWeight(date, w, unit, notes.trim() || undefined);
      setWeight("");
      setNotes("");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteBodyWeight(id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Current", value: current ? `${current.weight} ${current.weightUnit}` : "—" },
          { label: "Lowest", value: lowest !== null ? `${lowest} ${entries.find(e => e.weight === lowest)?.weightUnit ?? ""}` : "—" },
          { label: "Highest", value: highest !== null ? `${highest} ${entries.find(e => e.weight === highest)?.weightUnit ?? ""}` : "—" },
          { label: "30-day avg", value: avg30 !== null ? `${avg30} ${current?.weightUnit ?? ""}` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-lg font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {entries.length >= 2 ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-sm font-medium text-muted-foreground">Weight trend</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="bodyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: "#888" }}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#818cf8"
                strokeWidth={3}
                fill="url(#bodyGradient)"
                dot={{ fill: "#818cf8", r: 4, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ fill: "#818cf8", r: 6, strokeWidth: 2, stroke: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : entries.length === 1 ? (
        <div className="rounded-xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">
          Log at least 2 entries to see a trend chart.
        </div>
      ) : null}

      {/* Log form */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-4 text-sm font-semibold">Log weight</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Weight</label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as WeightUnit)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                <option value="lb">lb</option>
                <option value="kg">kg</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Notes (optional)</label>
              <input
                type="text"
                placeholder="e.g. morning"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="self-start rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Log"}
          </button>
        </form>
      </div>

      {/* History */}
      {entries.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <p className="px-5 py-3 text-sm font-semibold border-b border-border">History</p>
          <div className="divide-y divide-border">
            {[...entries].reverse().map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {entry.weight} {entry.weightUnit}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(entry.date + "T00:00:00"), "MMMM d, yyyy")}
                    {entry.notes && ` · ${entry.notes}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  disabled={isPending}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
