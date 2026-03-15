"use client";

import { useEffect, useState } from "react";
import { Flame, Zap, Star, Trophy, Crown, Gem } from "lucide-react";

interface Props {
  streak: number;
}

const MILESTONES = [
  { days: 3,   label: "3-day",   icon: Flame,  bg: "bg-orange-100 dark:bg-orange-950/40",  text: "text-orange-600 dark:text-orange-400" },
  { days: 7,   label: "7-day",   icon: Zap,    bg: "bg-yellow-100 dark:bg-yellow-950/40",  text: "text-yellow-600 dark:text-yellow-400" },
  { days: 14,  label: "14-day",  icon: Star,   bg: "bg-sky-100 dark:bg-sky-950/40",        text: "text-sky-600 dark:text-sky-400" },
  { days: 30,  label: "30-day",  icon: Trophy, bg: "bg-violet-100 dark:bg-violet-950/40",  text: "text-violet-600 dark:text-violet-400" },
  { days: 60,  label: "60-day",  icon: Crown,  bg: "bg-rose-100 dark:bg-rose-950/40",      text: "text-rose-600 dark:text-rose-400" },
  { days: 100, label: "100-day", icon: Gem,    bg: "bg-emerald-100 dark:bg-emerald-950/40",text: "text-emerald-600 dark:text-emerald-400" },
] as const;

export function StreakBadges({ streak }: Props) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger entry animation on mount
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, []);

  const earned = MILESTONES.filter((m) => streak >= m.days);
  if (earned.length === 0) return null;

  // Highest milestone just reached (for glow animation)
  const latest = earned[earned.length - 1];

  return (
    <div className={`mt-2 flex flex-wrap gap-1 transition-opacity duration-500 ${animate ? "opacity-100" : "opacity-0"}`}>
      {earned.map((m) => {
        const Icon = m.icon;
        const isLatest = m === latest;
        return (
          <span
            key={m.days}
            title={`${m.label} streak`}
            className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${m.bg} ${m.text} ${isLatest ? "animate-pulse" : ""}`}
          >
            <Icon className="size-2.5" />
            {m.label}
          </span>
        );
      })}
    </div>
  );
}
