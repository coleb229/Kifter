export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, TrendingUp } from "lucide-react";
import { getCardioSessions } from "@/actions/cardio-actions";
import { CardioLogView } from "@/components/cardio/cardio-log-view";
import { Button } from "@/components/ui/button";

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

      <CardioLogView sessions={sessions} />
    </div>
  );
}
