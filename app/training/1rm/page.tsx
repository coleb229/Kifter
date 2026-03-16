"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calculator } from "lucide-react";

interface FormulaResult {
  name: string;
  value: number;
  description: string;
}

function calcEpley(w: number, r: number): number {
  if (r === 1) return w;
  return w * (1 + r / 30);
}

function calcBrzycki(w: number, r: number): number {
  if (r === 1) return w;
  if (r >= 37) return w; // formula breaks down
  return w * (36 / (37 - r));
}

function calcLombardi(w: number, r: number): number {
  return w * Math.pow(r, 0.10);
}

function calcMayhew(w: number, r: number): number {
  return (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r));
}

function calcOConner(w: number, r: number): number {
  return w * (1 + r / 40);
}

function getFormulas(w: number, r: number): FormulaResult[] {
  return [
    { name: "Epley",     value: calcEpley(w, r),     description: "Most widely used — w × (1 + r/30)" },
    { name: "Brzycki",   value: calcBrzycki(w, r),   description: "Accurate for lower rep ranges — w × 36/(37−r)" },
    { name: "Lombardi",  value: calcLombardi(w, r),  description: "Geometric formula — w × r^0.10" },
    { name: "Mayhew",    value: calcMayhew(w, r),    description: "Accurate for higher reps" },
    { name: "O'Conner",  value: calcOConner(w, r),   description: "Simple estimate — w × (1 + r/40)" },
  ];
}

const TRAINING_PERCENTAGES = [100, 95, 90, 85, 80, 75, 70, 65, 60];

export default function OneRepMaxPage() {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [unit, setUnit] = useState<"lb" | "kg">("lb");

  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  const valid = w > 0 && r >= 1 && r <= 50;

  const results = valid ? getFormulas(w, r) : [];
  const avg = results.length
    ? Math.round(results.reduce((s, f) => s + f.value, 0) / results.length)
    : null;
  const epley = valid ? Math.round(calcEpley(w, r)) : null;

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/training"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Training
      </Link>

      <div className="flex items-center gap-3 animate-fade-up">
        <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/40">
          <Calculator className="size-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">1RM Calculator</h1>
          <p className="text-sm text-muted-foreground">Compare Epley, Brzycki, Lombardi, Mayhew &amp; O'Conner formulas</p>
        </div>
      </div>

      {/* Input */}
      <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <p className="text-sm font-semibold">Enter your lift</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Weight</label>
            <input
              type="number"
              min="0"
              step="0.5"
              placeholder="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as "lb" | "kg")}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            >
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Reps (1–50)</label>
            <input
              type="number"
              min="1"
              max="50"
              step="1"
              placeholder="0"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </div>
        {w > 0 && r > 50 && (
          <p className="text-xs text-destructive">Rep count above 50 is outside reliable 1RM estimation range.</p>
        )}
      </div>

      {valid && results.length > 0 && (
        <>
          {/* Formula comparison */}
          <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-up" style={{ animationDelay: "80ms" }}>
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-semibold">Formula Comparison</p>
              {avg && (
                <span className="text-xs text-muted-foreground">
                  Average: <span className="font-semibold text-foreground">{avg} {unit}</span>
                </span>
              )}
            </div>
            <div className="divide-y divide-border">
              {results.map((f) => {
                const rounded = Math.round(f.value);
                const pct = epley ? Math.round((rounded / epley) * 100) : 100;
                return (
                  <div key={f.name} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold tabular-nums">{rounded} <span className="text-sm font-normal text-muted-foreground">{unit}</span></p>
                      {f.name !== "Epley" && (
                        <p className="text-xs text-muted-foreground">{pct}% of Epley</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Training percentages */}
          <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-up" style={{ animationDelay: "100ms" }}>
            <div className="px-5 py-3 border-b border-border">
              <p className="text-sm font-semibold">Training Percentages</p>
              <p className="text-xs text-muted-foreground mt-0.5">Based on Epley estimate ({epley} {unit})</p>
            </div>
            <div className="divide-y divide-border">
              {TRAINING_PERCENTAGES.map((pct) => {
                const load = Math.round((epley! * pct) / 100);
                const repsInZone =
                  pct >= 95 ? "1–2 reps" :
                  pct >= 85 ? "2–4 reps" :
                  pct >= 80 ? "4–6 reps" :
                  pct >= 70 ? "6–10 reps" :
                  pct >= 60 ? "10–15 reps" : "15+ reps";
                return (
                  <div key={pct} className="flex items-center justify-between px-5 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium w-10 tabular-nums">{pct}%</span>
                      <span className="text-xs text-muted-foreground">{repsInZone}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{load} {unit}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!valid && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Enter a weight and rep count above to calculate your estimated 1RM.
        </div>
      )}
    </div>
  );
}
