"use client";

import { useState, useTransition } from "react";
import {
  BookOpen, Loader2, Trash2, ChevronDown, ChevronRight,
  Sparkles, Eye, EyeOff, Activity, Dumbbell, Check, ImagePlus,
} from "lucide-react";
import {
  generateGuideDraft,
  publishGuide,
  unpublishGuide,
  deletePublishedGuide,
  updatePublishedGuide,
} from "@/actions/published-guide-actions";
import { useUploadThing } from "@/lib/uploadthing-client";
import type { PublishedGuide, TrainingGuide, GuideType, PublishedGuideContent } from "@/types";

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

// ── SourceRow ─────────────────────────────────────────────────────────────────

function SourceRow({
  guide,
  selected,
  onToggle,
}: {
  guide: TrainingGuide;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-2.5 hover:bg-muted/40 transition-colors has-[:checked]:border-indigo-400 has-[:checked]:bg-indigo-50/50 dark:has-[:checked]:bg-indigo-950/20">
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="size-4 accent-indigo-600 shrink-0"
      />
      <img
        src={`https://img.youtube.com/vi/${guide.youtubeId}/mqdefault.jpg`}
        alt=""
        className="h-10 w-16 shrink-0 rounded object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{guide.title}</p>
        {guide.exerciseName && (
          <p className="truncate text-[10px] text-muted-foreground">{guide.exerciseName}</p>
        )}
        <span className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[guide.type]}`}>
          {TYPE_ICONS[guide.type]}
          {TYPE_LABELS[guide.type]}
        </span>
      </div>
    </label>
  );
}

// ── DraftEditor ───────────────────────────────────────────────────────────────

function DraftEditor({
  guide,
  onSaved,
  onClose,
}: {
  guide: PublishedGuide;
  onSaved: (updated: PublishedGuide) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(guide.title);
  const [intro, setIntro] = useState(guide.content.intro);
  const [sections, setSections] = useState(guide.content.sections);
  const [isSaving, startSave] = useTransition();

  function handleSave() {
    startSave(async () => {
      const updated: PublishedGuideContent = {
        ...guide.content,
        intro,
        sections,
      };
      const result = await updatePublishedGuide(guide.id, { title, content: updated });
      if (result.success) {
        onSaved(result.data);
        onClose();
      }
    });
  }

  return (
    <div className="space-y-3 border-t border-border bg-muted/20 px-4 py-4">
      <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Intro</label>
        <textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {sections.map((sec, i) => (
        <div key={i} className="rounded-lg border border-border bg-background p-3 space-y-2">
          <input
            type="text"
            value={sec.heading}
            onChange={(e) => setSections((prev) => prev.map((s, j) => j === i ? { ...s, heading: e.target.value } : s))}
            placeholder="Section heading"
            className="w-full rounded border-none bg-transparent text-sm font-semibold focus:outline-none"
          />
          <textarea
            value={sec.body}
            onChange={(e) => setSections((prev) => prev.map((s, j) => j === i ? { ...s, body: e.target.value } : s))}
            rows={3}
            placeholder="Section body…"
            className="w-full resize-y rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      ))}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          Save changes
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── PublishedGuideCard ────────────────────────────────────────────────────────

function PublishedGuideCard({
  guide,
  onChange,
  onDelete,
}: {
  guide: PublishedGuide;
  onChange: (updated: PublishedGuide) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isPublishing, startPublish] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [isUpdatingImage, startUpdateImage] = useTransition();

  const { startUpload, isUploading } = useUploadThing("guideImage", {
    onClientUploadComplete: (res) => {
      if (res[0]?.url) {
        startUpdateImage(async () => {
          const result = await updatePublishedGuide(guide.id, { imageUrl: res[0].url });
          if (result.success) onChange({ ...guide, imageUrl: res[0].url });
        });
      }
    },
  });

  const displayImage = guide.imageUrl
    ?? (guide.sourceYoutubeIds[0]
      ? `https://img.youtube.com/vi/${guide.sourceYoutubeIds[0]}/mqdefault.jpg`
      : null);

  function handlePublishToggle() {
    startPublish(async () => {
      const action = guide.status === "published" ? unpublishGuide : publishGuide;
      const result = await action(guide.id);
      if (result.success) {
        onChange({ ...guide, status: guide.status === "published" ? "draft" : "published" });
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${guide.title}"?`)) return;
    startDelete(async () => {
      await deletePublishedGuide(guide.id);
      onDelete(guide.id);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* Thumbnail with image upload overlay */}
        <label className="relative h-14 w-24 shrink-0 cursor-pointer group">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) startUpload([file]);
              e.target.value = "";
            }}
          />
          {displayImage ? (
            <img src={displayImage} alt="" className="h-full w-full rounded-lg object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted">
              <ImagePlus className="size-5 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            {isUploading || isUpdatingImage ? (
              <Loader2 className="size-4 animate-spin text-white" />
            ) : (
              <ImagePlus className="size-4 text-white" />
            )}
          </div>
        </label>
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{guide.title}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[guide.type]}`}>
                  {TYPE_ICONS[guide.type]}
                  {TYPE_LABELS[guide.type]}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  guide.status === "published"
                    ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                }`}>
                  {guide.status === "published" ? "Published" : "Draft"}
                </span>
                <span className="text-[10px] text-muted-foreground">/training/guides/{guide.slug}</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={handlePublishToggle}
                disabled={isPublishing}
                title={guide.status === "published" ? "Unpublish" : "Publish"}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/60 transition-colors"
              >
                {isPublishing
                  ? <Loader2 className="size-3.5 animate-spin" />
                  : guide.status === "published"
                    ? <EyeOff className="size-3.5" />
                    : <Eye className="size-3.5" />}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground line-clamp-2">{guide.content.intro}</p>
        </div>
      </div>

      <button
        onClick={() => { setExpanded(!expanded); setEditing(false); }}
        className="flex w-full items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground hover:bg-muted/40 transition-colors"
      >
        <span>{expanded ? "Collapse" : "Edit content"}</span>
        {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
      </button>

      {expanded && !editing && (
        <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">{guide.content.intro}</p>
          {guide.content.sections.map((sec, i) => (
            <div key={i}>
              <p className="text-xs font-semibold">{sec.heading}</p>
              <p className="text-xs text-muted-foreground">{sec.body}</p>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Edit this guide
          </button>
        </div>
      )}

      {expanded && editing && (
        <DraftEditor
          guide={guide}
          onSaved={(updated) => { onChange(updated); setExpanded(false); setEditing(false); }}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

// ── PublishedGuidesPanel ──────────────────────────────────────────────────────

interface Props {
  initialGuides: PublishedGuide[];
  sourceGuides: TrainingGuide[];
}

export function PublishedGuidesPanel({ initialGuides, sourceGuides }: Props) {
  const [guides, setGuides] = useState<PublishedGuide[]>(initialGuides);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<GuideType | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerate] = useTransition();

  const readySources = sourceGuides.filter((g) => g.status === "ready" && g.content);
  const filteredSources = filterType === "all" ? readySources : readySources.filter((g) => g.type === filterType);

  function toggleSource(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleGenerate() {
    setError(null);
    startGenerate(async () => {
      const result = await generateGuideDraft(Array.from(selected));
      if (!result.success) {
        setError(result.error);
        return;
      }
      setGuides((prev) => [result.data, ...prev]);
      setSelected(new Set());
    });
  }

  function handleGuideChange(updated: PublishedGuide) {
    setGuides((prev) => prev.map((g) => g.id === updated.id ? updated : g));
  }

  function handleGuideDelete(id: string) {
    setGuides((prev) => prev.filter((g) => g.id !== id));
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-indigo-100 dark:bg-indigo-950/40">
          <BookOpen className="size-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Published Guides</h2>
          <p className="text-xs text-muted-foreground">Select transcriptions below to generate a polished guide with AI</p>
        </div>
      </div>

      {/* Zone 1: Source selection */}
      <div className="mb-6 rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium">Select source transcriptions</p>
          {selected.size > 0 && (
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400">{selected.size} selected</span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1.5">
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
              {f === "all" ? `All (${readySources.length})` : TYPE_LABELS[f as GuideType]}
            </button>
          ))}
        </div>

        {filteredSources.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No extracted transcriptions available. Add some in the Training Content panel above.
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {filteredSources.map((g) => (
              <SourceRow
                key={g.id}
                guide={g}
                selected={selected.has(g.id)}
                onToggle={() => toggleSource(g.id)}
              />
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={selected.size === 0 || isGenerating}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generating guide draft with Claude…
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Generate Guide Draft{selected.size > 0 ? ` (${selected.size} source${selected.size > 1 ? "s" : ""})` : ""}
            </>
          )}
        </button>
      </div>

      {/* Zone 2: Drafts & published */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Guides ({guides.length})
        </p>
        {guides.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-10 text-center">
            <BookOpen className="mx-auto mb-2 size-6 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No guides yet — select transcriptions above and generate a draft.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {guides.map((guide) => (
              <PublishedGuideCard
                key={guide.id}
                guide={guide}
                onChange={handleGuideChange}
                onDelete={handleGuideDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
