export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Back link */}
      <div className="h-4 w-16 animate-pulse rounded bg-muted" />

      {/* Session header */}
      <div className="flex flex-col gap-2">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
      </div>

      {/* Two-column layout */}
      <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-8">
        {/* Left: exercise cards */}
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>

        {/* Right: logger */}
        <div className="mt-6 lg:mt-0 lg:sticky lg:top-24 lg:self-start">
          <div className="h-80 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
