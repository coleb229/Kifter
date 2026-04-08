import { Skeleton, CardSkeleton } from "@/components/ui/skeleton";

export default function PantryLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>

      {/* Search bar skeleton */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Category pills skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
        ))}
      </div>

      {/* Recipe cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
