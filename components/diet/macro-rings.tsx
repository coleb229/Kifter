"use client";

import { MACRO_COLORS, type MacroKey } from "@/lib/label-colors";

interface MacroRingProps {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  color: MacroKey;
}

const RADIUS_LG = 32;
const CIRC_LG = 2 * Math.PI * RADIUS_LG;
const RADIUS_SM = 18;
const CIRC_SM = 2 * Math.PI * RADIUS_SM;

function formatValue(consumed: number) {
  return consumed >= 1000 ? `${(consumed / 1000).toFixed(1)}k` : String(Math.round(consumed));
}

function MacroRing({ label, consumed, target, unit, color }: MacroRingProps) {
  const c = MACRO_COLORS[color];
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;

  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
      {/* Large ring — desktop sm+ */}
      <div className="relative hidden sm:block">
        <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
          <circle cx="40" cy="40" r={RADIUS_LG} fill="none" strokeWidth="8" className={c.trackStroke} />
          <circle cx="40" cy="40" r={RADIUS_LG} fill="none" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${pct * CIRC_LG} ${CIRC_LG}`} className={c.stroke} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-sm font-bold leading-none ${c.text}`}>{formatValue(consumed)}</span>
          <span className="text-[9px] text-muted-foreground mt-0.5">{unit}</span>
        </div>
      </div>

      {/* Compact ring — mobile only */}
      <div className="relative sm:hidden">
        <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
          <circle cx="24" cy="24" r={RADIUS_SM} fill="none" strokeWidth="5" className={c.trackStroke} />
          <circle cx="24" cy="24" r={RADIUS_SM} fill="none" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${pct * CIRC_SM} ${CIRC_SM}`} className={c.stroke} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-[10px] font-bold leading-none ${c.text}`}>{formatValue(consumed)}</span>
          <span className="text-[7px] text-muted-foreground mt-px">{unit}</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">
          {Math.round(consumed)}{target > 0 ? ` / ${Math.round(target)}` : ""} {unit}
        </p>
      </div>
    </div>
  );
}

interface MacroRingsProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  targets: { calories: number; protein: number; carbs: number; fat: number } | null;
}

export function MacroRings({ calories, protein, carbs, fat, targets }: MacroRingsProps) {
  return (
    <div className="grid grid-cols-4 gap-3 rounded-xl border border-border bg-card p-4">
      <MacroRing label="Calories" consumed={calories} target={targets?.calories ?? 0} unit="kcal" color="calories" />
      <MacroRing label="Protein" consumed={protein} target={targets?.protein ?? 0} unit="g" color="protein" />
      <MacroRing label="Carbs" consumed={carbs} target={targets?.carbs ?? 0} unit="g" color="carbs" />
      <MacroRing label="Fat" consumed={fat} target={targets?.fat ?? 0} unit="g" color="fat" />
    </div>
  );
}
