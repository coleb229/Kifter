import Link from "next/link";
import { ArrowLeft, Printer, FileText } from "lucide-react";
import { getMonthlyReport } from "@/actions/report-actions";
import { BODY_TARGETS } from "@/types";
import { PrintButton } from "./print-button";

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatVolume(lb: number) {
  if (lb >= 1_000_000) return `${(lb / 1_000_000).toFixed(1)}M lb`;
  if (lb >= 1_000) return `${(lb / 1_000).toFixed(1)}k lb`;
  return `${lb.toLocaleString()} lb`;
}

interface Props {
  params: Promise<{ year: string; month: string }>;
}

export default async function MonthlyReportPage({ params }: Props) {
  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return <p className="text-sm text-muted-foreground">Invalid date.</p>;
  }

  const result = await getMonthlyReport(year, month);
  if (!result.success) {
    return <p className="text-sm text-destructive">Failed to load report: {result.error}</p>;
  }

  const r = result.data;
  const title = `${MONTH_NAMES[month]} ${year}`;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-up print:hidden">
        <div>
          <Link
            href="/training/report"
            className="mb-4 flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Pick Month
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/40">
              <FileText className="size-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title} Report</h1>
              <p className="text-sm text-muted-foreground">Your monthly training summary</p>
            </div>
          </div>
        </div>
        <PrintButton />
      </div>

      {/* Print-only title */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">{title} — Training Report</h1>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-up" style={{ animationDelay: "40ms" }}>
        {[
          { label: "Sessions", value: r.totalSessions },
          { label: "Active Days", value: `${r.activeDays} / ${r.daysInMonth}` },
          { label: "Consistency", value: `${r.consistencyPct}%` },
          { label: "Total Volume", value: formatVolume(r.totalVolumeLb) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Body target breakdown */}
      {Object.keys(r.byBodyTarget).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 animate-fade-up" style={{ animationDelay: "80ms" }}>
          <p className="mb-3 text-sm font-semibold">By Muscle Group</p>
          <div className="flex flex-col gap-2">
            {(BODY_TARGETS as readonly string[])
              .filter((bt) => r.byBodyTarget[bt as keyof typeof r.byBodyTarget])
              .map((bt) => {
                const stat = r.byBodyTarget[bt as keyof typeof r.byBodyTarget]!;
                return (
                  <div key={bt} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{bt}</span>
                    <span>
                      {stat.sessions} session{stat.sessions !== 1 ? "s" : ""} ·{" "}
                      <span className="font-medium">{formatVolume(stat.volumeLb)}</span>
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Top exercises */}
      {r.topExercises.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <p className="mb-3 text-sm font-semibold">Top Exercises</p>
          <div className="flex flex-col gap-2">
            {r.topExercises.map((ex, i) => (
              <div key={ex.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
                  {ex.name}
                </span>
                <span className="text-muted-foreground">
                  {ex.sets} set{ex.sets !== 1 ? "s" : ""} · <span className="font-medium">{formatVolume(ex.volumeLb)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cardio summary */}
      {r.totalCardioSessions > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 animate-fade-up" style={{ animationDelay: "160ms" }}>
          <p className="mb-3 text-sm font-semibold">Cardio</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Sessions</p>
              <p className="mt-0.5 font-semibold">{r.totalCardioSessions}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Time</p>
              <p className="mt-0.5 font-semibold">{r.totalCardioMinutes} min</p>
            </div>
            {r.totalCaloriesBurned > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Calories</p>
                <p className="mt-0.5 font-semibold">{r.totalCaloriesBurned.toLocaleString()} kcal</p>
              </div>
            )}
          </div>
        </div>
      )}

      {r.totalSessions === 0 && r.totalCardioSessions === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No activity logged in {title}.</p>
        </div>
      )}

      {/* Print button bottom */}
      <div className="flex justify-end print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
