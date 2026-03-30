"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, Trash2, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { logInjury, resolveInjury, deleteInjury } from "@/actions/injury-actions";
import { MUSCLE_GROUPS } from "@/types";
import type { Injury, MuscleGroup, SeverityLevel } from "@/types";

interface Props {
  injuries: Injury[];
}

const SEVERITY_STYLES: Record<SeverityLevel, { badge: string; border: string; bg: string }> = {
  mild: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/40",
    bg: "bg-amber-50 dark:bg-amber-950/20",
  },
  moderate: {
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800/40",
    bg: "bg-orange-50 dark:bg-orange-950/20",
  },
  severe: {
    badge: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
    border: "border-red-200 dark:border-red-800/40",
    bg: "bg-red-50 dark:bg-red-950/20",
  },
};

const selectClass =
  "h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

const inputClass =
  "h-10 min-w-0 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function InjuryCard({
  injury,
  onResolve,
  onDelete,
  isPending,
}: {
  injury: Injury;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  const styles = SEVERITY_STYLES[injury.severity];
  const isResolved = !!injury.resolvedAt;

  return (
    <div className={`rounded-xl border p-4 ${styles.border} ${styles.bg} ${isResolved ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{injury.muscleGroup}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge}`}>
              {injury.severity}
            </span>
            {isResolved && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                resolved
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Started {format(new Date(injury.startDate + "T00:00:00"), "MMM d, yyyy")}
            {injury.expectedRecoveryDate && (
              <> · Expected recovery {format(new Date(injury.expectedRecoveryDate + "T00:00:00"), "MMM d, yyyy")}</>
            )}
          </p>
          {injury.notes && (
            <p className="mt-1 text-xs text-muted-foreground">{injury.notes}</p>
          )}
        </div>
        {!isResolved && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onResolve(injury.id)}
              disabled={isPending}
              className="rounded-lg border border-border bg-background/60 p-1.5 text-muted-foreground transition-colors hover:text-emerald-600 disabled:opacity-50"
              aria-label="Mark as resolved"
            >
              <Check className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(injury.id)}
              disabled={isPending}
              className="rounded-lg border border-border bg-background/60 p-1.5 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
              aria-label="Delete injury log"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function InjuryLog({ injuries: initialInjuries }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    muscleGroup: "" as MuscleGroup | "",
    severity: "" as SeverityLevel | "",
    startDate: todayStr(),
    expectedRecoveryDate: "",
    notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const active = initialInjuries.filter((i) => !i.resolvedAt);
  const resolved = initialInjuries.filter((i) => i.resolvedAt);

  function handleSubmit() {
    if (!form.muscleGroup || !form.severity) {
      setFormError("Muscle group and severity are required.");
      return;
    }
    setFormError(null);
    startTransition(async () => {
      const result = await logInjury({
        muscleGroup: form.muscleGroup as MuscleGroup,
        severity: form.severity as SeverityLevel,
        startDate: form.startDate,
        expectedRecoveryDate: form.expectedRecoveryDate || undefined,
        notes: form.notes || undefined,
      });
      if (result.success) {
        setShowForm(false);
        setForm({ muscleGroup: "", severity: "", startDate: todayStr(), expectedRecoveryDate: "", notes: "" });
        router.refresh();
      } else {
        setFormError(result.error);
      }
    });
  }

  function handleResolve(id: string) {
    startTransition(async () => {
      await resolveInjury(id);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteInjury(id);
      router.refresh();
    });
  }

  return (
    <div className="mb-6 animate-fade-up">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Injury & Soreness Log</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Log
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="mb-3 rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Muscle Group</label>
              <select
                value={form.muscleGroup}
                onChange={(e) => setForm({ ...form, muscleGroup: e.target.value as MuscleGroup })}
                className={selectClass + " w-full"}
              >
                <option value="">Select…</option>
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value as SeverityLevel })}
                className={selectClass + " w-full"}
              >
                <option value="">Select…</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Expected Recovery (optional)</label>
              <input
                type="date"
                value={form.expectedRecoveryDate}
                onChange={(e) => setForm({ ...form, expectedRecoveryDate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Sharp pain during overhead press"
              className={inputClass}
            />
          </div>
          {formError && <p className="text-xs text-destructive">{formError}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {active.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground">No active injuries logged.</p>
      )}

      {active.length > 0 && (
        <div className="flex flex-col gap-2">
          {active.map((injury) => (
            <InjuryCard
              key={injury.id}
              injury={injury}
              onResolve={handleResolve}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Recently resolved</p>
          {resolved.map((injury) => (
            <InjuryCard
              key={injury.id}
              injury={injury}
              onResolve={handleResolve}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
