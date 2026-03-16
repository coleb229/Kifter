export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 h-8 w-28 animate-pulse rounded-lg bg-muted" />

      {/* Settings sections */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="mb-6 rounded-xl border border-border bg-card p-6">
          <div className="mb-4 h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
