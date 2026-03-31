export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
      </div>

      {/* Unit toggle */}
      <div className="mb-12 flex items-center gap-2">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Composition timeline */}
      <div className="mb-12 h-80 animate-pulse rounded-xl bg-muted" />

      {/* Macro correlation */}
      <div className="mb-12 flex flex-col gap-3">
        <div className="h-5 w-48 animate-pulse rounded bg-muted" />
        <div className="h-72 animate-pulse rounded-xl bg-muted" />
      </div>

      {/* Body weight section */}
      <div className="mb-12 flex flex-col gap-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        {/* Chart */}
        <div className="h-72 animate-pulse rounded-xl bg-muted" />
        {/* Form */}
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>

      {/* Physique section */}
      <div className="mb-12 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="size-9 animate-pulse rounded-lg bg-muted" />
          <div>
            <div className="h-6 w-48 animate-pulse rounded bg-muted" />
            <div className="mt-1 h-4 w-56 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-xl bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>

      {/* Progress gallery */}
      <div className="mb-12 flex flex-col gap-4">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-16 animate-pulse rounded-xl bg-muted" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
