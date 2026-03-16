export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCardioSessions } from "@/actions/cardio-actions";
import { CardioAnalyticsDashboard } from "@/components/cardio/cardio-analytics-dashboard";

export default async function CardioAnalyticsPage() {
  const result = await getCardioSessions(5000);
  const sessions = result.success ? result.data : [];

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/cardio"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All sessions
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cardio Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your endurance and stamina over time
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <p className="font-medium">No data yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Log some cardio sessions to see your progress here.
          </p>
        </div>
      ) : (
        <CardioAnalyticsDashboard sessions={sessions} />
      )}
    </div>
  );
}
