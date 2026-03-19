"use client";

import { useState, useTransition } from "react";
import { Sparkles, ChevronDown, ChevronRight, Trash2, Check, X, Loader2, ChevronLeft } from "lucide-react";
import { generateSiteIdeas, acceptClaudeIdea, deleteClaudeIdea, updateClaudeIdeaStatus, retryTooComplexIdeas } from "@/actions/claude-ideas-actions";
import type { ClaudeIdea, ClaudeIdeaStatus } from "@/types";

const CATEGORIES = ["UI/UX", "Performance", "New Features", "Mobile", "Data & Analytics"];
const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS: { value: "all" | ClaudeIdeaStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "accepted", label: "Accepted" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "declined", label: "Declined" },
  { value: "too_complex", label: "Too Complex" },
];

const STATUS_OPTIONS: { value: ClaudeIdeaStatus; label: string }[] = [
  { value: "accepted", label: "Accepted" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "declined", label: "Declined" },
  { value: "too_complex", label: "Too Complex" },
];

const STATUS_STYLES: Record<ClaudeIdeaStatus, string> = {
  accepted: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
  in_progress: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
  done: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
  declined: "bg-muted text-muted-foreground",
  too_complex: "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300",
};

interface EphemeralIdea {
  title: string;
  description: string;
  accepted?: boolean;
  declined?: boolean;
}

function SavedIdeaCard({ idea, onDelete }: { idea: ClaudeIdea; onDelete: (id: string) => void }) {
  const [status, setStatus] = useState<ClaudeIdeaStatus>(idea.status);
  const [complexityReason, setComplexityReason] = useState(idea.complexityReason ?? "");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reasonDraft, setReasonDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [expanded, setExpanded] = useState(false);

  function handleStatusChange(newStatus: ClaudeIdeaStatus) {
    if (newStatus === "too_complex") {
      setReasonDraft(complexityReason);
      setShowReasonInput(true);
      return;
    }
    setStatus(newStatus);
    setShowReasonInput(false);
    startTransition(async () => {
      await updateClaudeIdeaStatus(idea.id, newStatus);
    });
  }

  function handleSaveTooComplex() {
    const reason = reasonDraft.trim();
    setStatus("too_complex");
    setComplexityReason(reason);
    setShowReasonInput(false);
    startTransition(async () => {
      await updateClaudeIdeaStatus(idea.id, "too_complex", reason);
    });
  }

  function handleDelete() {
    if (!confirm("Remove this idea?")) return;
    startDelete(async () => {
      await deleteClaudeIdea(idea.id);
      onDelete(idea.id);
    });
  }

  return (
    <div className={`rounded-xl border border-border bg-card transition-opacity ${isPending ? "opacity-60" : ""}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="mt-0.5 shrink-0">
          {expanded ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
              {status.replace(/_/g, " ")}
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {idea.category}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-medium leading-snug">{idea.title}</p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          <p className="text-sm text-muted-foreground">{idea.description}</p>

          {status === "too_complex" && complexityReason && !showReasonInput && (
            <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-3">
              <p className="text-xs font-medium text-rose-700 dark:text-rose-400 mb-1">Why too complex:</p>
              <p className="text-xs text-rose-600 dark:text-rose-300">{complexityReason}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Status:</span>
            {STATUS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleStatusChange(value)}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  status === value
                    ? STATUS_STYLES[value] + " border-transparent"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="ml-auto flex items-center gap-1 rounded-full border border-destructive/30 px-2.5 py-0.5 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="size-3" />
              Remove
            </button>
          </div>

          {showReasonInput && (
            <div className="space-y-2 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 p-3">
              <p className="text-xs font-medium text-rose-700 dark:text-rose-400">Why was this too complex to implement?</p>
              <textarea
                value={reasonDraft}
                onChange={(e) => setReasonDraft(e.target.value)}
                placeholder="Explain what made this infeasible (e.g. requires native API, third-party integration, architectural changes)…"
                rows={3}
                className="w-full resize-none rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-rose-950/40 px-3 py-2 text-xs text-rose-900 dark:text-rose-100 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-300/30 placeholder:text-rose-400 dark:placeholder:text-rose-600"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveTooComplex}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-rose-700"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setShowReasonInput(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  initialIdeas: ClaudeIdea[];
}

export function ClaudeIdeasPanel({ initialIdeas }: Props) {
  const [selectedCategory, setSelectedCategory] = useState("New Features");
  const [customMessage, setCustomMessage] = useState("");
  const [ephemeralIdeas, setEphemeralIdeas] = useState<EphemeralIdea[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<ClaudeIdea[]>(initialIdeas);
  const [isGenerating, startGenerate] = useTransition();
  const [isAccepting, startAccept] = useTransition();
  const [isRetrying, startRetry] = useTransition();
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | ClaudeIdeaStatus>("all");
  const [filterCategory, setFilterCategory] = useState<"all" | string>("all");
  const [page, setPage] = useState(1);

  function handleGenerate() {
    setError("");
    setEphemeralIdeas([]);
    startGenerate(async () => {
      const result = await generateSiteIdeas(selectedCategory, customMessage.trim() || undefined);
      if (result.success) {
        setEphemeralIdeas(result.data.map((idea) => ({ ...idea })));
      } else {
        setError(result.error ?? "Failed to generate ideas.");
      }
    });
  }

  function handleAccept(idx: number) {
    const idea = ephemeralIdeas[idx];
    if (!idea) return;
    startAccept(async () => {
      const result = await acceptClaudeIdea(idea.title, idea.description, selectedCategory);
      if (result.success) {
        setEphemeralIdeas((prev) =>
          prev.map((item, i) => (i === idx ? { ...item, accepted: true } : item))
        );
        // Add to saved list optimistically
        setSavedIdeas((prev) => [
          {
            id: result.data.id,
            title: idea.title,
            description: idea.description,
            category: selectedCategory,
            status: "accepted",
            generatedAt: new Date().toISOString(),
            acceptedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    });
  }

  function handleDecline(idx: number) {
    setEphemeralIdeas((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, declined: true } : item))
    );
  }

  function handleDeleteSaved(id: string) {
    setSavedIdeas((prev) => prev.filter((idea) => idea.id !== id));
  }

  function handleRetryAll() {
    startRetry(async () => {
      const result = await retryTooComplexIdeas();
      if (result.success) {
        setSavedIdeas((prev) =>
          prev.map((idea) =>
            idea.status === "too_complex"
              ? { ...idea, status: "accepted", complexityReason: undefined }
              : idea
          )
        );
      }
    });
  }

  const visibleEphemeral = ephemeralIdeas.filter((idea) => !idea.declined);

  const filteredIdeas = savedIdeas.filter((idea) => {
    if (filterStatus !== "all" && idea.status !== filterStatus) return false;
    if (filterCategory !== "all" && idea.category !== filterCategory) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filteredIdeas.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedIdeas = filteredIdeas.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleFilterStatus(value: "all" | ClaudeIdeaStatus) {
    setFilterStatus(value);
    setPage(1);
  }

  function handleFilterCategory(value: "all" | string) {
    setFilterCategory(value);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Generator */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/40">
            <Sparkles className="size-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Generate Ideas with Claude</h2>
            <p className="text-sm text-muted-foreground">Pick a focus area and let Claude suggest improvements</p>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-indigo-100 dark:bg-indigo-950/50 border-indigo-400 text-indigo-700 dark:text-indigo-300"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Custom message */}
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="Optional: add context or constraints for Claude… (e.g. 'focus on iOS Safari compatibility')"
          rows={2}
          className="mb-4 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
        />

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {isGenerating ? "Generating…" : "Generate Ideas"}
        </button>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        {/* Ephemeral idea cards */}
        {visibleEphemeral.length > 0 && (
          <div className="mt-5 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Generated ideas — accept or decline each:</p>
            {visibleEphemeral.map((idea, i) => {
              const realIdx = ephemeralIdeas.findIndex((e) => e === idea);
              return (
                <div key={i} className={`rounded-xl border border-border bg-muted/30 p-4 transition-opacity ${idea.accepted ? "opacity-50" : ""}`}>
                  <p className="text-sm font-medium">{idea.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{idea.description}</p>
                  {!idea.accepted && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAccept(realIdx)}
                        disabled={isAccepting}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <Check className="size-3" /> Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecline(realIdx)}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                      >
                        <X className="size-3" /> Decline
                      </button>
                    </div>
                  )}
                  {idea.accepted && (
                    <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Added to Claude&apos;s Good Ideas</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Saved Ideas */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
            <Sparkles className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Claude&apos;s Good Ideas</h2>
            <p className="text-sm text-muted-foreground">
              {savedIdeas.filter((i) => i.status === "accepted" || i.status === "in_progress").length} active ·{" "}
              {savedIdeas.filter((i) => i.status === "too_complex").length > 0 && (
                <>
                  {savedIdeas.filter((i) => i.status === "too_complex").length} too complex ·{" "}
                  <button
                    type="button"
                    onClick={handleRetryAll}
                    disabled={isRetrying}
                    className="text-rose-600 dark:text-rose-400 hover:underline disabled:opacity-50"
                  >
                    {isRetrying ? "retrying…" : "retry all"}
                  </button>{" "}·{" "}
                </>
              )}
              {savedIdeas.length} total
            </p>
          </div>
        </div>

        {/* Status filter pills */}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleFilterStatus(value)}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                filterStatus === value
                  ? value === "all"
                    ? "border-transparent bg-foreground text-background"
                    : STATUS_STYLES[value as ClaudeIdeaStatus] + " border-transparent"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category filter pills */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleFilterCategory("all")}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
              filterCategory === "all"
                ? "border-transparent bg-foreground text-background"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleFilterCategory(cat)}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                filterCategory === cat
                  ? "border-transparent bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {savedIdeas.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
            No ideas accepted yet. Generate some ideas above to get started.
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
            No ideas match this filter.
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {paginatedIdeas.map((idea) => (
                <SavedIdeaCard key={idea.id + "-" + idea.status} idea={idea} onDelete={handleDeleteSaved} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 transition-colors hover:bg-muted disabled:opacity-40"
                >
                  <ChevronLeft className="size-3.5" /> Prev
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 transition-colors hover:bg-muted disabled:opacity-40"
                >
                  Next <ChevronRight className="size-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
