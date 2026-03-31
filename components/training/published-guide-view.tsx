import Link from "next/link";
import { ArrowLeft, Activity, Dumbbell, BookOpen, Target, Wrench, Clock, AlertTriangle, Lightbulb, ChevronRight, Sparkles, ExternalLink, Youtube } from "lucide-react";
import type { PublishedGuide, GuideType } from "@/types";

const TYPE_META: Record<GuideType, { icon: React.ReactNode; label: string; bg: string; text: string; border: string }> = {
  stability: {
    icon: <Activity className="size-4" />,
    label: "Stability & Mobility",
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-900/50",
  },
  warmup: {
    icon: <Dumbbell className="size-4" />,
    label: "Warmup Routine",
    bg: "bg-amber-100 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-900/50",
  },
  form_guide: {
    icon: <BookOpen className="size-4" />,
    label: "Form Guide",
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
  },
};

const DIFFICULTY_META = {
  beginner: { label: "Beginner", color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-400" },
  intermediate: { label: "Intermediate", color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-400" },
  advanced: { label: "Advanced", color: "text-rose-600 dark:text-rose-400", dot: "bg-rose-400" },
};

interface Props {
  guide: PublishedGuide;
  isDraft?: boolean;
}

export function PublishedGuideView({ guide, isDraft }: Props) {
  const type = TYPE_META[guide.type];
  const diff = guide.content.difficulty ? DIFFICULTY_META[guide.content.difficulty] : null;
  const primaryYtId = guide.sourceYoutubeIds[0];

  return (
    <article className="mx-auto max-w-2xl">
      {/* Back breadcrumb */}
      <Link
        href="/training/guides"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        All Guides
      </Link>

      {isDraft && (
        <div className="mb-5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300">
          Preview — this guide is a draft and not yet visible to other users.
        </div>
      )}

      {/* Hero image */}
      {primaryYtId && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-border shadow-sm">
          <img
            src={`https://img.youtube.com/vi/${primaryYtId}/mqdefault.jpg`}
            alt={guide.title}
            className="w-full object-cover aspect-video bg-muted"
          />
        </div>
      )}

      {/* Type + difficulty + duration pill row */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${type.bg} ${type.text} ${type.border}`}>
          {type.icon}
          {type.label}
        </span>
        {diff && (
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${diff.color}`}>
            <span className={`size-1.5 rounded-full ${diff.dot}`} />
            {diff.label}
          </span>
        )}
        {guide.content.duration && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {guide.content.duration}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/50 px-2.5 py-1 text-[11px] font-medium text-violet-700 dark:text-violet-300">
          <Sparkles className="size-3" />
          AI-Synthesised
        </span>
      </div>

      {/* Title */}
      <h1 className="mb-2 text-3xl font-bold tracking-tight leading-tight">{guide.title}</h1>
      {guide.exerciseName && (
        <p className="mb-6 text-base text-muted-foreground">{guide.exerciseName}</p>
      )}

      {/* Divider */}
      <hr className="my-6 border-border" />

      {/* Intro */}
      <div className="mb-10 prose prose-sm dark:prose-invert max-w-none">
        {guide.content.intro.split("\n").filter(Boolean).map((para, i) => (
          <p key={i} className="mb-3 text-base leading-relaxed text-foreground/90">{para}</p>
        ))}
      </div>

      {/* Key Points callout */}
      {guide.content.keyPoints.length > 0 && (
        <div className="mb-10 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="size-5 text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">What to Know First</h2>
          </div>
          <ul className="space-y-2.5">
            {guide.content.keyPoints.map((pt, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-snug">
                <ChevronRight className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sections */}
      {guide.content.sections.map((sec, i) => (
        <div key={i} className="mb-10">
          <h2 className="mb-3 text-xl font-bold tracking-tight">{sec.heading}</h2>
          {sec.body.split("\n").filter(Boolean).map((para, j) => (
            <p key={j} className="mb-3 text-sm leading-relaxed text-foreground/90">{para}</p>
          ))}
          {sec.tips && sec.tips.length > 0 && (
            <div className="mt-4 space-y-2 rounded-xl border border-border bg-muted/30 p-4">
              {sec.tips.map((tip, j) => (
                <div key={j} className="flex gap-2.5 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {tip}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Step-by-step */}
      {guide.content.steps.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-5 text-xl font-bold tracking-tight">Step-by-Step</h2>
          <ol className="space-y-5">
            {guide.content.steps.map((s) => (
              <li key={s.step} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {s.step}
                </span>
                <div className="pt-1">
                  <p className="text-sm leading-snug">{s.instruction}</p>
                  {s.cues && s.cues.length > 0 && (
                    <p className="mt-1.5 text-xs italic text-muted-foreground">{s.cues.join(" · ")}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Common Mistakes */}
      {guide.content.commonMistakes && guide.content.commonMistakes.length > 0 && (
        <div className="mb-10 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 p-6">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="size-5 text-rose-500" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-rose-700 dark:text-rose-400">Common Mistakes to Avoid</h2>
          </div>
          <ul className="space-y-2.5">
            {guide.content.commonMistakes.map((m, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-snug text-rose-800 dark:text-rose-300">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rose-400" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Muscles + Equipment */}
      {(guide.content.targetMuscles.length > 0 || guide.content.equipment.length > 0) && (
        <div className="mb-10 grid gap-4 rounded-2xl border border-border bg-muted/30 p-5 sm:grid-cols-2">
          {guide.content.targetMuscles.length > 0 && (
            <div className="flex gap-3">
              <Target className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Muscles Worked</p>
                <div className="flex flex-wrap gap-1.5">
                  {guide.content.targetMuscles.map((m, i) => (
                    <span key={i} className="rounded-full bg-background border border-border px-2.5 py-0.5 text-xs">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {guide.content.equipment.length > 0 && (
            <div className="flex gap-3">
              <Wrench className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Equipment</p>
                <div className="flex flex-wrap gap-1.5">
                  {guide.content.equipment.map((e, i) => (
                    <span key={i} className="rounded-full bg-background border border-border px-2.5 py-0.5 text-xs">{e}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {guide.content.tags.length > 0 && (
        <div className="mb-10 flex flex-wrap gap-2">
          {guide.content.tags.map((tag, i) => (
            <span key={i} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Sources & Credits */}
      {(guide.sources?.length || guide.sourceYoutubeIds.length) > 0 && (
        <div className="rounded-2xl border border-border bg-muted/20 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Youtube className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-bold tracking-tight">Video Sources &amp; Credits</h2>
          </div>
          <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
            This guide was synthesised from audio transcriptions of the YouTube videos below.
            All content is credited to the original creators — watch them for a video-based approach to learning these techniques.
          </p>

          {/* New guides: full attribution cards */}
          {guide.sources && guide.sources.length > 0 ? (
            <div className="space-y-3">
              {guide.sources.map((src) => (
                <a
                  key={src.youtubeId}
                  href={src.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-background p-2 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <img
                    src={`https://img.youtube.com/vi/${src.youtubeId}/mqdefault.jpg`}
                    alt={src.title}
                    className="h-14 w-24 shrink-0 rounded-lg object-cover transition-opacity group-hover:opacity-80"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-snug">{src.title}</p>
                    {src.channelName && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{src.channelName}</p>
                    )}
                  </div>
                  <ExternalLink className="mr-1 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </a>
              ))}
            </div>
          ) : (
            /* Fallback for older guides without sources snapshot */
            <div className="flex flex-wrap gap-3">
              {guide.sourceYoutubeIds.map((ytId) => (
                <a
                  key={ytId}
                  href={`https://www.youtube.com/watch?v=${ytId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group overflow-hidden rounded-xl border border-border transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                    alt="Source video"
                    className="h-16 w-28 object-cover transition-opacity group-hover:opacity-80"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
