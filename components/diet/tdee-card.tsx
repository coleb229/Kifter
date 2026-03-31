"use client";

import { useState } from "react";
import type { BodyTarget } from "@/types";
import { calculateTDEE } from "@/lib/tdee";

interface Props {
  todaySessions: { bodyTarget: BodyTarget; durationMinutes?: number }[];
  bodyWeightKg: number;
  onWeightChange: (kg: number) => void;
}

export function TDEECard({ todaySessions, bodyWeightKg, onWeightChange }: Props) {
  const [editingWeight, setEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState(String(Math.round(bodyWeightKg)));
  const tdeeResult = calculateTDEE(todaySessions, bodyWeightKg);

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 animate-fade-up" style={{ animationDelay: "75ms" }}>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Est. TDEE</p>
        <p className="text-lg font-semibold">{tdeeResult.tdee.toLocaleString()} kcal</p>
        <p className="text-[11px] text-muted-foreground">
          {tdeeResult.isBMROnly ? "No workouts today — BMR estimate" : `BMR ${tdeeResult.bmr} + ${todaySessions.length} workout${todaySessions.length !== 1 ? "s" : ""}`}
        </p>
      </div>
      {editingWeight ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="text"
            inputMode="decimal"
            value={weightInput}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setWeightInput(e.target.value)}
            onBlur={(e) => {
              const v = parseFloat(e.target.value);
              if (isNaN(v) || v <= 0) setWeightInput(String(Math.round(bodyWeightKg)));
            }}
            className="h-7 w-16 rounded border border-input bg-background px-1.5 text-sm focus-visible:outline-none"
          />
          <span className="text-xs text-muted-foreground">kg</span>
          <button
            type="button"
            onClick={() => {
              const v = parseFloat(weightInput);
              if (!isNaN(v) && v > 0) onWeightChange(v);
              setEditingWeight(false);
            }}
            className="text-xs font-medium text-primary"
          >
            OK
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditingWeight(true)}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
        >
          {Math.round(bodyWeightKg)} kg
        </button>
      )}
    </div>
  );
}
