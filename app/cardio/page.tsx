export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, TrendingUp } from "lucide-react";
import { getCardioSessions } from "@/actions/cardio-actions";
import { CardioLogView } from "@/components/cardio/cardio-log-view";
import { Button } from "@/components/ui/button";
import { QuickLogFAB } from "@/components/quick-log-fab";
import { OnboardingTip } from "@/components/ui/onboarding-tip";

export default async function CardioPage() {
  const result = await getCardioSessions();
  const sessions = result.success ? result.data : [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cardio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} logged
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" render={<Link href="/cardio/analytics" />}>
            <TrendingUp className="size-4" />
            Analytics
          </Button>
          <Button size="sm" render={<Link href="/cardio/new" />}>
            <Plus className="size-4" />
            Log Cardio
          </Button>
        </div>
      </div>

      {sessions.length < 3 && (
        <OnboardingTip
          tipKey="cardio-start"
          title="Track your runs, rides & more"
          description="Log any cardio activity — runs, cycling, swimming, or custom sessions. Track distance, duration, heart rate, and view trends on the Analytics page."
          className="mb-6"
        />
      )}
      <CardioLogView sessions={sessions} />
      <QuickLogFAB href="/cardio/new" label="Log Cardio" />
    </div>
  );
}
