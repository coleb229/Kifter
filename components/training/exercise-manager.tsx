"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_EXERCISES } from "@/lib/exercises";
import { addUserExercise, deleteUserExercise } from "@/actions/workout-actions";

const inputClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface ExerciseManagerProps {
  customExercises: string[];
}

export function ExerciseManager({ customExercises }: ExerciseManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  function handleAdd() {
    setError("");
    if (!newName.trim()) return;
    startTransition(async () => {
      const result = await addUserExercise(newName);
      if (result.success) {
        setNewName("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete(name: string) {
    startTransition(async () => {
      await deleteUserExercise(name);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Defaults */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Default Exercises
        </h2>
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {DEFAULT_EXERCISES.map((name) => (
            <div key={name} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{name}</span>
              <span className="text-xs text-muted-foreground">built-in</span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your Custom Exercises
        </h2>
        {customExercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">No custom exercises yet.</p>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {customExercises.map((name) => (
              <div key={name} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{name}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(name)}
                  disabled={isPending}
                  aria-label={`Remove ${name}`}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Add Exercise
        </h2>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="e.g. Romanian Deadlift"
            className={inputClass}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={isPending || !newName.trim()}
          >
            <Plus className="size-4" />
            Add
          </Button>
        </div>
        {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
