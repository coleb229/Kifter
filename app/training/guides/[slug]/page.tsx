import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Sprout,
  Flame,
  TrendingUp,
  Apple,
  Moon,
  Dumbbell,
} from "lucide-react";
import { getGuideBySlug, getGuidesByCategory, allGuides } from "@/lib/guides-data";
import type { GuideCategory } from "@/lib/guides-data";

// ── Category config (server-safe — no useState) ───────────────────────────────

const categoryConfig = {
  beginner: {
    label: "Beginner",
    icon: Sprout,
    iconBg: "bg-indigo-100 dark:bg-indigo-950/40",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    badgeBg: "bg-indigo-100 dark:bg-indigo-950/50",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    gradientFrom: "from-indigo-500",
    gradientTo: "to-indigo-700",
    borderAccent: "border-l-indigo-400",
  },
  strength: {
    label: "Strength",
    icon: Flame,
    iconBg: "bg-rose-100 dark:bg-rose-950/40",
    iconColor: "text-rose-600 dark:text-rose-400",
    badgeBg: "bg-rose-100 dark:bg-rose-950/50",
    badgeText: "text-rose-700 dark:text-rose-300",
    gradientFrom: "from-rose-500",
    gradientTo: "to-rose-700",
    borderAccent: "border-l-rose-400",
  },
  hypertrophy: {
    label: "Hypertrophy",
    icon: TrendingUp,
    iconBg: "bg-emerald-100 dark:bg-emerald-950/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/50",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-emerald-700",
    borderAccent: "border-l-emerald-400",
  },
  nutrition: {
    label: "Nutrition",
    icon: Apple,
    iconBg: "bg-amber-100 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-100 dark:bg-amber-950/50",
    badgeText: "text-amber-700 dark:text-amber-300",
    gradientFrom: "from-amber-500",
    gradientTo: "to-orange-600",
    borderAccent: "border-l-amber-400",
  },
  recovery: {
    label: "Recovery",
    icon: Moon,
    iconBg: "bg-violet-100 dark:bg-violet-950/40",
    iconColor: "text-violet-600 dark:text-violet-400",
    badgeBg: "bg-violet-100 dark:bg-violet-950/50",
    badgeText: "text-violet-700 dark:text-violet-300",
    gradientFrom: "from-violet-500",
    gradientTo: "to-violet-700",
    borderAccent: "border-l-violet-400",
  },
  compound: {
    label: "Compound Lifts",
    icon: Dumbbell,
    iconBg: "bg-orange-100 dark:bg-orange-950/40",
    iconColor: "text-orange-600 dark:text-orange-400",
    badgeBg: "bg-orange-100 dark:bg-orange-950/50",
    badgeText: "text-orange-700 dark:text-orange-300",
    gradientFrom: "from-orange-500",
    gradientTo: "to-red-600",
    borderAccent: "border-l-orange-400",
  },
};

const difficultyConfig = {
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

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return allGuides.map((g) => ({ slug: g.slug }));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  redirect("/training");
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const cat = categoryConfig[guide.category];
  const diff = difficultyConfig[guide.difficulty];
  const CatIcon = cat.icon;

  const related = getGuidesByCategory(guide.category)
    .filter((g) => g.slug !== guide.slug)
    .slice(0, 2);

  return (
    <div className="flex flex-col gap-8">
      {/* Back link */}
      <Link
        href="/training/guides"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All guides
      </Link>

      {/* Hero banner */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${cat.gradientFrom} ${cat.gradientTo} px-7 py-8 text-white animate-fade-up`}
      >
        {/* Orb glows */}
        <div className="animate-orb-a pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-[70px]" />
        <div className="animate-orb-b pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-white/8 blur-[55px]" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <CatIcon className="size-8 text-white" />
          </div>
          <div>
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${cat.badgeBg} ${cat.badgeText}`}>
                {cat.label}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${diff.bg} ${diff.text}`}>
                {diff.label}
              </span>
              <span className="flex items-center gap-1 text-xs text-white/70">
                <Clock className="size-3.5" />
                {guide.readingTime} min read
              </span>
            </div>
            <h1 className="text-2xl font-bold leading-snug sm:text-3xl">
              {guide.title}
            </h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-prose">
              {guide.description}
            </p>
          </div>
        </div>
      </div>

      {/* Tags */}
      {guide.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: "80ms" }}>
          {guide.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Body sections */}
      <div className="flex flex-col gap-6">
        {guide.sections.map((section, i) => (
          <div
            key={i}
            className={`rounded-xl border border-border border-l-4 ${cat.borderAccent} bg-card p-5 animate-fade-up`}
            style={{ animationDelay: `${(i + 1) * 80}ms` }}
          >
            <h2 className="text-base font-semibold mb-2">{section.heading}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>

      {/* Related guides */}
      {related.length > 0 && (
        <div
          className="animate-fade-up"
          style={{ animationDelay: `${(guide.sections.length + 1) * 80}ms` }}
        >
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            More in {cat.label}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {related.map((g) => {
              const rCat = categoryConfig[g.category as GuideCategory];
              const rDiff = difficultyConfig[g.difficulty];
              const RIcon = rCat.icon;
              return (
                <Link
                  key={g.slug}
                  href={`/training/guides/${g.slug}`}
                  className={`group flex flex-col gap-3 rounded-xl border border-border border-l-4 ${rCat.borderAccent} bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${rCat.iconBg}`}>
                      <RIcon className={`size-4 ${rCat.iconColor}`} />
                    </div>
                    <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${rDiff.bg} ${rDiff.text}`}>
                      {rDiff.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-snug">{g.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{g.description}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {g.readingTime} min read
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
