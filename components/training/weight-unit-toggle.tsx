"use client";

import { useWeightUnit } from "@/hooks/use-weight-unit";

export function WeightUnitToggle() {
  const { unit, setUnit } = useWeightUnit();

  return (
    <div className="flex items-center rounded-lg border border-border bg-muted p-0.5 text-xs font-medium">
      <button
        type="button"
        onClick={() => setUnit("kg")}
        className={`rounded-md px-2.5 py-1 transition-colors ${
          unit === "kg"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        kg
      </button>
      <button
        type="button"
        onClick={() => setUnit("lb")}
        className={`rounded-md px-2.5 py-1 transition-colors ${
          unit === "lb"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        lb
      </button>
    </div>
  );
}
