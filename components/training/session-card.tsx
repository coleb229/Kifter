import { format } from "date-fns";
import { Dumbbell } from "lucide-react";
import type { WorkoutSession } from "@/types";

interface SessionCardProps {
  session: WorkoutSession;
}

export function SessionCard({ session }: SessionCardProps) {
  const date = new Date(session.date);

  return (
    <a
      href={`/training/${session.id}`}
      className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5 text-card-foreground transition-colors hover:bg-muted/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">
            {session.name ?? format(date, "EEEE, MMM d")}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(date, "MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium">
            {session.bodyTarget}
          </span>
          <span className="text-xs text-muted-foreground">
            {session.setCount} set{session.setCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {session.exerciseNames && session.exerciseNames.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Dumbbell className="size-3 shrink-0" />
          <span className="truncate">
            {session.exerciseNames.join(" · ")}
          </span>
        </div>
      )}
    </a>
  );
}
