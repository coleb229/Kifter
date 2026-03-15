"use client";

import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { ImageIcon, Zap, Paintbrush2, Wrench, Server, BarChart2 } from "lucide-react";
import type { ChangelogCategory, ChangelogEntryWithMeta } from "@/lib/parse-changelog";

const CATEGORY_STYLES: Record<
  ChangelogCategory,
  { node: string; chip: string; border: string; shadow: string; dot: string; placeholder: string; icon: React.ElementType }
> = {
  feature: {
    node: "bg-indigo-500",
    chip: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400",
    border: "border-l-indigo-500",
    shadow: "hover:shadow-indigo-500/10",
    dot: "bg-indigo-500",
    placeholder: "from-indigo-500/5",
    icon: Zap,
  },
  design: {
    node: "bg-violet-500",
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
    border: "border-l-violet-500",
    shadow: "hover:shadow-violet-500/10",
    dot: "bg-violet-500",
    placeholder: "from-violet-500/5",
    icon: Paintbrush2,
  },
  fix: {
    node: "bg-rose-500",
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
    border: "border-l-rose-500",
    shadow: "hover:shadow-rose-500/10",
    dot: "bg-rose-500",
    placeholder: "from-rose-500/5",
    icon: Wrench,
  },
  infrastructure: {
    node: "bg-slate-500",
    chip: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400",
    border: "border-l-slate-400",
    shadow: "hover:shadow-slate-500/10",
    dot: "bg-slate-400",
    placeholder: "from-slate-500/5",
    icon: Server,
  },
  analytics: {
    node: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
    border: "border-l-emerald-500",
    shadow: "hover:shadow-emerald-500/10",
    dot: "bg-emerald-500",
    placeholder: "from-emerald-500/5",
    icon: BarChart2,
  },
};

const CATEGORY_LABELS: Record<ChangelogCategory, string> = {
  feature: "Feature",
  design: "Design",
  fix: "Fix",
  infrastructure: "Infrastructure",
  analytics: "Analytics",
};

interface Props {
  entries: ChangelogEntryWithMeta[];
}

export function ChangelogTimelineClient({ entries }: Props) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (observations) => {
        const newlyRevealed: string[] = [];
        for (const obs of observations) {
          if (obs.isIntersecting) {
            const id = (obs.target as HTMLElement).dataset.entryId;
            if (id) {
              newlyRevealed.push(id);
              observer.unobserve(obs.target);
            }
          }
        }
        if (newlyRevealed.length > 0) {
          setRevealedIds((prev) => {
            const next = new Set(prev);
            for (const id of newlyRevealed) next.add(id);
            return next;
          });
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    for (const el of cardRefs.current.values()) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [entries]);

  return (
    <div className="relative">
      {/* Gradient spine */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500 via-violet-500 to-purple-500 opacity-20 md:left-1/2 md:-translate-x-1/2"
      />

      <div className="flex flex-col gap-10 md:gap-14">
        {entries.map((entry, index) => {
          const styles = CATEGORY_STYLES[entry.dominantCategory];
          const CategoryIcon = styles.icon;
          const isEven = index % 2 === 0;
          const isRevealed = revealedIds.has(entry.id);
          const staggerDelay = (index % 3) * 75;

          // Generate title: custom meta title > heading label > first item text (truncated)
          const title =
            entry.meta.title ??
            entry.label ??
            (entry.items[0]?.text.length > 55
              ? entry.items[0]?.text.slice(0, 55) + "…"
              : entry.items[0]?.text ?? "Update");

          return (
            <div
              key={entry.id}
              className={`relative flex items-start gap-6 md:gap-0 ${
                isEven ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              {/* Node dot — mobile: absolute left; desktop: center */}
              <div className="relative z-10 flex-shrink-0 pl-0 md:absolute md:left-1/2 md:-translate-x-1/2 md:top-6 md:pl-0">
                <div
                  className={`size-3 rounded-full border-2 border-background ${styles.node} transition-transform duration-300 group-hover:scale-150 shadow-sm`}
                  style={{ marginLeft: "10px" }}
                />
              </div>

              {/* Spacer for desktop alternating layout */}
              <div className="hidden md:block md:w-[calc(50%-1.5rem)]" />

              {/* Card */}
              <div
                ref={(el) => {
                  if (el) cardRefs.current.set(entry.id, el);
                  else cardRefs.current.delete(entry.id);
                }}
                data-entry-id={entry.id}
                className={`group w-full pl-4 md:w-[calc(50%-1.5rem)] md:pl-0 ${
                  isEven ? "md:pr-8" : "md:pl-8 md:pr-0"
                }`}
                style={{
                  opacity: isRevealed ? 1 : 0,
                  transform: isRevealed ? "translateY(0)" : "translateY(20px)",
                  transition: `opacity 0.5s ease-out ${staggerDelay}ms, transform 0.5s ease-out ${staggerDelay}ms`,
                }}
              >
                {/* Horizontal connector — desktop only */}
                <div
                  aria-hidden
                  className={`hidden md:block absolute top-[1.625rem] h-px w-6 bg-gradient-to-r opacity-30 ${
                    isEven
                      ? "left-1/2 from-violet-500 to-transparent"
                      : "right-1/2 from-transparent to-violet-500"
                  }`}
                />

                <div
                  className={`rounded-xl border border-border bg-card p-5 border-l-2 ${styles.border} ${styles.shadow} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
                >
                  {/* Top row: chip + date */}
                  <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles.chip}`}
                    >
                      <span className={`size-1.5 rounded-full ${styles.node}`} />
                      {CATEGORY_LABELS[entry.dominantCategory]}
                    </span>
                    <time
                      dateTime={entry.date}
                      className="font-mono text-xs text-muted-foreground"
                    >
                      {format(parseISO(entry.date), "MMM d, yyyy")}
                    </time>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-semibold leading-snug mb-3">{title}</h3>

                  {/* Screenshot or placeholder */}
                  {entry.meta.screenshotPath ? (
                    <div className="relative mb-4 w-full aspect-video overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.meta.screenshotPath}
                        alt={entry.meta.screenshotAlt ?? title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="relative mb-4 flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                      <div className="flex flex-col items-center gap-1.5 text-muted-foreground/30">
                        <CategoryIcon className="size-6" />
                        <span className="font-mono text-[10px] tracking-wide uppercase">preview</span>
                      </div>
                      <div
                        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${styles.placeholder} to-transparent`}
                      />
                    </div>
                  )}

                  {/* Item list */}
                  <ul className="space-y-1.5">
                    {entry.items.map((item, i) => {
                      const itemDot = CATEGORY_STYLES[item.category].dot;
                      return (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span
                            className={`mt-1.5 size-1.5 flex-shrink-0 rounded-full ${itemDot} opacity-70`}
                          />
                          {item.text}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
