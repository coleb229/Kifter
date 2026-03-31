"use client";

interface Props {
  consumed: number;
  target: number;
}

export function CalorieBudgetBar({ consumed, target }: Props) {
  const pct = target > 0 ? consumed / target : 0;
  const barColor = pct > 1 ? "bg-rose-500" : pct > 0.9 ? "bg-amber-500" : pct > 0.7 ? "bg-emerald-500" : "bg-indigo-500";

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 animate-fade-up" style={{ animationDelay: "80ms" }}>
      <div className="mb-1.5 flex justify-between text-xs font-medium">
        <span>Calories</span>
        <span className={consumed > target ? "text-destructive" : ""}>
          {Math.round(consumed)} / {target} kcal
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor} ${pct > 1 ? "animate-pulse" : ""}`}
          style={{ width: `${Math.min(100, pct * 100)}%` }}
        />
      </div>
    </div>
  );
}
