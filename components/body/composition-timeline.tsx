"use client";

import { useMemo, useState } from "react";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend, Dot,
} from "recharts";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import type { BodyWeightEntry, PhysiqueMeasurement, ProgressPhoto } from "@/types";

interface Props {
  bodyWeights: BodyWeightEntry[];
  measurements: PhysiqueMeasurement[];
  photos: ProgressPhoto[];
}

interface TimelinePoint {
  date: string;
  displayDate: string;
  weight?: number;
  waist?: number;
  hips?: number;
  hasPhoto: boolean;
  photoUrl?: string;
  isRecomp?: boolean; // weight stable but waist decreased
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs max-w-[160px]">
      <p className="font-medium mb-1">{label}</p>
      {payload.filter((p) => p.value != null).map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value.toFixed(1)}{p.name === "Weight" ? " lb" : " in/cm"}
        </p>
      ))}
    </div>
  );
};

interface PhotoDotProps {
  cx?: number;
  cy?: number;
  payload?: TimelinePoint;
}

function PhotoDot({ cx, cy, payload }: PhotoDotProps) {
  if (!payload?.hasPhoto) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#818cf8" stroke="white" strokeWidth={2} />
      <text x={cx} y={(cy ?? 0) - 10} textAnchor="middle" fontSize={8} fill="var(--muted-foreground)">📷</text>
    </g>
  );
}

export function CompositionTimeline({ bodyWeights, measurements, photos }: Props) {
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const timelineData = useMemo((): TimelinePoint[] => {
    // Build date-keyed maps
    const weightMap = new Map<string, number>();
    for (const w of bodyWeights) {
      // Normalize to lb for consistent axis
      const weightLb = w.weightUnit === "kg" ? w.weight * 2.20462 : w.weight;
      weightMap.set(w.date, weightLb);
    }

    const measureMap = new Map<string, { waist?: number; hips?: number }>();
    for (const m of measurements) {
      measureMap.set(m.date, { waist: m.waist, hips: m.hips });
    }

    const photoMap = new Map<string, string>();
    for (const p of photos) {
      photoMap.set(p.date, p.photoUrl);
    }

    // Collect all unique dates
    const allDates = new Set([
      ...weightMap.keys(),
      ...measureMap.keys(),
      ...photoMap.keys(),
    ]);

    const sorted = Array.from(allDates).sort();
    const points: TimelinePoint[] = sorted.map((date) => ({
      date,
      displayDate: format(parseISO(date), "MMM d, yy"),
      weight: weightMap.get(date),
      waist: measureMap.get(date)?.waist,
      hips: measureMap.get(date)?.hips,
      hasPhoto: photoMap.has(date),
      photoUrl: photoMap.get(date),
    }));

    // Mark recomposition: weight stable (±2 lb) but waist decreased vs 4 weeks prior
    for (let i = 0; i < points.length; i++) {
      const curr = points[i];
      // Find point ~4 weeks ago
      const currDate = new Date(curr.date);
      const refDate = new Date(currDate);
      refDate.setDate(refDate.getDate() - 28);
      const refPoint = points.slice(0, i).reverse().find((p) => new Date(p.date) <= refDate);

      if (
        refPoint &&
        curr.weight != null && refPoint.weight != null &&
        Math.abs(curr.weight - refPoint.weight) <= 2 &&
        curr.waist != null && refPoint.waist != null &&
        curr.waist < refPoint.waist - 0.3
      ) {
        curr.isRecomp = true;
      }
    }

    return points;
  }, [bodyWeights, measurements, photos]);

  const hasWeight = timelineData.some((d) => d.weight != null);
  const hasWaist = timelineData.some((d) => d.waist != null);
  const hasHips = timelineData.some((d) => d.hips != null);
  const recompDates = timelineData.filter((d) => d.isRecomp).map((d) => d.displayDate);

  if (timelineData.length < 2) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-1 text-sm font-semibold">Body Composition Timeline</h2>
        <p className="mt-8 mb-8 text-center text-sm text-muted-foreground">
          Log body weight and measurements over time to see your composition change here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-1 text-sm font-semibold">Body Composition Timeline</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Weight, waist &amp; hip measurements over time · 📷 = progress photo
        {recompDates.length > 0 && " · ✨ = possible recomposition"}
      </p>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={timelineData} margin={{ top: 12, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            interval={Math.ceil(timelineData.length / 8) - 1}
          />
          <YAxis
            yAxisId="weight"
            tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
            label={{ value: "lb", angle: -90, position: "insideLeft", fontSize: 9, fill: "var(--muted-foreground)" }}
          />
          {(hasWaist || hasHips) && (
            <YAxis
              yAxisId="measurement"
              orientation="right"
              tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
              label={{ value: "in/cm", angle: 90, position: "insideRight", fontSize: 9, fill: "var(--muted-foreground)" }}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />

          {/* Recomp markers */}
          {recompDates.map((date) => (
            <ReferenceLine
              key={date}
              x={date}
              yAxisId="weight"
              stroke="#818cf8"
              strokeDasharray="3 3"
              label={{ value: "✨", position: "top", fontSize: 12 }}
            />
          ))}

          {hasWeight && (
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="weight"
              name="Weight"
              stroke="#22c55e"
              strokeWidth={2}
              dot={<PhotoDot />}
              activeDot={{ r: 4, fill: "#22c55e" }}
              connectNulls
            />
          )}
          {hasWaist && (
            <Line
              yAxisId="measurement"
              type="monotone"
              dataKey="waist"
              name="Waist"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls
            />
          )}
          {hasHips && (
            <Line
              yAxisId="measurement"
              type="monotone"
              dataKey="hips"
              name="Hips"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Photo lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={() => setLightboxPhoto(null)}
        >
          <Image
            src={lightboxPhoto}
            alt="Progress photo"
            width={600}
            height={800}
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
