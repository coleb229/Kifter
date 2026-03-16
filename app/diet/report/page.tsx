"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export default function DietReportPickerPage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [week, setWeek] = useState(getISOWeek(now));

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);
  const currentYear = now.getFullYear();
  const maxWeek = year === currentYear ? getISOWeek(now) : 53;
  const weeks = Array.from({ length: maxWeek }, (_, i) => i + 1).reverse();

  function handleGenerate() {
    router.push(`/diet/report/${year}/${week}`);
  }

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div className="animate-fade-up">
        <Link
          href="/diet"
          className="mb-4 flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Diet
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
            <FileText className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nutrition Report</h1>
            <p className="text-sm text-muted-foreground">Export your weekly nutrition summary as PDF</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 animate-fade-up" style={{ animationDelay: "50ms" }}>
        <p className="text-sm font-medium">Select week</p>
        <div className="flex gap-3">
          <select
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          >
            {weeks.map((w) => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => { setYear(Number(e.target.value)); setWeek(1); }}
            className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <Button onClick={handleGenerate} className="w-full">
          Generate Report
        </Button>
      </div>
    </div>
  );
}
