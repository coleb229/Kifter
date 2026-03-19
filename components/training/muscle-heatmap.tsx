"use client";

import { useState, useMemo } from "react";
import type { MuscleGroup } from "@/types";
import type { MuscleVolumeData } from "@/actions/analytics-actions";

interface Props {
  data: MuscleVolumeData[];
}

type ColorBucket = 0 | 1 | 2 | 3;

const BUCKET_COLORS: Record<ColorBucket, string> = {
  0: "fill-muted/40 dark:fill-muted/20",
  1: "fill-indigo-200 dark:fill-indigo-900/60",
  2: "fill-indigo-400 dark:fill-indigo-700",
  3: "fill-indigo-600 dark:fill-indigo-500",
};

const BUCKET_HEX: Record<ColorBucket, string> = {
  0: "#e5e7eb",
  1: "#c7d2fe",
  2: "#818cf8",
  3: "#4f46e5",
};

function getBucket(vol: number, max: number): ColorBucket {
  if (vol === 0 || max === 0) return 0;
  const pct = vol / max;
  if (pct < 0.25) return 1;
  if (pct < 0.6) return 2;
  return 3;
}

// Simplified front/back body SVG paths per muscle group
// Coordinates are in a 120×200 viewBox (front) and 120×200 (back)
const FRONT_MUSCLES: { group: MuscleGroup; label: string; path: string }[] = [
  {
    group: "Chest",
    label: "Chest",
    path: "M35,55 Q60,50 85,55 L82,80 Q60,90 38,80 Z",
  },
  {
    group: "Shoulders",
    label: "Shoulders",
    path: "M20,45 Q35,38 42,50 L38,65 Q25,68 18,58 Z M78,45 Q85,38 100,45 L102,58 Q95,68 82,65 L78,50 Z",
  },
  {
    group: "Biceps",
    label: "Biceps",
    path: "M16,68 Q22,72 24,90 L18,92 Q12,88 12,70 Z M104,68 Q108,72 108,88 Q108,92 102,90 L96,70 Z",
  },
  {
    group: "Triceps",
    label: "Triceps",
    path: "M10,90 Q14,95 16,110 L10,112 Q6,105 7,90 Z M110,90 Q113,95 113,112 L107,110 Q104,95 108,90 Z",
  },
  {
    group: "Core",
    label: "Core",
    path: "M40,82 Q60,86 80,82 L80,120 Q60,126 40,120 Z",
  },
  {
    group: "Quads",
    label: "Quads",
    path: "M38,122 Q50,120 58,124 L60,165 Q50,168 38,165 Z M62,124 Q70,120 82,122 L82,165 Q70,168 60,165 Z",
  },
  {
    group: "Hip Flexors",
    label: "Hip Flexors",
    path: "M40,115 Q48,112 58,116 L58,126 Q48,128 38,126 Z M62,116 Q72,112 80,115 L82,126 Q72,128 62,126 Z",
  },
  {
    group: "Calves",
    label: "Calves",
    path: "M38,168 Q48,165 58,168 L58,192 Q48,196 38,192 Z M62,168 Q72,165 82,168 L82,192 Q72,196 62,192 Z",
  },
];

const BACK_MUSCLES: { group: MuscleGroup; label: string; path: string }[] = [
  {
    group: "Back",
    label: "Back",
    path: "M35,55 Q60,48 85,55 L82,100 Q60,108 38,100 Z",
  },
  {
    group: "Shoulders",
    label: "Shoulders",
    path: "M18,42 Q32,36 40,50 L38,62 Q25,65 17,55 Z M80,42 Q88,36 102,42 L103,55 Q95,65 82,62 L80,50 Z",
  },
  {
    group: "Glutes",
    label: "Glutes",
    path: "M38,105 Q60,100 82,105 L82,130 Q60,136 38,130 Z",
  },
  {
    group: "Hamstrings",
    label: "Hamstrings",
    path: "M38,132 Q50,128 58,132 L58,170 Q48,174 38,170 Z M62,132 Q72,128 82,132 L82,170 Q72,174 62,170 Z",
  },
  {
    group: "Calves",
    label: "Calves",
    path: "M40,172 Q48,170 56,172 L56,192 Q48,196 40,192 Z M64,172 Q72,170 80,172 L80,192 Q72,196 64,192 Z",
  },
];

function BodySVG({
  muscles,
  volumeMap,
  maxVol,
  activeGroup,
  onHover,
  label,
}: {
  muscles: typeof FRONT_MUSCLES;
  volumeMap: Map<MuscleGroup, MuscleVolumeData>;
  maxVol: number;
  activeGroup: MuscleGroup | null;
  onHover: (group: MuscleGroup | null) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
      <svg viewBox="0 0 120 200" className="h-48 w-auto" aria-label={`${label} muscle view`}>
        {/* Body outline */}
        {/* Head */}
        <ellipse cx="60" cy="21" rx="16" ry="18" fill="#d1d5db" className="dark:fill-zinc-700" />
        {/* Neck */}
        <path d="M54,37 Q60,39 66,37 L66,44 Q60,46 54,44 Z" fill="#d1d5db" className="dark:fill-zinc-700" />
        {/* Torso — wide shoulders, tapered waist, hip flare */}
        <path d="M28,44 Q60,40 92,44 Q98,50 96,68 Q100,80 96,95 Q92,110 86,118 Q82,128 82,140 L38,140 Q38,128 34,118 Q28,110 24,95 Q20,80 24,68 Q22,50 28,44 Z" fill="#d1d5db" className="dark:fill-zinc-700" />
        {/* Left arm — angled outward, tapers toward forearm */}
        <path d="M28,48 Q16,52 10,64 Q6,76 8,92 Q8,106 10,114 L16,112 Q14,104 14,92 Q13,78 16,68 Q20,56 30,52 Z" fill="#d1d5db" className="dark:fill-zinc-700" />
        {/* Right arm — mirror */}
        <path d="M92,48 Q104,52 110,64 Q114,76 112,92 Q112,106 110,114 L104,112 Q106,104 106,92 Q107,78 104,68 Q100,56 90,52 Z" fill="#d1d5db" className="dark:fill-zinc-700" />
        {/* Left leg — wide enough to contain quad+calf overlays (x 36-60) */}
        <path d="M36,138 Q28,144 32,165 Q34,180 36,196 L58,196 Q60,180 60,165 Q62,144 60,138 Z" fill="#d1d5db" className="dark:fill-zinc-700" />
        {/* Right leg — mirror (x 60-84) */}
        <path d="M84,138 Q92,144 88,165 Q86,180 84,196 L62,196 Q60,180 60,165 Q58,144 60,138 Z" fill="#d1d5db" className="dark:fill-zinc-700" />

        {/* Muscle group overlays */}
        {muscles.map(({ group, path }) => {
          const muscleData = volumeMap.get(group);
          const vol = muscleData?.volumeLb ?? 0;
          const bucket = getBucket(vol, maxVol);
          const color = BUCKET_HEX[bucket];
          const isActive = activeGroup === group;

          return (
            <path
              key={group}
              d={path}
              fill={color}
              fillOpacity={isActive ? 1 : 0.85}
              stroke={isActive ? "#fff" : "transparent"}
              strokeWidth={isActive ? 1.5 : 0}
              style={{ cursor: "pointer", transition: "fill-opacity 0.15s" }}
              onMouseEnter={() => onHover(group)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onHover(isActive ? null : group)}
              aria-label={group}
            />
          );
        })}
      </svg>
    </div>
  );
}

export function MuscleHeatmap({ data }: Props) {
  const [activeGroup, setActiveGroup] = useState<MuscleGroup | null>(null);

  const { volumeMap, maxVol } = useMemo(() => {
    const volumeMap = new Map<MuscleGroup, MuscleVolumeData>();
    let maxVol = 0;
    for (const d of data) {
      volumeMap.set(d.muscleGroup, d);
      if (d.volumeLb > maxVol) maxVol = d.volumeLb;
    }
    return { volumeMap, maxVol };
  }, [data]);

  const activeData = activeGroup ? volumeMap.get(activeGroup) : null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-1 text-sm font-semibold">Muscle Group Volume</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Weekly training volume by muscle group — hover or tap to drill down
      </p>

      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        {/* SVG bodies */}
        <div className="flex gap-6 justify-center">
          <BodySVG
            muscles={FRONT_MUSCLES}
            volumeMap={volumeMap}
            maxVol={maxVol}
            activeGroup={activeGroup}
            onHover={setActiveGroup}
            label="Front"
          />
          <BodySVG
            muscles={BACK_MUSCLES}
            volumeMap={volumeMap}
            maxVol={maxVol}
            activeGroup={activeGroup}
            onHover={setActiveGroup}
            label="Back"
          />
        </div>

        {/* Legend + drill-down */}
        <div className="flex-1">
          {/* Color legend */}
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Volume:</span>
            {([0, 1, 2, 3] as ColorBucket[]).map((b) => (
              <div key={b} className="flex items-center gap-1">
                <div className={`size-3 rounded-sm ${BUCKET_COLORS[b]}`} style={{ backgroundColor: BUCKET_HEX[b] }} />
                <span className="text-[10px] text-muted-foreground">
                  {b === 0 ? "None" : b === 1 ? "Low" : b === 2 ? "Mid" : "High"}
                </span>
              </div>
            ))}
          </div>

          {/* Volume table */}
          <div className="flex flex-col gap-1.5">
            {data.length === 0 ? (
              <p className="text-xs text-muted-foreground">No workouts logged in the past 7 days.</p>
            ) : (
              data
                .sort((a, b) => b.volumeLb - a.volumeLb)
                .map((d) => (
                  <button
                    key={d.muscleGroup}
                    type="button"
                    onClick={() => setActiveGroup(activeGroup === d.muscleGroup ? null : d.muscleGroup)}
                    className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs transition-colors text-left ${
                      activeGroup === d.muscleGroup
                        ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    <span className="font-medium">{d.muscleGroup}</span>
                    <span className="text-muted-foreground">{d.volumeLb.toLocaleString()} lb</span>
                  </button>
                ))
            )}
          </div>

          {/* Drill-down panel */}
          {activeData && (
            <div className="mt-4 rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/20 p-3">
              <p className="mb-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">{activeData.muscleGroup}</p>
              <p className="mb-2 text-xs text-muted-foreground">{activeData.volumeLb.toLocaleString()} lb this week</p>
              <div className="flex flex-wrap gap-1">
                {activeData.exercises.map((ex) => (
                  <span key={ex} className="rounded-full border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-indigo-950/40 px-2 py-0.5 text-[10px] text-indigo-700 dark:text-indigo-300">
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
