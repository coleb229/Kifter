import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { getDietWeekReport } from "@/actions/report-actions";
import { PrintButton } from "./print-button";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"] as const;

interface Props {
  params: Promise<{ year: string; week: string }>;
}

function fmt(n: number, unit = "") {
  return `${Math.round(n).toLocaleString()}${unit}`;
}

export default async function DietWeekReportPage({ params }: Props) {
  const { year: yearStr, week: weekStr } = await params;
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  if (isNaN(year) || isNaN(week) || week < 1 || week > 53) {
    return <p className="text-sm text-muted-foreground">Invalid date.</p>;
  }

  const result = await getDietWeekReport(year, week);
  if (!result.success) {
    return <p className="text-sm text-destructive">Failed to load report: {result.error}</p>;
  }

  const r = result.data;
  const title = `Week ${week}, ${year}`;
  const loggedDays = r.days.filter((d) => d.meals.length > 0).length;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-up print:hidden">
        <div>
          <Link
            href="/diet/report"
            className="mb-4 flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Pick Week
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
              <FileText className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title} Nutrition</h1>
              <p className="text-sm text-muted-foreground">
                {r.startDate} → {r.endDate}
              </p>
            </div>
          </div>
        </div>
        <PrintButton />
      </div>

      {/* Print-only title */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">{title} — Nutrition Report</h1>
        <p className="text-sm text-muted-foreground">{r.startDate} → {r.endDate}</p>
      </div>

      {loggedDays === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No food logged this week.</p>
        </div>
      ) : (
        <>
          {/* Weekly totals */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-up" style={{ animationDelay: "40ms" }}>
            {[
              { label: "Days Logged", value: `${loggedDays} / 7` },
              { label: "Avg Calories", value: `${fmt(r.avgCalories)} kcal` },
              { label: "Total Protein", value: `${fmt(r.totalProtein)}g` },
              { label: "Total Carbs/Fat", value: `${fmt(r.totalCarbs)}g / ${fmt(r.totalFat)}g` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-lg font-bold leading-tight">{value}</p>
              </div>
            ))}
          </div>

          {/* Daily breakdown */}
          <div className="flex flex-col gap-4">
            {r.days.map((day, i) => (
              <div
                key={day.date}
                className="rounded-xl border border-border bg-card p-4 animate-fade-up"
                style={{ animationDelay: `${80 + i * 30}ms` }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{DAY_NAMES[i]}</p>
                    <p className="text-xs text-muted-foreground">{day.date}</p>
                  </div>
                  {day.meals.length > 0 ? (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">{fmt(day.calories)} kcal</span>
                      <span>{fmt(day.protein)}g P</span>
                      <span>{fmt(day.carbs)}g C</span>
                      <span>{fmt(day.fat)}g F</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/60">Not logged</span>
                  )}
                </div>

                {day.meals.length > 0 && (
                  <div className="flex flex-col gap-1.5 border-t border-border pt-3">
                    {MEAL_ORDER.flatMap((mealType) => {
                      const entries = day.meals.filter((m) => m.mealType === mealType);
                      if (entries.length === 0) return [];
                      return [
                        <div key={mealType}>
                          <p className="mb-1 text-[11px] font-semibold capitalize text-muted-foreground">{mealType}</p>
                          {entries.map((entry, j) => (
                            <div key={j} className="flex items-center justify-between text-xs py-0.5">
                              <span className="truncate max-w-[60%]">{entry.food}</span>
                              <span className="text-muted-foreground shrink-0">
                                {fmt(entry.calories)} kcal
                                {entry.protein > 0 ? ` · ${fmt(entry.protein)}g P` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      ];
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Print button bottom */}
      <div className="flex justify-end print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
