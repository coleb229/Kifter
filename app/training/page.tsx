import Link from "next/link";
import { Plus } from "lucide-react";
import { getWorkoutSessions } from "@/actions/workout-actions";
import { SessionCard } from "@/components/training/session-card";
import { Button } from "@/components/ui/button";

export default async function TrainingPage() {
  const result = await getWorkoutSessions();
  const sessions = result.success ? result.data : [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your recent workout sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" render={<Link href="/training/analytics" />}>
            Analytics
          </Button>
          <Button size="sm" variant="outline" render={<Link href="/training/exercises" />}>
            Exercises
          </Button>
          <Button size="sm" render={<Link href="/training/new" />}>
            <Plus className="size-4" />
            Log Workout
          </Button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No workouts logged yet.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            render={<Link href="/training/new" />}
          >
            Log your first workout
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sessions.map((session, i) => (
            <SessionCard key={session.id} session={session} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
