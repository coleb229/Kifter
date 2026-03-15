"use client";

import { useState } from "react";
import { LayoutList, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { SessionCard } from "@/components/training/session-card";
import { CalendarView } from "@/components/training/calendar-view";
import type { WorkoutSession } from "@/types";

const PAGE_SIZE = 10;

interface Props {
  sessions: WorkoutSession[];
}

export function SessionsView({ sessions }: Props) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(sessions.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const paginated = sessions.slice(pageStart, pageStart + PAGE_SIZE);

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
                {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, sessions.length)} of {sessions.length} sessions
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
                        ? "bg-indigo-600 text-white"
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
