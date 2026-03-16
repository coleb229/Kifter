"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BODY_TARGETS } from "@/types";
import { updateSession, deleteSession } from "@/actions/workout-actions";
import type { WorkoutSession } from "@/types";
import { BODY_TARGET_STYLES } from "@/lib/label-colors";

const schema = z.object({
  name: z.string().optional(),
  date: z.string().min(1, "Date required"),
  bodyTarget: z.enum(BODY_TARGETS, { error: "Select a body target" }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  "h-10 min-w-0 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const textareaClass =
  "min-h-16 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface Props {
  session: WorkoutSession;
}

export function EditableSessionHeader({ session }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"view" | "edit" | "confirm-delete">("view");
  const date = new Date(session.date.slice(0, 10) + "T00:00:00");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: session.name ?? "",
      date: format(date, "yyyy-MM-dd"),
      bodyTarget: session.bodyTarget,
      notes: session.notes ?? "",
    },
  });

  function handleEdit() {
    form.reset({
      name: session.name ?? "",
      date: session.date.slice(0, 10),
      bodyTarget: session.bodyTarget,
      notes: session.notes ?? "",
    });
    setMode("edit");
  }

  function handleSave(values: FormValues) {
    startTransition(async () => {
      const result = await updateSession(session.id, values);
      if (result.success) {
        setMode("view");
        router.refresh();
      } else {
        form.setError("root", { message: result.error });
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteSession(session.id);
      router.push("/training");
    });
  }

  if (mode === "edit") {
    return (
      <form onSubmit={form.handleSubmit(handleSave)} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Name <span className="text-muted-foreground">(optional)</span>
            </label>
            <input {...form.register("name")} placeholder="e.g. Push Day" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Date</label>
            <input {...form.register("date")} type="date" className={inputClass} />
            {form.formState.errors.date && (
              <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="text-sm font-medium">Body target</label>
            <div className="flex flex-wrap gap-2">
              {BODY_TARGETS.map((t) => {
                const colors = BODY_TARGET_STYLES[t].pill;
                const isSelected = form.watch("bodyTarget") === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => form.setValue("bodyTarget", t, { shouldValidate: true })}
                    className={`rounded-full border px-3.5 py-1 text-sm font-medium transition-colors ${isSelected ? colors.active : colors.inactive}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-sm font-medium">
              Notes <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea {...form.register("notes")} className={textareaClass} />
          </div>
        </div>
        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isPending}>
            <Check className="size-3.5" />
            {isPending ? "Saving…" : "Save"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setMode("view")}>
            <X className="size-3.5" />
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {session.name ?? format(date, "EEEE, MMM d")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(date, "MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${BODY_TARGET_STYLES[session.bodyTarget].badge}`}>
            {session.bodyTarget}
          </span>
          <button
            type="button"
            onClick={handleEdit}
            aria-label="Edit session"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Pencil className="size-4" />
          </button>
          {mode === "confirm-delete" ? (
            <span className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Delete session?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="font-medium text-destructive transition-colors hover:underline"
              >
                {isPending ? "Deleting…" : "Yes"}
              </button>
              <button
                type="button"
                onClick={() => setMode("view")}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setMode("confirm-delete")}
              aria-label="Delete session"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>
      {session.notes && (
        <p className="mt-3 text-sm text-muted-foreground">{session.notes}</p>
      )}
    </div>
  );
}
