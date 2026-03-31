"use client";

import { MACRO_COLORS } from "@/lib/label-colors";

interface Props {
  totals: { protein: number; carbs: number; fat: number; calories: number };
  targets: { protein: number; carbs: number; fat: number; calories: number };
}

export function MacroSummaryBar({ totals, targets }: Props) {
  return (
    <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-4 flex items-center gap-4 border-b border-border bg-background/95 px-4 py-2 text-xs backdrop-blur shadow-sm animate-fade-up">
      {([
        { label: "P", value: totals.protein, target: targets.protein, color: MACRO_COLORS.protein.text },
        { label: "C", value: totals.carbs,   target: targets.carbs,   color: MACRO_COLORS.carbs.text },
        { label: "F", value: totals.fat,     target: targets.fat,     color: MACRO_COLORS.fat.text },
      ] as const).map(({ label, value, target, color }) => (
        <span key={label}>
          <span className={`font-semibold ${color}`}>{label}</span>{" "}
          {Math.round(value)}/{target}g
        </span>
      ))}
      <span className="ml-auto text-muted-foreground">
        {Math.round(totals.calories)}/{targets.calories} kcal
      </span>
    </div>
  );
}
