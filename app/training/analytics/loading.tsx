export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Back link */}
      <div className="h-4 w-16 animate-pulse rounded bg-muted" />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-9 animate-pulse rounded-lg bg-muted" />
        <div>
          <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
          <div className="mt-1 h-4 w-48 animate-pulse rounded bg-muted" />
        </div>
      </div>

      {/* Heatmap card */}
      <div className="h-48 animate-pulse rounded-xl bg-muted" />

      {/* Chart cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-56 animate-pulse rounded-xl bg-muted" />
        <div className="h-56 animate-pulse rounded-xl bg-muted" />
      </div>

      {/* Exercise analysis section */}
      <div className="flex flex-col gap-4">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>

      {/* Records section */}
      <div className="flex flex-col gap-4">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
