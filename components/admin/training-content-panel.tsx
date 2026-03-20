"use client";

import { useState, useTransition } from "react";
import { Youtube, Loader2, Trash2, ChevronDown, ChevronRight, BookOpen, Dumbbell, Activity } from "lucide-react";
import { processYouTubeGuide, deleteTrainingGuide } from "@/actions/guide-actions";
import type { TrainingGuide, GuideType } from "@/types";

interface Props {
  initialGuides: TrainingGuide[];
}

const TYPE_OPTIONS: { value: GuideType; label: string; description: string }[] = [
  { value: "stability", label: "Stability / Mobility", description: "Stability drills, mobility routines, corrective exercises" },
  { value: "warmup", label: "Warmup Routine", description: "Pre-workout warmup sequences and activation drills" },
  { value: "form_guide", label: "Form Guide", description: "Technique breakdown for a specific exercise" },
];

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
  stability: "Stability",
  warmup: "Warmup",
  form_guide: "Form Guide",
};

const DIFFICULTY_COLORS = {
  beginner: "text-emerald-600 dark:text-emerald-400",
  intermediate: "text-amber-600 dark:text-amber-400",
  advanced: "text-rose-600 dark:text-rose-400",
};

function GuideCard({ guide, onDelete }: { guide: TrainingGuide; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [isDeleting, startDelete] = useTransition();

  function handleDelete() {
    if (!confirm(`Remove "${guide.title}"?`)) return;
    startDelete(async () => {
      await deleteTrainingGuide(guide.id);
      onDelete(guide.id);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Thumbnail + header row */}
      <div className="flex gap-3 p-3">
        <a
          href={guide.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <img
            src={`https://img.youtube.com/vi/${guide.youtubeId}/mqdefault.jpg`}
            alt={guide.title}
            className="h-16 w-28 rounded-lg object-cover"
          />
        </a>

        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug truncate">{guide.title}</p>
              {guide.exerciseName && (
                <p className="text-xs text-muted-foreground truncate">{guide.exerciseName}</p>
              )}
            </div>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[guide.type]}`}>
              {TYPE_ICONS[guide.type]}
              {TYPE_LABELS[guide.type]}
            </span>
            {guide.content?.difficulty && (
              <span className={`text-[10px] font-medium capitalize ${DIFFICULTY_COLORS[guide.content.difficulty]}`}>
                {guide.content.difficulty}
              </span>
            )}
            {guide.content?.duration && (
              <span className="text-[10px] text-muted-foreground">{guide.content.duration}</span>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            {new Date(guide.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Expand toggle */}
      {guide.content && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground hover:bg-muted/40 transition-colors"
          >
            <span>{expanded ? "Hide" : "Show"} extracted content</span>
            {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>

          {expanded && (
            <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-4">
              {/* Summary */}
              <p className="text-xs text-muted-foreground leading-relaxed">{guide.content.summary}</p>

              {/* Key points */}
              {guide.content.keyPoints.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Key Points</p>
                  <ul className="space-y-1">
                    {guide.content.keyPoints.map((pt, i) => (
                      <li key={i} className="flex gap-1.5 text-xs">
                        <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-indigo-400 dark:bg-indigo-500" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Steps */}
              {guide.content.steps.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Steps</p>
                  <ol className="space-y-2">
                    {guide.content.steps.map((s) => (
                      <li key={s.step} className="flex gap-2 text-xs">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
                          {s.step}
                        </span>
                        <div>
                          <p>{s.instruction}</p>
                          {s.cues && s.cues.length > 0 && (
                            <p className="mt-0.5 text-[10px] italic text-muted-foreground">{s.cues.join(" · ")}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Common mistakes */}
              {guide.content.commonMistakes && guide.content.commonMistakes.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Common Mistakes</p>
                  <ul className="space-y-1">
                    {guide.content.commonMistakes.map((m, i) => (
                      <li key={i} className="flex gap-1.5 text-xs text-rose-700 dark:text-rose-400">
                        <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-rose-400 dark:bg-rose-500" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                {guide.content.targetMuscles.length > 0 && (
                  <span>Muscles: {guide.content.targetMuscles.join(", ")}</span>
                )}
                {guide.content.equipment.length > 0 && (
                  <span>Equipment: {guide.content.equipment.join(", ")}</span>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {guide.status === "failed" && guide.errorMessage && (
        <div className="border-t border-destructive/20 bg-destructive/5 px-4 py-2 text-xs text-destructive">
          {guide.errorMessage}
        </div>
      )}
    </div>
  );
}

export function TrainingContentPanel({ initialGuides }: Props) {
  const [guides, setGuides] = useState<TrainingGuide[]>(initialGuides);
  const [url, setUrl] = useState("");
  const [type, setType] = useState<GuideType>("form_guide");
  const [exerciseName, setExerciseName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [filterType, setFilterType] = useState<GuideType | "all">("all");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await processYouTubeGuide(url.trim(), type, exerciseName.trim() || undefined);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setGuides((prev) => [result.data, ...prev]);
      setUrl("");
      setExerciseName("");
    });
  }

  function handleDelete(id: string) {
    setGuides((prev) => prev.filter((g) => g.id !== id));
  }

  const filtered = filterType === "all" ? guides : guides.filter((g) => g.type === filterType);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-rose-100 dark:bg-rose-950/40">
          <Youtube className="size-4 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Training Content</h2>
          <p className="text-xs text-muted-foreground">Extract structured guides from trusted YouTube videos</p>
        </div>
      </div>

      {/* Submission form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <div>
          <label className="mb-1 block text-xs font-medium">YouTube URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            required
            disabled={isPending}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">Content Type</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                disabled={isPending}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors disabled:opacity-50 ${
                  type === opt.value
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                    : "border-border bg-background hover:bg-muted/60"
                }`}
              >
                <p className="font-medium">{opt.label}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {type === "form_guide" && (
          <div>
            <label className="mb-1 block text-xs font-medium">Exercise Name</label>
            <input
              type="text"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="e.g. Romanian Deadlift"
              required
              disabled={isPending}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Processing transcript with Claude…
            </>
          ) : (
            <>
              <Youtube className="size-4" />
              Extract Content
            </>
          )}
        </button>
      </form>

      {/* Filter tabs */}
      {guides.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(["all", "stability", "warmup", "form_guide"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterType === f
                  ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f === "all" ? `All (${guides.length})` : TYPE_LABELS[f]}
            </button>
          ))}
        </div>
      )}

      {/* Guide list */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-10 text-center">
          <Youtube className="mx-auto mb-2 size-6 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">
            {guides.length === 0 ? "No guides yet — paste a YouTube URL above to get started." : "No guides matching this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((guide) => (
            <GuideCard key={guide.id} guide={guide} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
