"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Search } from "lucide-react";
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
  const [search, setSearch] = useState("");

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

  const filteredDefaults = search
    ? DEFAULT_EXERCISES.filter((n) => n.toLowerCase().includes(search.toLowerCase()))
    : DEFAULT_EXERCISES;
  const filteredCustom = search
    ? customExercises.filter((n) => n.toLowerCase().includes(search.toLowerCase()))
    : customExercises;
  const totalShown = filteredDefaults.length + filteredCustom.length;
  const totalAll = DEFAULT_EXERCISES.length + customExercises.length;

  return (
    <div className="flex flex-col gap-8">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises…"
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-base sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors placeholder:text-muted-foreground"
        />
        {search && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {totalShown} of {totalAll}
          </span>
        )}
      </div>

      {/* Defaults */}
      {filteredDefaults.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Default Exercises <span className="font-normal">({filteredDefaults.length})</span>
          </h2>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {filteredDefaults.map((name) => (
              <div key={name} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{name}</span>
                <span className="text-xs text-muted-foreground">built-in</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your Custom Exercises <span className="font-normal">({customExercises.length})</span>
        </h2>
        {filteredCustom.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {search ? "No custom exercises match your search." : "No custom exercises yet."}
          </p>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {filteredCustom.map((name) => (
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
