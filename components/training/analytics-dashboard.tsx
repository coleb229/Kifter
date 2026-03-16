"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { Trophy, Dumbbell, Zap, BarChart2 } from "lucide-react";
import { getExerciseHistory } from "@/actions/analytics-actions";
import { AnalyticsChart } from "@/components/training/analytics-chart";
import { YearPicker } from "@/components/ui/year-picker";
import type { SessionDataPoint } from "@/actions/analytics-actions";

interface Props {
  exercises: string[];
  initialExercise: string;
  initialData: SessionDataPoint[];
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
  animDelay,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
  animDelay?: string;
}) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-4 animate-fade-up"
      style={animDelay ? { animationDelay: animDelay } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={`rounded-lg p-2 ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

// ── AnalyticsDashboard ─────────────────────────────────────────────────────────

export function AnalyticsDashboard({
  exercises,
  initialExercise,
  initialData,
}: Props) {
  const [selected, setSelected] = useState(initialExercise);
  const [data, setData] = useState<SessionDataPoint[]>(initialData);
  const [isPending, startTransition] = useTransition();

  const years = useMemo(
    () => [...new Set(data.map((p) => new Date(p.isoDate).getFullYear()))].sort((a, b) => b - a),
    [data]
  );
  const [selectedYear, setSelectedYear] = useState<number>(() => years[0] ?? new Date().getFullYear());

  // Reset to most recent year whenever the exercise changes and years shift
  useEffect(() => {
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  const filteredData = useMemo(
    () => data.filter((p) => new Date(p.isoDate).getFullYear() === selectedYear),
    [data, selectedYear]
  );

  function handleSelect(name: string) {
    if (name === selected) return;
    setSelected(name);
    startTransition(async () => {
      const result = await getExerciseHistory(name);
      if (result.success) setData(result.data);
    });
  }

  // ── Derived stats (from filtered data) ──────────────────────────────────────

  const pr = filteredData.reduce<SessionDataPoint | null>((best, p) => {
    if (!best || p.maxWeightLb > best.maxWeightLb) return p;
    return best;
  }, null);

  const totalVolumeLb = filteredData.reduce((sum, p) => sum + p.totalVolumeLb, 0);
  const totalReps = filteredData.reduce((sum, p) => sum + p.totalReps, 0);
  const totalSets = filteredData.reduce((sum, p) => sum + p.setCount, 0);
  const avgReps = totalSets > 0 ? Math.round(totalReps / totalSets) : 0;

  const prLabel = pr ? `${pr.maxWeightRaw} ${pr.maxWeightUnit}` : "—";
  const prSub = pr ? format(new Date(pr.isoDate), "MMM d, yyyy") : undefined;

  const volumeLabel =
    totalVolumeLb >= 1000
      ? `${(totalVolumeLb / 1000).toFixed(1)}k lb`
      : `${totalVolumeLb} lb`;

  return (
    <div className="flex flex-col gap-6">
      {/* Exercise selector */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {exercises.map((name, i) => (
            <button
              key={name}
              type="button"
              onClick={() => handleSelect(name)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors animate-fade-up ${
                selected === name
                  ? "bg-indigo-600 text-white shadow"
                  : "border border-border bg-muted text-muted-foreground hover:text-foreground"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Year picker */}
      {years.length > 1 && (
        <YearPicker years={years} selectedYear={selectedYear} onChange={setSelectedYear} />
      )}

      {/* Stat cards */}
      <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 transition-opacity ${isPending ? "opacity-50" : ""}`}>
        <StatCard
          icon={<Trophy className="size-4" />}
          iconBg="bg-indigo-100 dark:bg-indigo-950/40"
          iconColor="text-indigo-600 dark:text-indigo-400"
          label="Personal Record"
          value={prLabel}
          sub={prSub}
          animDelay="0ms"
        />
        <StatCard
          icon={<Dumbbell className="size-4" />}
          iconBg="bg-violet-100 dark:bg-violet-950/40"
          iconColor="text-violet-600 dark:text-violet-400"
          label="Sessions"
          value={filteredData.length > 0 ? String(filteredData.length) : "—"}
          sub={filteredData.length === 1 ? "session logged" : filteredData.length > 1 ? "sessions logged" : undefined}
          animDelay="80ms"
        />
        <StatCard
          icon={<Zap className="size-4" />}
          iconBg="bg-emerald-100 dark:bg-emerald-950/40"
          iconColor="text-emerald-600 dark:text-emerald-400"
          label="Total Volume"
          value={totalVolumeLb > 0 ? volumeLabel : "—"}
          sub="normalized to lb"
          animDelay="160ms"
        />
        <StatCard
          icon={<BarChart2 className="size-4" />}
          iconBg="bg-amber-100 dark:bg-amber-950/40"
          iconColor="text-amber-600 dark:text-amber-400"
          label="Avg Reps / Set"
          value={avgReps > 0 ? String(avgReps) : "—"}
          sub={totalReps > 0 ? `${totalReps} total reps` : undefined}
          animDelay="240ms"
        />
      </div>

      {/* Chart */}
      <AnalyticsChart data={filteredData} isPending={isPending} />
    </div>
  );
}
