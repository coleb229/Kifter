import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getWorkoutSession, getUserExercises, getExerciseVideos } from "@/actions/workout-actions";
import { DEFAULT_EXERCISES } from "@/lib/exercises";
import { ExerciseLogger } from "@/components/training/exercise-logger";
import { SessionExercises } from "@/components/training/session-exercises";
import { EditableSessionHeader } from "@/components/training/editable-session-header";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, exercisesResult, videoUrlsResult] = await Promise.all([
    getWorkoutSession(id),
    getUserExercises(),
    getExerciseVideos(),
  ]);

  if (!result.success) notFound();

  const { session, sets } = result.data;
  const exercises = exercisesResult.success ? exercisesResult.data : DEFAULT_EXERCISES;
  const videoUrls = videoUrlsResult.success ? videoUrlsResult.data : {};

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

      {/* Session header — editable */}
      <EditableSessionHeader session={session} />

      {/* Logged exercises */}
      <SessionExercises sessionId={id} sets={sets} videoUrls={videoUrls} />

      {/* Log another exercise */}
      <ExerciseLogger sessionId={id} exercises={exercises} />
    </div>
  );
}
