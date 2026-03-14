import { notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getWorkoutSession } from "@/actions/workout-actions";
import { ExerciseLogger } from "@/components/training/exercise-logger";
import { SessionExercises } from "@/components/training/session-exercises";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getWorkoutSession(id);

  if (!result.success) notFound();

  const { session, sets } = result.data;
  const date = new Date(session.date);

  return (
    <div className="flex flex-col gap-8">
      {/* Back link */}
      <Link
        href="/training"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All sessions
      </Link>

      {/* Session header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {session.name ?? format(date, "EEEE, MMM d")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {format(date, "MMMM d, yyyy")}
            </p>
          </div>
          <span className="mt-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
            {session.bodyTarget}
          </span>
        </div>
        {session.notes && (
          <p className="mt-3 text-sm text-muted-foreground">{session.notes}</p>
        )}
      </div>

      {/* Logged exercises (client component — handles unit display) */}
      <SessionExercises sets={sets} />

      {/* Log another exercise */}
      <ExerciseLogger sessionId={id} />
    </div>
  );
}
