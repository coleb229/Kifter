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

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      name: "",
      date: format(new Date(), "yyyy-MM-dd"),
      bodyTarget: "Push",
      notes: "",
    },
  });

  function onSubmit(values: SessionFormValues) {
    startTransition(async () => {
      const result = await createSession(values);
      if (result.success) {
        router.push(`/training/${result.data.sessionId}`);
      } else {
        form.setError("root", { message: result.error });
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Session name <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              {...form.register("name")}
              placeholder="e.g. Push Day"
              className={inputClass}
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Date</label>
            <input {...form.register("date")} type="date" className={inputClass} />
            {form.formState.errors.date && (
              <p className="text-xs text-destructive">
                {form.formState.errors.date.message}
              </p>
            )}
          </div>

          {/* Body target */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-sm font-medium">Body target</label>
            <select {...form.register("bodyTarget")} className={inputClass}>
              {BODY_TARGETS.map((target) => (
                <option key={target} value={target}>
                  {target}
                </option>
              ))}
            </select>
            {form.formState.errors.bodyTarget && (
              <p className="text-xs text-destructive">
                {form.formState.errors.bodyTarget.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-sm font-medium">
              Notes <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              {...form.register("notes")}
              placeholder="Any pre-workout notes?"
              className={textareaClass}
            />
          </div>
        </div>
      </div>

      {form.formState.errors.root && (
        <p className="text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="sm:self-end sm:px-10">
        {isPending ? "Creating..." : "Start Session"}
      </Button>
    </form>
  );
}
