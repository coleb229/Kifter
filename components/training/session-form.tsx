"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { BODY_TARGETS } from "@/types";
import type { BodyTarget } from "@/types";
import { createSession } from "@/actions/workout-actions";

const BODY_TARGET_COLORS: Record<BodyTarget, { active: string; inactive: string }> = {
  "Push":       { active: "bg-indigo-500 border-indigo-500 text-white",   inactive: "border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/40" },
  "Pull":       { active: "bg-sky-500 border-sky-500 text-white",         inactive: "border-sky-200 text-sky-600 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-400 dark:hover:bg-sky-950/40" },
  "Legs":       { active: "bg-emerald-500 border-emerald-500 text-white", inactive: "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40" },
  "Upper Body": { active: "bg-violet-500 border-violet-500 text-white",   inactive: "border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/40" },
  "Lower Body": { active: "bg-teal-500 border-teal-500 text-white",       inactive: "border-teal-200 text-teal-600 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950/40" },
  "Full Body":  { active: "bg-amber-500 border-amber-500 text-white",     inactive: "border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/40" },
  "Core":       { active: "bg-orange-500 border-orange-500 text-white",   inactive: "border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/40" },
  "Cardio":     { active: "bg-cyan-500 border-cyan-500 text-white",       inactive: "border-cyan-200 text-cyan-600 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-400 dark:hover:bg-cyan-950/40" },
  "Other":      { active: "bg-slate-500 border-slate-500 text-white",     inactive: "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/40" },
};

const sessionSchema = z.object({
  name: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  bodyTarget: z.enum(BODY_TARGETS, { error: "Select a body target" }),
  notes: z.string().optional(),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

const inputClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const textareaClass =
  "min-h-20 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SessionForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      name: "",
      date: format(new Date(), "yyyy-MM-dd"),
      bodyTarget: "Push",
      notes: "",
    },
  });

  const selectedTarget = watch("bodyTarget");

  function onSubmit(values: SessionFormValues) {
    startTransition(async () => {
      const result = await createSession(values);
      if (result.success) {
        router.push(`/training/${result.data.sessionId}`);
      } else {
        // surface error — no root.setError available without full form object, use alert as fallback
        console.error(result.error);
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
            <input {...register("date")} type="date" className={inputClass} />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* Body target — colored pill selector */}
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="text-sm font-medium">Body target</label>
            <div className="flex flex-wrap gap-2">
              {BODY_TARGETS.map((target) => {
                const colors = BODY_TARGET_COLORS[target];
                const isSelected = selectedTarget === target;
                return (
                  <button
                    key={target}
                    type="button"
                    onClick={() => setValue("bodyTarget", target, { shouldValidate: true })}
                    className={`rounded-full border px-3.5 py-1 text-sm font-medium transition-colors ${
                      isSelected ? colors.active : colors.inactive
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

          {/* Notes */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-sm font-medium">
              Notes <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              {...register("notes")}
              placeholder="Any pre-workout notes?"
              className={textareaClass}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="sm:self-end sm:px-10">
        {isPending ? "Creating..." : "Start Session"}
      </Button>
    </form>
  );
}
