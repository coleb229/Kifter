"use client";

import { useState, useTransition, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lightbulb, X, ImagePlus, Loader2 } from "lucide-react";
import { submitSuggestion } from "@/actions/suggestion-actions";
import { useUploadThing } from "@/lib/uploadthing-client";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const textareaClass =
  "min-h-20 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SuggestionButton() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const { startUpload, isUploading } = useUploadThing("suggestionImage", {
    onClientUploadComplete: (res) => {
      setImageUrls((prev) => [...prev, ...res.map((f) => f.url)]);
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "" },
  });

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  if (!session?.user) return null;

  function handleClose() {
    setOpen(false);
    setSubmitted(false);
    setImageUrls([]);
    reset();
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await submitSuggestion({ ...values, imageUrls: imageUrls.length ? imageUrls : undefined });
      if (result.success) {
        setSubmitted(true);
        reset();
      }
    });
  }

  return (
    <>
      {/* Floating button — bottom-left, above bug report button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Suggest an improvement"
        className={[
          "group",
          "fixed bottom-32 left-4 z-40",
          "sm:bottom-20 sm:left-5",
          "flex items-center gap-2 overflow-hidden",
          "rounded-full border",
          "bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400",
          "shadow-md transition-all duration-200 ease-out",
          // Mobile: icon-only, small
          "size-9",
          // Desktop: icon-only, expands on hover
          "sm:size-10 sm:hover:w-36 sm:hover:rounded-xl sm:hover:bg-violet-500/20 sm:hover:border-violet-400 sm:hover:-translate-y-0.5 sm:hover:shadow-violet-500/20 sm:hover:shadow-lg",
          "active:scale-95",
        ].join(" ")}
      >
        <Lightbulb className="size-4 shrink-0 mx-auto sm:ml-3" />
        {/* Hidden on mobile, visible on hover on desktop */}
        <span className="hidden whitespace-nowrap text-xs font-semibold sm:block sm:opacity-0 sm:-translate-x-1 sm:transition-all sm:duration-150 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 sm:pr-3">
          Suggest Idea
        </span>
      </button>

      {/* Modal */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-lg rounded-2xl border border-border bg-card shadow-xl overflow-y-auto max-h-[90dvh]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4 text-violet-500" />
                <h2 className="text-sm font-semibold">Suggest an Improvement</h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center gap-4 px-5 py-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/40 text-2xl">
                  💡
                </div>
                <div>
                  <p className="font-semibold">Idea submitted!</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Thanks — your suggestion has been added to the board for review.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Title</label>
                  <input
                    {...register("title")}
                    placeholder="Brief summary of your idea"
                    className={inputClass}
                  />
                  {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    {...register("description")}
                    placeholder="Describe the improvement you'd like to see..."
                    className={textareaClass}
                  />
                  {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                </div>

                {/* Images */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">
                    Images <span className="text-muted-foreground">(optional, max 3)</span>
                  </label>
                  {imageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {imageUrls.map((url, i) => (
                        <div key={url} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Image ${i + 1}`} className="size-16 rounded-lg border border-border object-cover" />
                          <button
                            type="button"
                            onClick={() => setImageUrls((prev) => prev.filter((_, j) => j !== i))}
                            className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                          >
                            <X className="size-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {imageUrls.length < 3 && (
                    <label className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-ring hover:text-foreground ${isUploading ? "opacity-60 pointer-events-none" : ""}`}>
                      {isUploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
                      {isUploading ? "Uploading…" : "Add image"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []).slice(0, 3 - imageUrls.length);
                          if (files.length) startUpload(files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="mt-1 h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {isPending ? "Submitting…" : "Submit Suggestion"}
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </>
  );
}
