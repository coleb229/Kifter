export default function Loading() {
  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div>
        <div className="h-4 w-20 animate-pulse rounded bg-muted mb-4" />
        <div className="flex items-center gap-3">
          <div className="size-9 animate-pulse rounded-lg bg-muted" />
          <div>
            <div className="h-7 w-44 animate-pulse rounded-lg bg-muted" />
            <div className="mt-1 h-4 w-56 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="flex gap-3">
          <div className="h-10 flex-1 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 flex-1 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
