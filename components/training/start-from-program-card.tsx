"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ChevronRight, Layers } from "lucide-react";
import { applyProgram } from "@/actions/program-actions";
import type { WorkoutProgram } from "@/types";

interface Props {
  programs: WorkoutProgram[];
}

export function StartFromProgramCard({ programs }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (programs.length === 0) return null;

  const today = format(new Date(), "yyyy-MM-dd");

  function handleStart(program: WorkoutProgram) {
    setPendingId(program.id);
    setMessage(null);
    startTransition(async () => {
      const result = await applyProgram(program.id, today);
      setPendingId(null);
      if (result.success) {
        const count = result.data.sessions;
        setMessage(`${count} session${count !== 1 ? "s" : ""} created from "${program.name}"`);
        router.refresh();
      } else {
        setMessage(result.error);
      }
    });
  }

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-4 animate-fade-up" style={{ animationDelay: "80ms" }}>
      <div className="mb-3 flex items-center gap-2">
        <Layers className="size-4 text-muted-foreground" />
        <p className="text-sm font-semibold">Start from Program</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {programs.map((program) => (
          <button
            key={program.id}
            type="button"
            onClick={() => handleStart(program)}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
          >
            {pendingId === program.id ? "Creating…" : program.name}
            {pendingId !== program.id && <ChevronRight className="size-3.5" />}
          </button>
        ))}
      </div>

      {message && (
        <p className="mt-2 text-xs text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
