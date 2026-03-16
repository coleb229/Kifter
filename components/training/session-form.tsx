"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { BODY_TARGETS } from "@/types";
import { createSession } from "@/actions/workout-actions";
import { BODY_TARGET_STYLES } from "@/lib/label-colors";

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

  const NAME_SUGGESTIONS: Partial<Record<string, string>> = {
    Push: "Push Day", Pull: "Pull Day", Legs: "Leg Day",
    "Upper Body": "Upper Body Day", "Lower Body": "Lower Body Day",
    "Full Body": "Full Body", Core: "Core Work", Cardio: "Cardio Session",
  };

  function handleBodyTargetChange(target: string) {
    setValue("bodyTarget", target as SessionFormValues["bodyTarget"], { shouldValidate: true });
    const currentName = watch("name");
    if (!currentName) setValue("name", NAME_SUGGESTIONS[target] ?? "");
  }

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
                const colors = BODY_TARGET_STYLES[target].pill;
                const isSelected = selectedTarget === target;
                return (
                  <button
                    key={target}
                    type="button"
                    onClick={() => handleBodyTargetChange(target)}
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
