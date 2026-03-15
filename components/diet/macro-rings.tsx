"use client";

interface MacroRingProps {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  color: "indigo" | "emerald" | "amber" | "rose";
}

const colorMap = {
  indigo: {
    stroke: "stroke-indigo-500",
    trackStroke: "stroke-indigo-100 dark:stroke-indigo-950/60",
    text: "text-indigo-600 dark:text-indigo-400",
    bar: "bg-indigo-500",
    barTrack: "bg-indigo-100 dark:bg-indigo-950/60",
  },
  emerald: {
    stroke: "stroke-emerald-500",
    trackStroke: "stroke-emerald-100 dark:stroke-emerald-950/60",
    text: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    barTrack: "bg-emerald-100 dark:bg-emerald-950/60",
  },
  amber: {
    stroke: "stroke-amber-500",
    trackStroke: "stroke-amber-100 dark:stroke-amber-950/60",
    text: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
    barTrack: "bg-amber-100 dark:bg-amber-950/60",
  },
  rose: {
    stroke: "stroke-rose-500",
    trackStroke: "stroke-rose-100 dark:stroke-rose-950/60",
    text: "text-rose-600 dark:text-rose-400",
    bar: "bg-rose-500",
    barTrack: "bg-rose-100 dark:bg-rose-950/60",
  },
};

const RADIUS = 32;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function MacroRing({ label, consumed, target, unit, color }: MacroRingProps) {
  const c = colorMap[color];
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const dash = pct * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Ring — hidden on small mobile, shown sm+ */}
      <div className="relative hidden sm:block">
        <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
          {/* Track */}
          <circle
            cx="40" cy="40" r={RADIUS}
            fill="none"
            strokeWidth="8"
            className={c.trackStroke}
          />
          {/* Progress */}
          <circle
            cx="40" cy="40" r={RADIUS}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
            className={c.stroke}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-sm font-bold leading-none ${c.text}`}>
            {consumed >= 1000 ? `${(consumed / 1000).toFixed(1)}k` : Math.round(consumed)}
          </span>
          <span className="text-[9px] text-muted-foreground mt-0.5">{unit}</span>
        </div>
      </div>

      {/* Bar — shown on mobile only */}
      <div className="sm:hidden w-full">
        <div className={`h-1.5 w-full rounded-full ${c.barTrack}`}>
          <div
            className={`h-1.5 rounded-full ${c.bar} transition-all duration-300`}
            style={{ width: `${pct * 100}%` }}
          />
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
      <MacroRing label="Calories" consumed={calories} target={targets?.calories ?? 0} unit="kcal" color="indigo" />
      <MacroRing label="Protein" consumed={protein} target={targets?.protein ?? 0} unit="g" color="emerald" />
      <MacroRing label="Carbs" consumed={carbs} target={targets?.carbs ?? 0} unit="g" color="amber" />
      <MacroRing label="Fat" consumed={fat} target={targets?.fat ?? 0} unit="g" color="rose" />
    </div>
  );
}
