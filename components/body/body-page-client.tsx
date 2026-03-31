"use client";

import { useState, useTransition } from "react";
import { BodyWeightView } from "./body-weight-view";
import { MacroCorrelationChart } from "./macro-correlation-chart";
import { CompositionTimeline } from "./composition-timeline";
import { ProgressGallery } from "./progress-gallery";
import { PhysiqueView } from "./physique-view";
import { PoseComparison } from "./pose-comparison";
import { updatePreferences } from "@/actions/user-actions";
import type { BodyWeightEntry, PhysiqueMeasurement, ProgressPhoto } from "@/types";
import type { MacroCorrelationPoint } from "@/actions/diet-actions";
import type { WeightUnit } from "@/lib/weight";

interface Props {
  entries: BodyWeightEntry[];
  photos: ProgressPhoto[];
  measurements: PhysiqueMeasurement[];
  correlationData: MacroCorrelationPoint[];
  defaultUnit: WeightUnit;
}

export function BodyPageClient({ entries, photos, measurements, correlationData, defaultUnit }: Props) {
  const [displayUnit, setDisplayUnit] = useState<WeightUnit>(defaultUnit);
  const [, startTransition] = useTransition();

  function handleUnitChange(unit: WeightUnit) {
    setDisplayUnit(unit);
    startTransition(async () => {
      await updatePreferences({ defaultWeightUnit: unit });
    });
  }

  return (
    <div className="flex flex-col gap-12">
      {/* Unit toggle */}
      <div className="flex items-center gap-2 animate-fade-up">
        <span className="text-xs text-muted-foreground">Display unit</span>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(["lb", "kg"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => handleUnitChange(u)}
              aria-pressed={displayUnit === u}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                displayUnit === u
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {(entries.length > 0 || measurements.length > 0) && (
        <div className="animate-fade-up" style={{ animationDelay: "40ms" }}>
          <CompositionTimeline
            bodyWeights={entries}
            measurements={measurements}
            photos={photos}
            displayUnit={displayUnit}
          />
        </div>
      )}

      {correlationData.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
          <h2 className="mb-3 text-base font-semibold">Nutrition vs Body Weight</h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <MacroCorrelationChart data={correlationData} displayUnit={displayUnit} />
          </div>
        </div>
      )}

      <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
        <BodyWeightView initialEntries={entries} displayUnit={displayUnit} />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "160ms" }}>
        <PhysiqueView initialMeasurements={measurements} />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
        <ProgressGallery initialPhotos={photos} />
      </div>

      {photos.length >= 2 && (
        <div className="animate-fade-up" style={{ animationDelay: "240ms" }}>
          <PoseComparison photos={photos} />
        </div>
      )}
    </div>
  );
}
