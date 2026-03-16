"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Lightbulb, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { updateSuggestionStatus, deleteUserSuggestion } from "@/actions/suggestion-actions";
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

function SuggestionCard({ suggestion, onDelete }: { suggestion: UserSuggestion; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<SuggestionStatus>(suggestion.status);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

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
              {status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-medium leading-snug">{suggestion.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {format(new Date(suggestion.createdAt), "MMM d, yyyy 'at' h:mm a")}
            {suggestion.userEmail && ` · ${suggestion.userEmail}`}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm whitespace-pre-wrap">{suggestion.description}</p>
          </div>

          {suggestion.imageUrls && suggestion.imageUrls.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Images</p>
              <div className="flex flex-wrap gap-2">
                {suggestion.imageUrls.map((url, i) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Image ${i + 1}`} className="h-24 rounded-lg border border-border object-cover hover:opacity-80 transition-opacity" />
                  </a>
                ))}
              </div>
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
              title="Delete suggestion"
              className="ml-auto flex items-center gap-1 rounded-full border border-destructive/30 px-2.5 py-0.5 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="size-3" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function UserSuggestionsPanel({ initialSuggestions }: { initialSuggestions: UserSuggestion[] }) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const openCount = suggestions.filter((s) => s.status === "new" || s.status === "under_review").length;

  function handleDelete(id: string) {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
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

      {suggestions.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          No suggestions yet.
        </div>
      ) : (
        <div className="space-y-2">
          {suggestions.map((s) => (
            <SuggestionCard key={s.id} suggestion={s} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
