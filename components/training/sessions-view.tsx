"use client";

import { useState } from "react";
import { LayoutList, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { SessionCard } from "@/components/training/session-card";
import { CalendarView } from "@/components/training/calendar-view";
import type { WorkoutSession } from "@/types";

const PAGE_SIZE = 10;

interface Props {
  sessions: WorkoutSession[];
  tagsMap?: Record<string, string[]>;
}

export function SessionsView({ sessions, tagsMap = {} }: Props) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [page, setPage] = useState(1);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Collect all unique tags in use
  const allTags = [...new Set(Object.values(tagsMap).flat())].sort();

  // Filter sessions by tag if one is selected
  const filteredSessions = activeTag
    ? sessions.filter((s) =>
        s.exerciseNames?.some((ex) => tagsMap[ex]?.includes(activeTag))
      )
    : sessions;

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const paginated = filteredSessions.slice(pageStart, pageStart + PAGE_SIZE);

  // Page window: show up to 5 page numbers centered on current page
  function pageNumbers() {
    const range: number[] = [];
    const half = 2;
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, page + half);
    if (end - start < 4) {
      if (start === 1) end = Math.min(totalPages, start + 4);
      else start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  return (
    <div>
      {/* Tag filter row */}
      {allTags.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => { setActiveTag(null); setPage(1); }}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeTag === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => { setActiveTag(tag === activeTag ? null : tag); setPage(1); }}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeTag === tag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* View toggle */}
      <div className="mb-5 flex items-center gap-1 rounded-lg border border-border bg-muted p-1 w-fit">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "list"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutList className="size-3.5" />
          List
        </button>
        <button
          type="button"
          onClick={() => setView("calendar")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "calendar"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarDays className="size-3.5" />
          Calendar
        </button>
      </div>

      {view === "calendar" ? (
        <CalendarView sessions={sessions} />
      ) : (
        <>
          {/* List */}
          <div className="flex flex-col gap-4">
            {paginated.map((session, i) => (
              <SessionCard key={session.id} session={session} index={i} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between text-sm">
              <p className="text-xs text-muted-foreground">
                {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filteredSessions.length)} of {filteredSessions.length} sessions
              </p>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" />
                </button>

                {pageNumbers().map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`min-w-8 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                      n === page
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {n}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
                  aria-label="Next page"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
