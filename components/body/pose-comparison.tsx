"use client";

import { useState } from "react";
import { SplitSquareHorizontal, X } from "lucide-react";
import { format } from "date-fns";
import type { ProgressPhoto } from "@/types";

interface Props {
  photos: ProgressPhoto[];
}

export function PoseComparison({ photos }: Props) {
  const [leftId, setLeftId] = useState<string>("");
  const [rightId, setRightId] = useState<string>("");

  const sorted = [...photos].sort((a, b) => a.date.localeCompare(b.date));
  const leftPhoto = sorted.find((p) => p.id === leftId);
  const rightPhoto = sorted.find((p) => p.id === rightId);

  if (photos.length < 2) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
          <SplitSquareHorizontal className="size-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Pose Comparison</h2>
          <p className="text-sm text-muted-foreground">Select two photos to compare side-by-side</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Before</label>
          <select
            value={leftId}
            onChange={(e) => setLeftId(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          >
            <option value="">— Select photo —</option>
            {sorted.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === rightId}>
                {format(new Date(p.date + "T00:00:00"), "MMM d, yyyy")}
                {p.notes ? ` · ${p.notes}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">After</label>
          <select
            value={rightId}
            onChange={(e) => setRightId(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          >
            <option value="">— Select photo —</option>
            {sorted.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === leftId}>
                {format(new Date(p.date + "T00:00:00"), "MMM d, yyyy")}
                {p.notes ? ` · ${p.notes}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison view */}
      {leftPhoto && rightPhoto ? (
        <div className="grid grid-cols-2 gap-2">
          {[
            { photo: leftPhoto, label: "Before" },
            { photo: rightPhoto, label: "After" },
          ].map(({ photo, label }) => (
            <div key={photo.id} className="flex flex-col gap-1.5">
              <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.photoUrl}
                  alt={`${label} — ${photo.date}`}
                  className="w-full object-cover"
                  style={{ maxHeight: "480px", objectPosition: "top" }}
                />
                <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-semibold text-white">
                  {label}
                </span>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {format(new Date(photo.date + "T00:00:00"), "MMMM d, yyyy")}
                {photo.notes && ` · ${photo.notes}`}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">Select a photo for each side to compare</p>
        </div>
      )}

      {(leftId || rightId) && (
        <button
          type="button"
          onClick={() => { setLeftId(""); setRightId(""); }}
          className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-3.5" />
          Clear selection
        </button>
      )}
    </div>
  );
}
