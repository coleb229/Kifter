import Link from "next/link";
import { ArrowLeft, Activity, Dumbbell, BookOpen, Target, Wrench, Clock, AlertTriangle, Lightbulb } from "lucide-react";
import type { PublishedGuide, GuideType } from "@/types";

const TYPE_ICONS: Record<GuideType, React.ReactNode> = {
  stability: <Activity className="size-3.5" />,
  warmup: <Dumbbell className="size-3.5" />,
  form_guide: <BookOpen className="size-3.5" />,
};

const TYPE_COLORS: Record<GuideType, string> = {
  stability: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
  warmup: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
  form_guide: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300",
};

const TYPE_LABELS: Record<GuideType, string> = {
  stability: "Stability / Mobility",
  warmup: "Warmup Routine",
  form_guide: "Form Guide",
};

const DIFFICULTY_COLORS = {
  beginner: "text-emerald-600 dark:text-emerald-400",
  intermediate: "text-amber-600 dark:text-amber-400",
  advanced: "text-rose-600 dark:text-rose-400",
};

interface Props {
  guide: PublishedGuide;
  isDraft?: boolean;
}

export function PublishedGuideView({ guide, isDraft }: Props) {
  const primaryThumb = guide.sourceYoutubeIds[0]
    ? `https://img.youtube.com/vi/${guide.sourceYoutubeIds[0]}/maxresdefault.jpg`
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        href="/training/guides"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        All Guides
      </Link>

      {isDraft && (
        <div className="mb-4 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
          This guide is a draft — only visible to admins.
        </div>
      )}

      {/* Hero thumbnail */}
      {primaryThumb && (
        <div className="mb-6 overflow-hidden rounded-2xl">
          <img
            src={primaryThumb}
            alt={guide.title}
            className="w-full object-cover aspect-video bg-muted"
            onError={(e) => {
              // fall back to mqdefault if maxresdefault 404s
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${guide.sourceYoutubeIds[0]}/mqdefault.jpg`;
            }}
          />
        </div>
      )}

      {/* Title + meta */}
      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[guide.type]}`}>
            {TYPE_ICONS[guide.type]}
            {TYPE_LABELS[guide.type]}
          </span>
          {guide.content.difficulty && (
            <span className={`text-xs font-medium capitalize ${DIFFICULTY_COLORS[guide.content.difficulty]}`}>
              {guide.content.difficulty}
            </span>
          )}
          {guide.content.duration && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {guide.content.duration}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{guide.title}</h1>
        {guide.exerciseName && (
          <p className="mt-1 text-base text-muted-foreground">{guide.exerciseName}</p>
        )}
      </div>

      {/* Intro */}
      <div className="mb-8 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
        {guide.content.intro}
      </div>

      {/* Key Points */}
      {guide.content.keyPoints.length > 0 && (
        <div className="mb-8 rounded-xl border border-border bg-muted/30 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="size-4 text-amber-500" />
            Key Points
          </h2>
          <ul className="space-y-2">
            {guide.content.keyPoints.map((pt, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400 dark:bg-amber-500" />
                {pt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sections */}
      {guide.content.sections.map((sec, i) => (
        <div key={i} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">{sec.heading}</h2>
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{sec.body}</p>
          {sec.tips && sec.tips.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {sec.tips.map((tip, j) => (
                <li key={j} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-indigo-400 dark:bg-indigo-500" />
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {/* Steps */}
      {guide.content.steps.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Step-by-Step</h2>
          <ol className="space-y-4">
            {guide.content.steps.map((s) => (
              <li key={s.step} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  {s.step}
                </span>
                <div className="pt-0.5">
                  <p className="text-sm">{s.instruction}</p>
                  {s.cues && s.cues.length > 0 && (
                    <p className="mt-1 text-xs italic text-muted-foreground">{s.cues.join(" · ")}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Common Mistakes */}
      {guide.content.commonMistakes && guide.content.commonMistakes.length > 0 && (
        <div className="mb-8 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-400">
            <AlertTriangle className="size-4" />
            Common Mistakes
          </h2>
          <ul className="space-y-2">
            {guide.content.commonMistakes.map((m, i) => (
              <li key={i} className="flex gap-2 text-sm text-rose-700 dark:text-rose-300">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rose-400 dark:bg-rose-500" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Muscles + Equipment chips */}
      <div className="mb-8 flex flex-wrap gap-4 rounded-xl border border-border bg-muted/30 p-5 text-sm">
        {guide.content.targetMuscles.length > 0 && (
          <div className="flex items-start gap-2">
            <Target className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Target Muscles</p>
              <p>{guide.content.targetMuscles.join(", ")}</p>
            </div>
          </div>
        )}
        {guide.content.equipment.length > 0 && (
          <div className="flex items-start gap-2">
            <Wrench className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Equipment</p>
              <p>{guide.content.equipment.join(", ")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      {guide.content.tags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-1.5">
          {guide.content.tags.map((tag, i) => (
            <span key={i} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Source videos */}
      {guide.sourceYoutubeIds.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/20 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source Videos</p>
          <div className="flex flex-wrap gap-3">
            {guide.sourceYoutubeIds.map((ytId) => (
              <a
                key={ytId}
                href={`https://www.youtube.com/watch?v=${ytId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-lg"
              >
                <img
                  src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                  alt="Source video"
                  className="h-16 w-28 object-cover transition-opacity group-hover:opacity-80"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
