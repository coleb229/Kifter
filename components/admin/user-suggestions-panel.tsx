"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Lightbulb, ChevronDown, ChevronRight, Trash2, ChevronLeft, Pencil, Check, X } from "lucide-react";
import { updateSuggestionStatus, deleteUserSuggestion, updateUserSuggestion } from "@/actions/suggestion-actions";
import type { UserSuggestion, SuggestionStatus } from "@/types";

const STATUS_OPTIONS: { value: SuggestionStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "under_review", label: "Under Review" },
  { value: "planned", label: "Planned" },
  { value: "testing", label: "Testing" },
  { value: "done", label: "Done" },
  { value: "declined", label: "Declined" },
];

const STATUS_STYLES: Record<SuggestionStatus, string> = {
  new: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
  under_review: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
  planned: "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300",
  testing: "bg-fuchsia-100 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300",
  done: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
  declined: "bg-muted text-muted-foreground",
};

const PAGE_SIZE = 10;
const FILTER_OPTIONS: { value: "all" | SuggestionStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "under_review", label: "Under Review" },
  { value: "testing", label: "Testing" },
  { value: "done", label: "Done" },
  { value: "declined", label: "Declined" },
];

function SuggestionCard({ suggestion, onDelete }: { suggestion: UserSuggestion; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<SuggestionStatus>(suggestion.status);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [isSaving, startSave] = useTransition();

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(suggestion.title);
  const [editDescription, setEditDescription] = useState(suggestion.description);
  const [editImages, setEditImages] = useState<string[]>(suggestion.imageUrls ?? []);

  // Displayed values
  const [displayTitle, setDisplayTitle] = useState(suggestion.title);
  const [displayDescription, setDisplayDescription] = useState(suggestion.description);
  const [displayImages, setDisplayImages] = useState<string[]>(suggestion.imageUrls ?? []);

  function handleStatusChange(newStatus: SuggestionStatus) {
    setStatus(newStatus);
    startTransition(async () => {
      await updateSuggestionStatus(suggestion.id, newStatus);
    });
  }

  function handleDelete() {
    if (!confirm("Delete this suggestion? This cannot be undone.")) return;
    startDelete(async () => {
      await deleteUserSuggestion(suggestion.id);
      onDelete(suggestion.id);
    });
  }

  function handleEditSave() {
    startSave(async () => {
      const filteredImages = editImages.filter((u) => u.trim());
      await updateUserSuggestion(suggestion.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        imageUrls: filteredImages.length ? filteredImages : undefined,
      });
      setDisplayTitle(editTitle.trim());
      setDisplayDescription(editDescription.trim());
      setDisplayImages(filteredImages);
      setEditing(false);
    });
  }

  function handleEditCancel() {
    setEditTitle(displayTitle);
    setEditDescription(displayDescription);
    setEditImages(displayImages);
    setEditing(false);
  }

  const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

  return (
    <div className={`rounded-xl border border-border bg-card transition-opacity ${isPending ? "opacity-60" : ""}`}>
      <button
        type="button"
        onClick={() => !editing && setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="mt-0.5 shrink-0">
          {expanded ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
              {status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-medium leading-snug">{displayTitle}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {format(new Date(suggestion.createdAt), "MMM d, yyyy 'at' h:mm a")}
            {suggestion.userEmail && ` · ${suggestion.userEmail}`}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Title</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Description</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} className={`${inputClass} resize-y`} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Image URLs (one per line)</label>
                <textarea
                  value={editImages.join("\n")}
                  onChange={(e) => setEditImages(e.target.value.split("\n"))}
                  rows={3}
                  placeholder="https://..."
                  className={`${inputClass} resize-y font-mono text-xs`}
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleEditSave} disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">
                  <Check className="size-3" /> {isSaving ? "Saving…" : "Save"}
                </button>
                <button type="button" onClick={handleEditCancel} disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                  <X className="size-3" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">{displayDescription}</p>
              </div>

              {displayImages.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Images</p>
                  <div className="flex flex-wrap gap-2">
                    {displayImages.map((url, i) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Image ${i + 1}`} className="h-24 rounded-lg border border-border object-cover hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
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

            <div className="ml-auto flex items-center gap-2">
              {!editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  title="Edit suggestion"
                  className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Pencil className="size-3" />
                  Edit
                </button>
              )}
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                title="Delete suggestion"
                className="flex items-center gap-1 rounded-full border border-destructive/30 px-2.5 py-0.5 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                <Trash2 className="size-3" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function UserSuggestionsPanel({ initialSuggestions }: { initialSuggestions: UserSuggestion[] }) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [filter, setFilter] = useState<"all" | SuggestionStatus>("new");
  const [page, setPage] = useState(1);

  const openCount = suggestions.filter((s) => s.status === "new" || s.status === "under_review").length;

  function handleDelete(id: string) {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }

  const filtered = filter === "all" ? suggestions : suggestions.filter((s) => s.status === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleFilterChange(value: "all" | SuggestionStatus) {
    setFilter(value);
    setPage(1);
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/40">
          <Lightbulb className="size-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">User Suggestions</h2>
          <p className="text-sm text-muted-foreground">
            {openCount} open · {suggestions.length} total
          </p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleFilterChange(value)}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
              filter === value
                ? value === "all"
                  ? "border-transparent bg-foreground text-background"
                  : STATUS_STYLES[value as SuggestionStatus] + " border-transparent"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          No suggestions match this filter.
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} onDelete={handleDelete} />
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
  );
}
