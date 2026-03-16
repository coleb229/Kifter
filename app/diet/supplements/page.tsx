export const dynamic = "force-dynamic";

import { Pill } from "lucide-react";
import { getSupplementLogs } from "@/actions/supplement-actions";
import { SupplementLogView } from "@/components/diet/supplement-log-view";

export default async function SupplementsPage() {
  const result = await getSupplementLogs();
  const logs = result.success ? result.data : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3 animate-fade-up">
        <div className="flex size-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/40">
          <Pill className="size-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Supplements</h1>
          <p className="text-sm text-muted-foreground">Track your supplement intake and timing</p>
        </div>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
        <SupplementLogView initialLogs={logs} />
      </div>
    </div>
  );
}
