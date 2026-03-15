"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutList, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { CardioSessionCard } from "@/components/cardio/cardio-session-card";
import { Button } from "@/components/ui/button";
import type { CardioSession } from "@/types";

const PAGE_SIZE = 10;

interface Props {
  sessions: CardioSession[];
}

export function CardioLogView({ sessions }: Props) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(sessions.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const paginated = sessions.slice(pageStart, pageStart + PAGE_SIZE);

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

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">No cardio sessions logged yet.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          render={<Link href="/cardio/new" />}
        >
          <Plus className="size-4" />
          Log your first session
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-1 rounded-lg border border-border bg-muted p-1 w-fit">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors bg-background text-foreground shadow-sm"
        >
          <LayoutList className="size-3.5" />
          List
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {paginated.map((session, i) => (
          <CardioSessionCard key={session.id} session={session} index={i} />
        ))}
      </div>

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
                    ? "bg-sky-600 text-white"
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
    </div>
  );
}
