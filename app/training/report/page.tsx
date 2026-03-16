"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportPickerPage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  function handleGenerate() {
    router.push(`/training/report/${year}/${month}`);
  }

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div className="animate-fade-up">
        <Link
          href="/training"
          className="mb-4 flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Training
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/40">
            <FileText className="size-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Monthly Report</h1>
            <p className="text-sm text-muted-foreground">View and print your progress summary</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 animate-fade-up" style={{ animationDelay: "50ms" }}>
        <p className="text-sm font-medium">Select month</p>
        <div className="flex gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          >
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>{name}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
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
