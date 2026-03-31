export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-36 animate-pulse rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-28 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center">
          <div className="h-9 w-full sm:w-32 animate-pulse rounded-lg bg-muted" />
          <div className="flex gap-2 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-9 w-20 shrink-0 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </div>

      {/* Weekly strip skeleton */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 rounded-lg py-2">
              <div className="h-3 w-6 animate-pulse rounded bg-muted" />
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
              <div className="size-2 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Session cards */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
