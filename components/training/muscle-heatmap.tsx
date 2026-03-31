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

// Front/back body SVG muscle overlays.
// ViewBox is 120×200. Body outline:
//   Left arm:  M26,52 Q16,58 12,72 Q8,86 8,100 L10,114 L18,112 Q16,100 16,88 Q16,74 20,64 Q24,56 30,52 Z
//   Right arm: M94,52 Q104,58 108,72 Q112,86 112,100 L110,114 L102,112 Q104,100 104,88 Q104,74 100,64 Q96,56 90,52 Z
// Arm width at upper arm (y≈70-90): outer x≈9-12 (L), 108-112 (R); inner x≈16-19 (L), 101-104 (R).
// All overlays are constrained to stay within these bounds.
const FRONT_MUSCLES: { group: MuscleGroup; label: string; path: string }[] = [
  {
    group: "Chest",
    label: "Chest",
    path: "M36,56 Q60,51 84,56 L81,80 Q60,89 39,80 Z",
  },
  {
    group: "Shoulders",
    label: "Shoulders",
    // Front deltoid — covers the cap of the shoulder at the arm/torso junction
    path: "M21,46 Q33,39 41,50 L38,64 Q26,67 19,57 Z  M79,46 Q87,39 99,46 L101,57 Q94,67 82,64 L79,50 Z",
  },
  {
    group: "Biceps",
    label: "Biceps",
    // Anterior (front-facing) surface of upper arm — fits within arm silhouette
    // Left: inner edge x≈16-20, outer edge x≈11-13, y=64-97
    // Right: mirror around x=60 → inner x≈100-104, outer x≈107-109
    path: "M19,64 Q20,69 18,83 Q16,94 13,97 Q10,91 10,77 Q11,66 15,62 Z  M101,64 Q100,69 102,83 Q104,94 107,97 Q110,91 110,77 Q109,66 105,62 Z",
  },
  {
    group: "Triceps",
    label: "Triceps",
    // Posterior surface — visible only as a thin lateral strip in front view
    // Left: x=9-13 (outer/lateral edge of arm), y=82-112
    // Right: x=107-111, y=82-112
    path: "M12,82 Q13,88 13,106 L11,110 Q9,105 9,90 Q9,84 12,82 Z  M108,82 Q107,88 107,106 L109,110 Q111,105 111,90 Q111,84 108,82 Z",
  },
  {
    group: "Core",
    label: "Core",
    path: "M40,82 Q60,86 80,82 L80,120 Q60,126 40,120 Z",
  },
  {
    group: "Quads",
    label: "Quads",
    path: "M38,122 Q50,120 58,124 L60,165 Q50,168 38,165 Z  M62,124 Q70,120 82,122 L82,165 Q70,168 60,165 Z",
  },
  {
    group: "Hip Flexors",
    label: "Hip Flexors",
    path: "M40,115 Q48,112 58,116 L58,126 Q48,128 38,126 Z  M62,116 Q72,112 80,115 L82,126 Q72,128 62,126 Z",
  },
  {
    group: "Calves",
    label: "Calves",
    path: "M38,168 Q48,165 58,168 L58,192 Q48,196 38,192 Z  M62,168 Q72,165 82,168 L82,192 Q72,196 62,192 Z",
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
    path: "M18,42 Q32,36 40,50 L38,62 Q25,65 17,55 Z  M80,42 Q88,36 102,42 L103,55 Q95,65 82,62 L80,50 Z",
  },
  {
    group: "Triceps",
    label: "Triceps",
    // Posterior (back-facing) surface of upper arm — fills most of upper arm in back view
    // Left: x=10-20, y=64-98 — wider coverage than front view since this is the visible side
    // Right: mirror
    path: "M19,64 Q21,70 19,84 Q17,96 13,98 Q10,92 10,77 Q11,66 16,62 Z  M101,64 Q99,70 101,84 Q103,96 107,98 Q110,92 110,77 Q109,66 104,62 Z",
  },
  {
    group: "Glutes",
    label: "Glutes",
    path: "M38,105 Q60,100 82,105 L82,130 Q60,136 38,130 Z",
  },
  {
    group: "Hamstrings",
    label: "Hamstrings",
    path: "M38,132 Q50,128 58,132 L58,170 Q48,174 38,170 Z  M62,132 Q72,128 82,132 L82,170 Q72,174 62,170 Z",
  },
  {
    group: "Calves",
    label: "Calves",
    path: "M40,172 Q48,170 56,172 L56,192 Q48,196 40,192 Z  M64,172 Q72,170 80,172 L80,192 Q72,196 64,192 Z",
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
        <ellipse cx="60" cy="20" rx="14" ry="16" fill="#d1d5db" className="dark:fill-zinc-700" />
        {/* Neck */}
        <rect x="54" y="34" width="12" height="10" rx="2" fill="#d1d5db" className="dark:fill-zinc-700" />
        {/* Torso — shoulders to hips, clean taper */}
        <path d="M16,46 Q18,42 60,40 Q102,42 104,46 L104,70 Q102,92 98,108 Q94,122 90,132 L86,140 L34,140 L30,132 Q26,122 22,108 Q18,92 16,70 Z" fill="#d1d5db" className="dark:fill-zinc-700" />
        {/* Left arm — tapers from shoulder to forearm */}
        <path d="M26,52 Q16,58 12,72 Q8,86 8,100 L10,114 L18,112 Q16,100 16,88 Q16,74 20,64 Q24,56 30,52 Z" fill="#d1d5db" className="dark:fill-zinc-700" />
        {/* Right arm — mirror */}
        <path d="M94,52 Q104,58 108,72 Q112,86 112,100 L110,114 L102,112 Q104,100 104,88 Q104,74 100,64 Q96,56 90,52 Z" fill="#d1d5db" className="dark:fill-zinc-700" />
        {/* Left leg — clean parallel sides, slight calf curve */}
        <path d="M34,140 L34,162 Q34,180 36,196 L58,196 Q60,180 60,162 L60,140 Z" fill="#d1d5db" className="dark:fill-zinc-700" />
        {/* Right leg — mirror */}
        <path d="M60,140 L60,162 Q60,180 62,196 L84,196 Q86,180 86,162 L86,140 Z" fill="#d1d5db" className="dark:fill-zinc-700" />

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
      <h2 className="mb-1 text-base font-semibold">Muscle Group Volume</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Weekly training volume by muscle group — hover or tap to drill down
      </p>

      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        {/* SVG bodies */}
        <div role="img" aria-label="Muscle group weekly volume heatmap" className="flex gap-6 justify-center">
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
                        ? "bg-primary/10 text-primary"
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
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="mb-1 text-xs font-semibold text-primary">{activeData.muscleGroup}</p>
              <p className="mb-2 text-xs text-muted-foreground">{activeData.volumeLb.toLocaleString()} lb this week</p>
              <div className="flex flex-wrap gap-1">
                {activeData.exercises.map((ex) => (
                  <span key={ex} className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] text-primary">
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
