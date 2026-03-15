import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getGoals, checkGoalProgress } from "@/actions/goal-actions";
import { Navbar } from "@/components/navbar";
import { GoalsView } from "@/components/goals/goals-view";

export default async function GoalsPage() {
  const session = await auth();
  if (!session) redirect("/");

  const [goalsResult, progressResult] = await Promise.all([
    getGoals(),
    checkGoalProgress(),
  ]);

  const goals = goalsResult.success ? goalsResult.data : [];
  const alerts = progressResult.success ? progressResult.data.alerts : [];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 pb-24 sm:px-6 sm:pb-8 lg:px-8">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track milestones across workouts, cardio, nutrition, and body weight.
          </p>
        </div>
        <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
          <GoalsView initialGoals={goals} alerts={alerts} />
        </div>
      </main>
    </div>
  );
}
