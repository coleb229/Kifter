"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Ruler, Calculator } from "lucide-react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { addPhysiqueMeasurement, deletePhysiqueMeasurement } from "@/actions/physique-actions";
import type { PhysiqueMeasurement, MeasurementUnit } from "@/types";

// ── Navy Body Fat Formula ─────────────────────────────────────────────────────

function calcBodyFat(
  gender: "male" | "female",
  neck: number,
  waist: number,
  hips: number | undefined,
  height: number,
  unit: MeasurementUnit
): number | null {
  // Convert to cm for calculation
  const f = unit === "in" ? 2.54 : 1;
  const n = neck * f;
  const w = waist * f;
  const h = height * f;

  if (n <= 0 || w <= n || h <= 0) return null;

  if (gender === "male") {
    const bf = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450;
    return Math.max(0, Math.round(bf * 10) / 10);
  } else {
    if (!hips) return null;
    const hp = hips * f;
    const bf = 495 / (1.29579 - 0.35004 * Math.log10(w + hp - n) + 0.22100 * Math.log10(h)) - 450;
    return Math.max(0, Math.round(bf * 10) / 10);
  }
}

function bfCategory(bf: number, gender: "male" | "female"): { label: string; color: string } {
  if (gender === "male") {
    if (bf < 6)  return { label: "Essential Fat", color: "text-blue-500" };
    if (bf < 14) return { label: "Athletic",      color: "text-emerald-500" };
    if (bf < 18) return { label: "Fitness",       color: "text-green-500" };
    if (bf < 25) return { label: "Average",       color: "text-amber-500" };
    return        { label: "Obese",               color: "text-red-500" };
  } else {
    if (bf < 14) return { label: "Essential Fat", color: "text-blue-500" };
    if (bf < 21) return { label: "Athletic",      color: "text-emerald-500" };
    if (bf < 25) return { label: "Fitness",       color: "text-green-500" };
    if (bf < 32) return { label: "Average",       color: "text-amber-500" };
    return        { label: "Obese",               color: "text-red-500" };
  }
}

// ── Field config ──────────────────────────────────────────────────────────────

const FIELDS: { key: keyof PhysiqueMeasurement; label: string; color: string }[] = [
  { key: "neck",    label: "Neck",       color: "#6366f1" },
  { key: "chest",   label: "Chest",      color: "#8b5cf6" },
  { key: "waist",   label: "Waist",      color: "#f43f5e" },
  { key: "hips",    label: "Hips",       color: "#ec4899" },
  { key: "bicepsL", label: "Bicep (L)",  color: "#10b981" },
  { key: "bicepsR", label: "Bicep (R)",  color: "#14b8a6" },
  { key: "thighL",  label: "Thigh (L)",  color: "#f59e0b" },
  { key: "thighR",  label: "Thigh (R)",  color: "#f97316" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  initialMeasurements: PhysiqueMeasurement[];
}

export function PhysiqueView({ initialMeasurements }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [date, setDate] = useState(todayStr());
  const [unit, setUnit] = useState<MeasurementUnit>("in");
  const [neck, setNeck] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [chest, setChest] = useState("");
  const [bicepsL, setBicepsL] = useState("");
  const [bicepsR, setBicepsR] = useState("");
  const [thighL, setThighL] = useState("");
  const [thighR, setThighR] = useState("");
  const [height, setHeight] = useState("");
  const [error, setError] = useState("");

  // Body fat calculator state
  const [bfGender, setBfGender] = useState<"male" | "female">("male");
  const [bfNeck, setBfNeck] = useState("");
  const [bfWaist, setBfWaist] = useState("");
  const [bfHips, setBfHips] = useState("");
  const [bfHeight, setBfHeight] = useState("");
  const [bfUnit, setBfUnit] = useState<MeasurementUnit>("in");

  const measurements = initialMeasurements;

  // Chart data
  const chartData = useMemo(() =>
    measurements.map((m) => ({
      date: format(new Date(m.date + "T00:00:00"), "MMM d"),
      ...Object.fromEntries(
        FIELDS.map((f) => [f.label, m[f.key] as number | undefined])
      ),
    })),
    [measurements]
  );

  // Latest measurement
  const latest = measurements.at(-1);

  // Body fat result
  const bfResult = useMemo(() => {
    const n = parseFloat(bfNeck);
    const w = parseFloat(bfWaist);
    const h = parseFloat(bfHeight);
    const hp = parseFloat(bfHips) || undefined;
    if (!n || !w || !h) return null;
    return calcBodyFat(bfGender, n, w, hp, h, bfUnit);
  }, [bfGender, bfNeck, bfWaist, bfHips, bfHeight, bfUnit]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const anyFilled = [neck, waist, hips, chest, bicepsL, bicepsR, thighL, thighR].some(Boolean);
    if (!anyFilled) { setError("Enter at least one measurement."); return; }
    setError("");
    startTransition(async () => {
      await addPhysiqueMeasurement({
        date,
        unit,
        neck: neck ? parseFloat(neck) : undefined,
        waist: waist ? parseFloat(waist) : undefined,
        hips: hips ? parseFloat(hips) : undefined,
        chest: chest ? parseFloat(chest) : undefined,
        bicepsL: bicepsL ? parseFloat(bicepsL) : undefined,
        bicepsR: bicepsR ? parseFloat(bicepsR) : undefined,
        thighL: thighL ? parseFloat(thighL) : undefined,
        thighR: thighR ? parseFloat(thighR) : undefined,
        height: height ? parseFloat(height) : undefined,
      });
      [setNeck, setWaist, setHips, setChest, setBicepsL, setBicepsR, setThighL, setThighR, setHeight].forEach(fn => fn(""));
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/40">
          <Ruler className="size-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Physique Measurements</h2>
          <p className="text-sm text-muted-foreground">Track body measurements over time</p>
        </div>
      </div>

      {/* Latest snapshot */}
      {latest && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FIELDS.filter((f) => latest[f.key] !== undefined).map((f) => (
            <div key={f.key} className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">{f.label}</p>
              <p className="mt-0.5 text-lg font-bold">{latest[f.key]} <span className="text-sm font-normal text-muted-foreground">{latest.unit}</span></p>
            </div>
          ))}
        </div>
      )}

      {/* Trend chart */}
      {measurements.length >= 2 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-sm font-medium text-muted-foreground">Measurement trends</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(v) => [`${v} ${latest?.unit ?? ""}`, ""]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              {FIELDS.map((f) => (
                <Line
                  key={f.key}
                  type="monotone"
                  dataKey={f.label}
                  stroke={f.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: f.color }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log form */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-4 text-sm font-semibold">Log measurements</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value as MeasurementUnit)}
                className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30">
                <option value="in">in</option>
                <option value="cm">cm</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Neck", val: neck, set: setNeck },
              { label: "Chest", val: chest, set: setChest },
              { label: "Waist", val: waist, set: setWaist },
              { label: "Hips", val: hips, set: setHips },
              { label: "Bicep (L)", val: bicepsL, set: setBicepsL },
              { label: "Bicep (R)", val: bicepsR, set: setBicepsR },
              { label: "Thigh (L)", val: thighL, set: setThighL },
              { label: "Thigh (R)", val: thighR, set: setThighR },
              { label: `Height (${unit})`, val: height, set: setHeight },
            ].map(({ label, val, set }) => (
              <div key={label} className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">{label}</label>
                <input type="number" step="0.1" min="0" placeholder="—" value={val}
                  onChange={(e) => set(e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
              </div>
            ))}
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button type="submit" disabled={isPending}
            className="self-start rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50">
            {isPending ? "Saving…" : "Log"}
          </button>
        </form>
      </div>

      {/* Body Fat Calculator */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="size-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Body Fat % Calculator (Navy Method)</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Gender</label>
              <select value={bfGender} onChange={(e) => setBfGender(e.target.value as "male" | "female")}
                className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Unit</label>
              <select value={bfUnit} onChange={(e) => setBfUnit(e.target.value as MeasurementUnit)}
                className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30">
                <option value="in">in</option>
                <option value="cm">cm</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Height</label>
              <input type="number" step="0.1" min="0" placeholder={bfUnit === "in" ? "70" : "178"} value={bfHeight}
                onChange={(e) => setBfHeight(e.target.value)}
                className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Neck</label>
              <input type="number" step="0.1" min="0" placeholder="—" value={bfNeck}
                onChange={(e) => setBfNeck(e.target.value)}
                className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Waist (navel)</label>
              <input type="number" step="0.1" min="0" placeholder="—" value={bfWaist}
                onChange={(e) => setBfWaist(e.target.value)}
                className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
            </div>
            {bfGender === "female" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Hips (widest)</label>
                <input type="number" step="0.1" min="0" placeholder="—" value={bfHips}
                  onChange={(e) => setBfHips(e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
              </div>
            )}
          </div>
          {bfResult !== null && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">Estimated Body Fat</p>
                <p className="text-2xl font-bold tabular-nums">{bfResult}%</p>
              </div>
              <div className={`ml-2 text-sm font-semibold ${bfCategory(bfResult, bfGender).color}`}>
                {bfCategory(bfResult, bfGender).label}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Measure neck circumference below the larynx. Measure waist at the navel. For women, measure hips at the widest point.</p>
        </div>
      </div>

      {/* History */}
      {measurements.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <p className="px-5 py-3 text-sm font-semibold border-b border-border">History</p>
          <div className="divide-y divide-border">
            {[...measurements].reverse().map((m) => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {format(new Date(m.date + "T00:00:00"), "MMMM d, yyyy")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {FIELDS.filter((f) => m[f.key] !== undefined)
                      .map((f) => `${f.label}: ${m[f.key]}${m.unit}`)
                      .join(" · ")}
                  </p>
                </div>
                <button type="button" onClick={() => {
                  startTransition(async () => {
                    await deletePhysiqueMeasurement(m.id);
                    router.refresh();
                  });
                }} disabled={isPending}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50">
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
