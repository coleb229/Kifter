export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="h-4 w-20 animate-pulse rounded bg-muted mb-6" />
        <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
      </div>

      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
