export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Macro rings / budget meter */}
      <div className="mb-6 h-28 animate-pulse rounded-xl bg-muted" />

      {/* Date nav */}
      <div className="mb-6 flex items-center gap-2">
        <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-36 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Meal sections */}
      {["Breakfast", "Lunch", "Dinner", "Snacks"].map((meal) => (
        <div key={meal} className="mb-4 rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
            <div className="h-7 w-16 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
