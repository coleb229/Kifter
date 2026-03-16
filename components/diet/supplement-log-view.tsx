"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Pill } from "lucide-react";
import { format } from "date-fns";
import { addSupplementLog, deleteSupplementLog } from "@/actions/supplement-actions";
import type { SupplementLog, SupplementTiming, SUPPLEMENT_TIMINGS } from "@/types";

const TIMING_LABELS: Record<SupplementTiming, string> = {
  "morning":       "Morning",
  "pre-workout":   "Pre-Workout",
  "post-workout":  "Post-Workout",
  "with-meal":     "With Meal",
  "bedtime":       "Bedtime",
  "other":         "Other",
};

const TIMING_OPTIONS: SupplementTiming[] = [
  "morning", "pre-workout", "post-workout", "with-meal", "bedtime", "other",
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function groupByDate(logs: SupplementLog[]): { date: string; logs: SupplementLog[] }[] {
  const map = new Map<string, SupplementLog[]>();
  for (const log of logs) {
    const key = log.date;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(log);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, logs]) => ({ date, logs }));
}

interface Props {
  initialLogs: SupplementLog[];
}

export function SupplementLogView({ initialLogs }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  const [date, setDate] = useState(todayStr());
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [timing, setTiming] = useState<SupplementTiming>("morning");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const grouped = groupByDate(initialLogs);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Enter a supplement name."); return; }
    if (!dosage.trim()) { setError("Enter a dosage."); return; }
    setError("");
    startTransition(async () => {
      await addSupplementLog({ date, name: name.trim(), dosage: dosage.trim(), timing, notes: notes.trim() || undefined });
      setName("");
      setDosage("");
      setNotes("");
      setShowForm(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Log button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 transition-all"
        >
          <Plus className="size-3.5" />
          Log Supplement
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-sm font-semibold">Add supplement</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-1">
                <label className="text-xs text-muted-foreground">Name</label>
                <input type="text" placeholder="e.g. Creatine" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Dosage</label>
                <input type="text" placeholder="e.g. 5g" value={dosage} onChange={(e) => setDosage(e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Timing</label>
                <select value={timing} onChange={(e) => setTiming(e.target.value as SupplementTiming)}
                  className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30">
                  {TIMING_OPTIONS.map((t) => (
                    <option key={t} value={t}>{TIMING_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Notes (optional)</label>
              <input type="text" placeholder="e.g. with water" value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={isPending}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-50 transition-all">
                {isPending ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Log */}
      {grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Pill className="size-8 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-medium text-sm">No supplements logged yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Track your supplements with dosage and timing.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(({ date, logs }) => (
            <div key={date} className="rounded-xl border border-border bg-card overflow-hidden">
              <p className="px-5 py-3 text-xs font-semibold text-muted-foreground border-b border-border bg-muted/30">
                {format(new Date(date + "T00:00:00"), "EEEE, MMMM d, yyyy")}
              </p>
              <div className="divide-y divide-border">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{log.name} · {log.dosage}</p>
                      <p className="text-xs text-muted-foreground">
                        {TIMING_LABELS[log.timing]}
                        {log.notes && ` · ${log.notes}`}
                      </p>
                    </div>
                    <button type="button" onClick={() => {
                      startTransition(async () => {
                        await deleteSupplementLog(log.id);
                        router.refresh();
                      });
                    }} disabled={isPending}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 transition-colors">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
