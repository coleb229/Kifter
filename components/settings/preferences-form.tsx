"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePreferences } from "@/actions/user-actions";
import type { UserSummary } from "@/types";

interface Props {
  user: UserSummary | null;
}

export function PreferencesForm({ user }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [unit, setUnit] = useState<"lb" | "kg">(
    user?.preferences?.defaultWeightUnit ?? "lb"
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await updatePreferences({ defaultWeightUnit: unit });
      if (result.success) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Weight unit */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">Default weight unit</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Used when logging new sets
          </p>
        </div>
        <div className="flex gap-2">
          {(["lb", "kg"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
                unit === u
                  ? "bg-indigo-600 text-white shadow"
                  : "border border-border bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Preferences saved!
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
