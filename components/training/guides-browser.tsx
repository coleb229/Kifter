"use client";

import { useState } from "react";
import {
  Compass,
  LayoutGrid,
  Search,
  Sprout,
  Flame,
  TrendingUp,
  Apple,
  Moon,
  Dumbbell,
  Clock,
  ArrowRight,
  ChevronRight,
  X,
} from "lucide-react";
import type {
  Guide,
  GuideCategory,
  GuideDifficulty,
} from "@/lib/guides-data";
import { CATEGORIES, getFeaturedGuide } from "@/lib/guides-data";

// ── Category config ───────────────────────────────────────────────────────────

type CategoryMeta = {
  label: string;
  color: string;
  activeBg: string;
  activeText: string;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
  iconColor: string;
  borderAccent: string;
  gradientFrom: string;
  gradientTo: string;
  icon: React.ElementType;
};

const categoryConfig: Record<GuideCategory, CategoryMeta> = {
  beginner: {
    label: "Beginner",
    color: "indigo",
    activeBg: "bg-indigo-600",
    activeText: "text-white",
    badgeBg: "bg-indigo-100 dark:bg-indigo-950/50",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    iconBg: "bg-indigo-100 dark:bg-indigo-950/40",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    borderAccent: "border-l-indigo-400",
    gradientFrom: "from-indigo-500",
    gradientTo: "to-indigo-700",
    icon: Sprout,
  },
  strength: {
    label: "Strength",
    color: "rose",
    activeBg: "bg-rose-600",
    activeText: "text-white",
    badgeBg: "bg-rose-100 dark:bg-rose-950/50",
    badgeText: "text-rose-700 dark:text-rose-300",
    iconBg: "bg-rose-100 dark:bg-rose-950/40",
    iconColor: "text-rose-600 dark:text-rose-400",
    borderAccent: "border-l-rose-400",
    gradientFrom: "from-rose-500",
    gradientTo: "to-rose-700",
    icon: Flame,
  },
  hypertrophy: {
    label: "Hypertrophy",
    color: "emerald",
    activeBg: "bg-emerald-600",
    activeText: "text-white",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/50",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    iconBg: "bg-emerald-100 dark:bg-emerald-950/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderAccent: "border-l-emerald-400",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-emerald-700",
    icon: TrendingUp,
  },
  nutrition: {
    label: "Nutrition",
    color: "amber",
    activeBg: "bg-amber-500",
    activeText: "text-white",
    badgeBg: "bg-amber-100 dark:bg-amber-950/50",
    badgeText: "text-amber-700 dark:text-amber-300",
    iconBg: "bg-amber-100 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    borderAccent: "border-l-amber-400",
    gradientFrom: "from-amber-500",
    gradientTo: "to-orange-600",
    icon: Apple,
  },
  recovery: {
    label: "Recovery",
    color: "violet",
    activeBg: "bg-violet-600",
    activeText: "text-white",
    badgeBg: "bg-violet-100 dark:bg-violet-950/50",
    badgeText: "text-violet-700 dark:text-violet-300",
    iconBg: "bg-violet-100 dark:bg-violet-950/40",
    iconColor: "text-violet-600 dark:text-violet-400",
    borderAccent: "border-l-violet-400",
    gradientFrom: "from-violet-500",
    gradientTo: "to-violet-700",
    icon: Moon,
  },
  compound: {
    label: "Compound Lifts",
    color: "orange",
    activeBg: "bg-orange-600",
    activeText: "text-white",
    badgeBg: "bg-orange-100 dark:bg-orange-950/50",
    badgeText: "text-orange-700 dark:text-orange-300",
    iconBg: "bg-orange-100 dark:bg-orange-950/40",
    iconColor: "text-orange-600 dark:text-orange-400",
    borderAccent: "border-l-orange-400",
    gradientFrom: "from-orange-500",
    gradientTo: "to-red-600",
    icon: Dumbbell,
  },
};

const difficultyConfig: Record<
  GuideDifficulty,
  { label: string; bg: string; text: string }
> = {
  beginner: {
    label: "Beginner",
    bg: "bg-green-100 dark:bg-green-950/50",
    text: "text-green-700 dark:text-green-300",
  },
  intermediate: {
    label: "Intermediate",
    bg: "bg-yellow-100 dark:bg-yellow-950/50",
    text: "text-yellow-700 dark:text-yellow-300",
  },
  advanced: {
    label: "Advanced",
    bg: "bg-red-100 dark:bg-red-950/50",
    text: "text-red-700 dark:text-red-300",
  },
};

// ── GuideCard ─────────────────────────────────────────────────────────────────

function GuideCard({ guide, index }: { guide: Guide; index: number }) {
  const cat = categoryConfig[guide.category];
  const diff = difficultyConfig[guide.difficulty];
  const CatIcon = cat.icon;

  return (
    <a
      href={`/training/guides/${guide.slug}`}
      className={`group flex flex-col gap-3 rounded-xl border border-border border-l-4 ${cat.borderAccent} bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fade-up`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${cat.iconBg}`}
        >
          <CatIcon className={`size-5 ${cat.iconColor}`} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${cat.badgeBg} ${cat.badgeText}`}
          >
            {cat.label}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${diff.bg} ${diff.text}`}
          >
            {diff.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <p className="font-semibold leading-snug">{guide.title}</p>
        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {guide.description}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" />
          {guide.readingTime} min read
        </span>
        <span className={`flex items-center gap-0.5 font-medium transition-colors group-hover:${cat.iconColor}`}>
          Read guide
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
    </a>
  );
}

// ── CompactGuideCard ──────────────────────────────────────────────────────────

function CompactGuideCard({ guide }: { guide: Guide }) {
  const cat = categoryConfig[guide.category];
  const diff = difficultyConfig[guide.difficulty];
  const CatIcon = cat.icon;

  return (
    <a
      href={`/training/guides/${guide.slug}`}
      className="group flex w-60 shrink-0 flex-col gap-2.5 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-2">
        <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${cat.iconBg}`}>
          <CatIcon className={`size-3.5 ${cat.iconColor}`} />
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${diff.bg} ${diff.text}`}>
          {diff.label}
        </span>
      </div>
      <p className="text-sm font-semibold leading-snug line-clamp-2">{guide.title}</p>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="size-3" />
        {guide.readingTime} min
      </span>
    </a>
  );
}

// ── FeaturedCard ──────────────────────────────────────────────────────────────

function FeaturedCard({ guide }: { guide: Guide }) {
  const cat = categoryConfig[guide.category];
  const diff = difficultyConfig[guide.difficulty];
  const CatIcon = cat.icon;

  return (
    <a
      href={`/training/guides/${guide.slug}`}
      className={`group relative overflow-hidden rounded-2xl bg-linear-to-br ${cat.gradientFrom} ${cat.gradientTo} p-7 text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 animate-fade-up`}
    >
      {/* Orb glows */}
      <div className="animate-orb-a pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-[60px]" />
      <div className="animate-orb-b pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/8 blur-[50px]" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        {/* Icon */}
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
          <CatIcon className="size-7 text-white" />
        </div>

        {/* Text */}
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/90">
              Featured
            </span>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/90">
              {cat.label}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${diff.bg} ${diff.text}`}>
              {diff.label}
            </span>
          </div>
          <h3 className="text-xl font-bold leading-snug sm:text-2xl">{guide.title}</h3>
          <p className="mt-1.5 text-sm text-white/80 leading-relaxed line-clamp-2 sm:line-clamp-none">
            {guide.description}
          </p>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="flex items-center gap-1 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 group-hover:bg-white/30">
            Read Guide
            <ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-3 text-xs text-white/70">
        <Clock className="size-3.5" />
        {guide.readingTime} min read
      </div>
    </a>
  );
}

// ── CategoryTile ──────────────────────────────────────────────────────────────

function CategoryTile({
  category,
  count,
  index,
  onClick,
}: {
  category: GuideCategory;
  count: number;
  index: number;
  onClick: () => void;
}) {
  const cfg = categoryConfig[category];
  const CatIcon = cfg.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-card px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fade-up`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={`flex size-11 items-center justify-center rounded-xl ${cfg.iconBg} transition-transform duration-200 group-hover:scale-110`}>
        <CatIcon className={`size-5 ${cfg.iconColor}`} />
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold">{cfg.label}</p>
        <p className="text-[10px] text-muted-foreground">{count} guide{count !== 1 ? "s" : ""}</p>
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function GuidesBrowser({ guides }: { guides: Guide[] }) {
  const [view, setView] = useState<"discover" | "browse">("discover");
  const [activeCategory, setActiveCategory] = useState<GuideCategory | "all">("all");
  const [activeDifficulty, setActiveDifficulty] = useState<GuideDifficulty | "all">("all");
  const [search, setSearch] = useState("");

  const featured = getFeaturedGuide();

  // Filtered guides for Browse mode
  const filtered = guides.filter((g) => {
    if (activeCategory !== "all" && g.category !== activeCategory) return false;
    if (activeDifficulty !== "all" && g.difficulty !== activeDifficulty) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  function switchToBrowse(category?: GuideCategory) {
    setView("browse");
    if (category) setActiveCategory(category);
  }

  function resetFilters() {
    setActiveCategory("all");
    setActiveDifficulty("all");
    setSearch("");
  }

  return (
    <div className="flex flex-col gap-8">
      {/* View toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1 w-fit">
        <button
          type="button"
          onClick={() => setView("discover")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "discover"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Compass className="size-3.5" />
          Discover
        </button>
        <button
          type="button"
          onClick={() => setView("browse")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "browse"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutGrid className="size-3.5" />
          Browse All
        </button>
      </div>

      {/* ── Discover Mode ────────────────────────────────────────────────────── */}
      {view === "discover" && (
        <div className="flex flex-col gap-8">
          {/* Featured */}
          <FeaturedCard guide={featured} />

          {/* Category tiles */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground animate-fade-up">
              Browse by Category
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat, i) => (
                <CategoryTile
                  key={cat}
                  category={cat}
                  count={guides.filter((g) => g.category === cat).length}
                  index={i}
                  onClick={() => switchToBrowse(cat)}
                />
              ))}
            </div>
          </div>

          {/* Per-category rows */}
          {CATEGORIES.map((cat) => {
            const catGuides = guides.filter((g) => g.category === cat);
            const cfg = categoryConfig[cat];
            const CatIcon = cfg.icon;
            return (
              <div key={cat}>
                <div className="mb-3 flex items-center justify-between animate-fade-up">
                  <div className="flex items-center gap-2">
                    <div className={`flex size-6 items-center justify-center rounded-lg ${cfg.iconBg}`}>
                      <CatIcon className={`size-3.5 ${cfg.iconColor}`} />
                    </div>
                    <h2 className="text-sm font-semibold">{cfg.label}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.badgeBg} ${cfg.badgeText}`}>
                      {catGuides.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchToBrowse(cat)}
                    className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    View all
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {catGuides.map((g) => (
                    <CompactGuideCard key={g.slug} guide={g} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Browse Mode ──────────────────────────────────────────────────────── */}
      {view === "browse" && (
        <div className="flex flex-col gap-5">
          {/* Search */}
          <div className="relative animate-fade-up">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search guides…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-9 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: "60ms" }}>
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === "all"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => {
              const cfg = categoryConfig[cat];
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(isActive ? "all" : cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? `${cfg.activeBg} ${cfg.activeText}`
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Difficulty chips */}
          <div className="flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: "120ms" }}>
            {(["all", "beginner", "intermediate", "advanced"] as const).map((d) => {
              const isActive = activeDifficulty === d;
              const cfg = d !== "all" ? difficultyConfig[d] : null;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setActiveDifficulty(isActive && d !== "all" ? "all" : d)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    isActive
                      ? cfg
                        ? `${cfg.bg} ${cfg.text} ring-1 ring-inset ring-current/30`
                        : "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d === "all" ? "All levels" : difficultyConfig[d].label}
                </button>
              );
            })}
          </div>

          {/* Results info */}
          {filtered.length > 0 && (
            <p className="text-xs text-muted-foreground animate-fade-up" style={{ animationDelay: "160ms" }}>
              {filtered.length} guide{filtered.length !== 1 ? "s" : ""}
              {activeCategory !== "all" || activeDifficulty !== "all" || search ? " matching filters" : ""}
            </p>
          )}

          {/* Guide grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filtered.map((g, i) => (
                <GuideCard key={g.slug} guide={g} index={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-14 text-center animate-fade-up">
              <Search className="mx-auto mb-3 size-6 text-muted-foreground/40" />
              <p className="text-sm font-medium">No guides match your filters</p>
              <p className="mt-1 text-xs text-muted-foreground">Try broadening your search or clearing filters.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 text-xs font-medium text-primary hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
