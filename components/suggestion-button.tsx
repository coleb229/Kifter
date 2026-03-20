"use client";

import { useState, useTransition, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lightbulb, X, ImagePlus, Loader2, Sparkles } from "lucide-react";
import { submitSuggestion } from "@/actions/suggestion-actions";
import { generateSuggestionPrompts } from "@/actions/ai-actions";
import type { FormPrompt } from "@/actions/ai-actions";
import { useUploadThing } from "@/lib/uploadthing-client";
import type { SuggestionPriority } from "@/types";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  currentPainPoint: z.string().optional(),
  proposedSolution: z.string().optional(),
  useCase: z.string().optional(),
  priority: z.enum(["nice_to_have", "saves_time", "essential"] as const).optional(),
  inspiration: z.string().optional(),
  successCriteria: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const textareaClass =
  "min-h-20 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const PRIORITIES: { value: SuggestionPriority; label: string }[] = [
  { value: "nice_to_have", label: "Nice to have" },
  { value: "saves_time", label: "Saves time" },
  { value: "essential", label: "Essential" },
];

export function SuggestionButton() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [aiPrompts, setAiPrompts] = useState<FormPrompt[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const { startUpload, isUploading } = useUploadThing("suggestionImage", {
    onClientUploadComplete: (res) => {
      setImageUrls((prev) => [...prev, ...res.map((f) => f.url)]);
    },
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      currentPainPoint: "",
      proposedSolution: "",
      useCase: "",
      inspiration: "",
      successCriteria: "",
    },
  });

  const selectedPriority = watch("priority");
  const titleValue = watch("title");

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
    setAiPrompts([]);
    reset();
  }

  async function handleGetInsights() {
    setAiLoading(true);
    setAiPrompts([]);
    const res = await generateSuggestionPrompts({
      title: watch("title"),
      description: watch("description"),
    });
    if (res.success) setAiPrompts(res.data);
    setAiLoading(false);
  }

  function appendToField(field: keyof FormValues, text: string) {
    const current = (watch(field) as string) || "";
    setValue(field, current ? `${current}\n${text}` : text);
  }

  function dismissPrompt(index: number) {
    setAiPrompts((prev) => prev.filter((_, i) => i !== index));
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await submitSuggestion({
        title: values.title,
        description: values.description || undefined,
        currentPainPoint: values.currentPainPoint || undefined,
        proposedSolution: values.proposedSolution || undefined,
        useCase: values.useCase || undefined,
        priority: values.priority,
        inspiration: values.inspiration || undefined,
        successCriteria: values.successCriteria || undefined,
        imageUrls: imageUrls.length ? imageUrls : undefined,
      });
      if (result.success) {
        setSubmitted(true);
        reset();
      }
    });
  }

  return (
    <>
      {/* Floating button */}
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
          "size-9",
          "sm:size-10 sm:hover:w-36 sm:hover:rounded-xl sm:hover:bg-violet-500/20 sm:hover:border-violet-400 sm:hover:-translate-y-0.5 sm:hover:shadow-violet-500/20 sm:hover:shadow-lg",
          "active:scale-95",
        ].join(" ")}
      >
        <Lightbulb className="size-4 shrink-0 mx-auto sm:ml-3" />
        <span className="hidden whitespace-nowrap text-xs font-semibold sm:block sm:opacity-0 sm:-translate-x-1 sm:transition-all sm:duration-150 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 sm:pr-3">
          Suggest Idea
        </span>
      </button>

      {/* Modal */}
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={handleClose} />

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
                <button type="button" onClick={handleClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-5">

                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
                  <input
                    {...register("title")}
                    placeholder="Brief summary of your idea"
                    className={inputClass}
                  />
                  {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                </div>

                {/* AI Insights */}
                {titleValue.length >= 3 && (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleGetInsights}
                      disabled={aiLoading}
                      className="flex items-center gap-1.5 self-start rounded-full border border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30 px-3 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300 transition-colors hover:bg-violet-100 dark:hover:bg-violet-950/50 disabled:opacity-60"
                    >
                      {aiLoading ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                      {aiLoading ? "Thinking…" : "AI Insights"}
                    </button>

                    {aiPrompts.length > 0 && (
                      <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20 p-3 flex flex-col gap-2">
                        <p className="text-[10px] uppercase tracking-wide font-medium text-violet-600 dark:text-violet-400">AI suggestions — click to append</p>
                        <div className="flex flex-col gap-2">
                          {aiPrompts.map((prompt, i) => (
                            <div key={i} className="flex items-start gap-2 rounded-lg border border-violet-200 dark:border-violet-800 bg-white dark:bg-violet-950/30 px-3 py-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 mb-0.5">{prompt.label}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{prompt.text}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => appendToField(prompt.targetField as keyof FormValues, prompt.text)}
                                  className="rounded-md bg-violet-100 dark:bg-violet-900/40 px-2 py-1 text-[10px] font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors"
                                >
                                  Append
                                </button>
                                <button
                                  type="button"
                                  onClick={() => dismissPrompt(i)}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                  aria-label="Dismiss"
                                >
                                  <X className="size-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Description <span className="text-muted-foreground">(optional)</span></label>
                  <textarea
                    {...register("description")}
                    placeholder="Describe the improvement you'd like to see…"
                    className={textareaClass}
                  />
                </div>

                {/* Current pain point */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Current Pain Point <span className="text-muted-foreground">(optional)</span></label>
                  <textarea
                    {...register("currentPainPoint")}
                    placeholder="What frustrates you about the current experience?"
                    className={textareaClass}
                  />
                </div>

                {/* Proposed solution */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Proposed Solution <span className="text-muted-foreground">(optional)</span></label>
                  <textarea
                    {...register("proposedSolution")}
                    placeholder="How would you solve this? What should it look or work like?"
                    className={textareaClass}
                  />
                </div>

                {/* Use case */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Who Would Benefit? <span className="text-muted-foreground">(optional)</span></label>
                  <textarea
                    {...register("useCase")}
                    placeholder="Who would use this feature, and how often?"
                    className={textareaClass}
                  />
                </div>

                {/* Priority */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Priority <span className="text-muted-foreground">(optional)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {PRIORITIES.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setValue("priority", selectedPriority === value ? undefined : value)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          selectedPriority === value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inspiration */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Inspired by another app? <span className="text-muted-foreground">(optional)</span></label>
                  <input
                    {...register("inspiration")}
                    placeholder="e.g. MyFitnessPal does X, Strava does Y…"
                    className={inputClass}
                  />
                </div>

                {/* Success criteria */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Success Criteria <span className="text-muted-foreground">(optional)</span></label>
                  <textarea
                    {...register("successCriteria")}
                    placeholder="How would you know this feature is done well?"
                    className={textareaClass}
                  />
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
