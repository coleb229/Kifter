"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BODY_TARGETS } from "@/types";
import { createSession } from "@/actions/workout-actions";
import { BODY_TARGET_STYLES } from "@/lib/label-colors";
import { useFormPersistence } from "@/hooks/use-form-persistence";

const sessionSchema = z.object({
  name: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  bodyTarget: z.enum(BODY_TARGETS, { error: "Select a body target" }),
  notes: z.string().optional(),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

const inputClass =
  "h-10 min-w-0 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const textareaClass =
  "min-h-20 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SessionForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showNotes, setShowNotes] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      name: "",
      date: format(new Date(), "yyyy-MM-dd"),
      bodyTarget: "Push",
      notes: "",
    },
  });

  // Correct the date to local timezone after hydration — the server renders
  // in UTC which can be a different calendar day than the user's local time.
  useEffect(() => {
    setValue("date", format(new Date(), "yyyy-MM-dd"));
  }, [setValue]);

  const values = watch();
  const { isDraftSaved, clearDraft } = useFormPersistence({
    key: "session-form",
    values,
    reset,
    exclude: ["date"], // don't restore stale dates
  });

  const selectedTarget = watch("bodyTarget");

  const NAME_SUGGESTIONS: Partial<Record<string, string>> = {
    Push: "Push Day", Pull: "Pull Day", Legs: "Leg Day",
    "Upper Body": "Upper Body Day", "Lower Body": "Lower Body Day",
    "Full Body": "Full Body", Core: "Core Work", Cardio: "Cardio Session",
  };

  function handleBodyTargetChange(target: string) {
    setValue("bodyTarget", target as SessionFormValues["bodyTarget"], { shouldValidate: true });
    const currentName = watch("name");
    const isSuggested = !currentName || Object.values(NAME_SUGGESTIONS).includes(currentName);
    if (isSuggested) setValue("name", NAME_SUGGESTIONS[target] ?? "");
  }

  function onSubmit(formValues: SessionFormValues) {
    setSubmitError(null);
    if (!navigator.onLine) {
      setSubmitError("You're offline. Your data is saved locally and will sync when you reconnect.");
      return;
    }
    startTransition(async () => {
      const result = await createSession(formValues);
      if (result.success) {
        clearDraft();
        router.push(`/training/${result.data.sessionId}`);
      } else {
        setSubmitError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Session name <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              {...register("name")}
              placeholder="e.g. Push Day"
              className={inputClass}
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Date</label>
            <input {...register("date")} type="date" className={inputClass} suppressHydrationWarning />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* Body target — colored tile selector */}
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="text-sm font-medium">Body target</label>
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
              {BODY_TARGETS.map((target) => {
                const colors = BODY_TARGET_STYLES[target].pill;
                const isSelected = selectedTarget === target;
                return (
                  <button
                    key={target}
                    type="button"
                    onClick={() => handleBodyTargetChange(target)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      isSelected ? `${colors.active} ring-2 ring-offset-2 ring-current` : colors.inactive
                    }`}
                  >
                    {target}
                  </button>
                );
              })}
            </div>
            {errors.bodyTarget && (
              <p className="text-xs text-destructive">{errors.bodyTarget.message}</p>
            )}
          </div>

          {/* Notes — collapsed by default */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            {showNotes ? (
              <textarea
                {...register("notes")}
                placeholder="Any pre-workout notes?"
                autoFocus
                className={textareaClass}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowNotes(true)}
                className="flex items-center gap-1 self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Plus className="size-3" />
                Add notes
              </button>
            )}
          </div>
        </div>
      </div>

      {submitError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {submitError}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        {isDraftSaved ? (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 animate-fade-up">
            <CheckCircle2 className="size-3.5" />
            Draft saved
          </span>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto sm:self-end sm:px-10">
          {isPending ? "Creating..." : `Start ${selectedTarget} Session`}
        </Button>
      </div>
    </form>
  );
}
