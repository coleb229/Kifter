"use client";

import { useState, useTransition } from "react";
import { toggleKudos } from "@/actions/kudos-actions";
import type { KudosType } from "@/types";

const KUDOS: { type: KudosType; emoji: string; label: string }[] = [
  { type: "fire",   emoji: "🔥", label: "Fire" },
  { type: "rocket", emoji: "🚀", label: "Rocket" },
  { type: "heart",  emoji: "💜", label: "Heart" },
  { type: "muscle", emoji: "💪", label: "Muscle" },
];

interface Props {
  postId: string;
  kudosCounts: Record<KudosType, number>;
  myKudos?: KudosType;
}

export function KudosBar({ postId, kudosCounts, myKudos }: Props) {
  const [localCounts, setLocalCounts] = useState(kudosCounts);
  const [localMine, setLocalMine] = useState(myKudos);
  const [isPending, startTransition] = useTransition();

  function handleKudos(type: KudosType) {
    // Optimistic update
    setLocalCounts((prev) => {
      const next = { ...prev };
      if (localMine === type) {
        // Removing current reaction
        next[type] = Math.max(0, next[type] - 1);
      } else {
        // Adding new, removing old if any
        if (localMine) next[localMine] = Math.max(0, next[localMine] - 1);
        next[type]++;
      }
      return next;
    });
    setLocalMine((prev) => (prev === type ? undefined : type));

    startTransition(async () => {
      await toggleKudos(postId, type);
    });
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {KUDOS.map(({ type, emoji, label }) => {
        const count = localCounts[type];
        const active = localMine === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => handleKudos(type)}
            disabled={isPending}
            aria-label={label}
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors disabled:opacity-70 ${
              active
                ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300"
                : "border-border bg-muted text-muted-foreground hover:border-indigo-300 hover:text-foreground"
            }`}
          >
            <span className="leading-none">{emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
