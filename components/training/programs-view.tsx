"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Play, ChevronDown, ChevronUp, X } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { createProgram, deleteProgram, applyProgram } from "@/actions/program-actions";
import { BODY_TARGETS } from "@/types";
import type { WorkoutProgram, ProgramDay, ProgramExercise, BodyTarget } from "@/types";

interface Props {
  initialPrograms: WorkoutProgram[];
}

const emptyExercise = (): ProgramExercise => ({ exercise: "", sets: 3, reps: 10 });
const emptyDay = (): ProgramDay => ({ dayLabel: "", bodyTarget: "Push", exercises: [emptyExercise()] });

export function ProgramsView({ initialPrograms }: Props) {
  const router = useRouter();
  const [programs, setPrograms] = useState(initialPrograms);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applyId, setApplyId] = useState<string | null>(null);
  const [applyDate, setApplyDate] = useState(new Date().toISOString().slice(0, 10));
  const [applyMsg, setApplyMsg] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState<ProgramDay[]>([emptyDay()]);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [isApplying, startApply] = useTransition();

  function resetForm() {
    setName("");
    setDescription("");
    setDays([emptyDay()]);
    setShowForm(false);
  }

  function handleSave() {
    startSave(async () => {
      const result = await createProgram(name, description, days);
      if (result.success) {
        router.refresh();
        // Optimistically add — parent re-fetch via router.refresh handles truth
        resetForm();
      }
    });
  }

  function handleConfirmDelete(id: string) {
    setConfirmingId(id);
    setTimeout(() => setConfirmingId((prev) => prev === id ? null : prev), 3000);
  }

  function handleDelete(id: string) {
    setConfirmingId(null);
    startDelete(async () => {
      await deleteProgram(id);
      setPrograms((prev) => prev.filter((p) => p.id !== id));
    });
  }

  function handleApply() {
    if (!applyId) return;
    startApply(async () => {
      const result = await applyProgram(applyId, applyDate);
      if (result.success) {
        setApplyMsg(`Created ${result.data.sessions} session${result.data.sessions !== 1 ? "s" : ""} starting ${applyDate}.`);
        setTimeout(() => { setApplyId(null); setApplyMsg(null); router.push("/training"); }, 1800);
      } else {
        setApplyMsg(result.error);
      }
    });
  }

  // Day helpers
  function updateDay<K extends keyof ProgramDay>(dayIdx: number, key: K, value: ProgramDay[K]) {
    setDays((prev) => prev.map((d, i) => i === dayIdx ? { ...d, [key]: value } : d));
  }
  function addDay() { setDays((prev) => [...prev, emptyDay()]); }
  function removeDay(i: number) { setDays((prev) => prev.filter((_, idx) => idx !== i)); }

  // Exercise helpers
  function updateExercise<K extends keyof ProgramExercise>(dayIdx: number, exIdx: number, key: K, value: ProgramExercise[K]) {
    setDays((prev) => prev.map((d, i) => i === dayIdx ? {
      ...d,
      exercises: d.exercises.map((e, j) => j === exIdx ? { ...e, [key]: value } : e),
    } : d));
  }
  function addExercise(dayIdx: number) {
    setDays((prev) => prev.map((d, i) => i === dayIdx ? { ...d, exercises: [...d.exercises, emptyExercise()] } : d));
  }
  function removeExercise(dayIdx: number, exIdx: number) {
    setDays((prev) => prev.map((d, i) => i === dayIdx ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) } : d));
  }

  const totalExercises = (p: WorkoutProgram) => p.days.reduce((sum, d) => sum + d.exercises.length, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Programs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create reusable workout programs and apply them to your schedule
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
        >
          <Plus className="size-4" />
          New Program
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 animate-fade-up lg:grid lg:grid-cols-[280px_1fr] lg:gap-6">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold">New Program</p>
              <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Program name (e.g. PPL 6-Day)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Days */}
          <div className="flex flex-col gap-3">
            {days.map((day, di) => (
              <div key={di} className="rounded-lg border border-border bg-background p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Day ${di + 1} label (e.g. Push)`}
                    value={day.dayLabel}
                    onChange={(e) => updateDay(di, "dayLabel", e.target.value)}
                    className="flex-1 rounded-md border border-border bg-card px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                  />
                  <select
                    value={day.bodyTarget}
                    onChange={(e) => updateDay(di, "bodyTarget", e.target.value as BodyTarget)}
                    className="rounded-md border border-border bg-card px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                  >
                    {BODY_TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {days.length > 1 && (
                    <button type="button" onClick={() => removeDay(di)} className="text-muted-foreground hover:text-destructive">
                      <X className="size-4" />
                    </button>
                  )}
                </div>

                {/* Exercises */}
                <div className="flex flex-col gap-2 pl-1">
                  {day.exercises.map((ex, ei) => (
                    <div key={ei} className="flex items-center gap-2 flex-wrap">
                      <input
                        type="text"
                        placeholder="Exercise"
                        value={ex.exercise}
                        onChange={(e) => updateExercise(di, ei, "exercise", e.target.value)}
                        className="min-w-0 flex-1 rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={ex.sets || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "") { updateExercise(di, ei, "sets", 1); return; }
                          const n = parseInt(v, 10);
                          if (!isNaN(n) && n >= 0) updateExercise(di, ei, "sets", n);
                        }}
                        title="Sets"
                        className="w-14 rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                      />
                      <span className="text-xs text-muted-foreground">×</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={ex.reps || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "") { updateExercise(di, ei, "reps", 1); return; }
                          const n = parseInt(v, 10);
                          if (!isNaN(n) && n >= 0) updateExercise(di, ei, "reps", n);
                        }}
                        title="Reps"
                        className="w-14 rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                      />
                      {day.exercises.length > 1 && (
                        <button type="button" onClick={() => removeExercise(di, ei)} className="text-muted-foreground hover:text-destructive">
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addExercise(di)}
                    className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="size-3" /> Add exercise
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addDay}
              className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-4" /> Add day
            </button>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={resetForm} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save Program"}
            </button>
          </div>
        </div>
      )}

      {/* Apply modal */}
      {applyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Apply Program</p>
              <button type="button" onClick={() => { setApplyId(null); setApplyMsg(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Start date</label>
              <input
                type="date"
                value={applyDate}
                onChange={(e) => setApplyDate(e.target.value)}
                className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {applyMsg && (
              <p className={`text-sm ${applyMsg.startsWith("Created") ? "text-emerald-600" : "text-destructive"}`}>
                {applyMsg}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setApplyId(null); setApplyMsg(null); }} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={isApplying}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-50"
              >
                {isApplying ? "Applying…" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Program list */}
      {programs.length === 0 && !showForm && (
        <EmptyState
          icon={Play}
          title="No programs yet"
          description="Create one to get started."
        />
      )}

      <div className="flex flex-col gap-4">
        {programs.map((p, i) => (
          <div
            key={p.id}
            className="rounded-xl border border-border bg-card animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between gap-3 p-5">
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{p.name}</p>
                {p.description && <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.days.length} day{p.days.length !== 1 ? "s" : ""} · {totalExercises(p)} exercise{totalExercises(p) !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Toggle details"
                >
                  {expandedId === p.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => { setApplyId(p.id); setApplyMsg(null); }}
                  className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:brightness-110"
                >
                  <Play className="size-3" /> Apply
                </button>
                {confirmingId === p.id ? (
                  <div className="flex items-center gap-1" aria-live="polite">
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      disabled={isDeleting}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      Delete?
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConfirmDelete(p.id)}
                    disabled={isDeleting}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                    aria-label="Delete program"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {expandedId === p.id && (
              <div className="border-t border-border px-5 py-4 flex flex-col gap-3">
                {p.days.map((day, di) => (
                  <div key={di}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      {day.dayLabel || `Day ${di + 1}`} · {day.bodyTarget}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {day.exercises.map((ex, ei) => (
                        <p key={ei} className="text-sm">
                          {ex.exercise} — {ex.sets}×{ex.reps}
                          {ex.weight ? ` @ ${ex.weight}${ex.weightUnit ?? "lb"}` : ""}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
