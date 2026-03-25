"use client";

import { useState, useTransition, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bug, X, ExternalLink, ImagePlus, Loader2, Link2, Sparkles } from "lucide-react";
import { submitBugReport, getOpenBugReportsForLinking } from "@/actions/bug-report-actions";
import { generateBugReportPrompts } from "@/actions/ai-actions";
import type { FormPrompt } from "@/actions/ai-actions";
import { useUploadThing } from "@/lib/uploadthing-client";
import type { BugCategory, BugFrequency, BugSeverity } from "@/types";
import { useFormPersistence } from "@/hooks/use-form-persistence";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  page: z.string().optional(),
  category: z.enum(["ui", "feature", "data", "performance", "other"] as const).optional(),
  severity: z.enum(["low", "medium", "high", "critical"] as const).optional(),
  description: z.string().optional(),
  steps: z.string().optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  frequency: z.enum(["always", "sometimes", "rarely"] as const).optional(),
  impact: z.string().optional(),
  workaround: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const textareaClass =
  "min-h-16 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const CATEGORIES: { value: BugCategory; label: string }[] = [
  { value: "ui", label: "UI/UX" },
  { value: "feature", label: "Feature Broken" },
  { value: "data", label: "Data Issue" },
  { value: "performance", label: "Performance" },
  { value: "other", label: "Other" },
];

const SEVERITIES: { value: BugSeverity; label: string; active: string; inactive: string }[] = [
  { value: "low", label: "Low", active: "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-400 text-emerald-700 dark:text-emerald-300", inactive: "border-border text-muted-foreground hover:bg-muted" },
  { value: "medium", label: "Medium", active: "bg-yellow-100 dark:bg-yellow-950/50 border-yellow-400 text-yellow-700 dark:text-yellow-300", inactive: "border-border text-muted-foreground hover:bg-muted" },
  { value: "high", label: "High", active: "bg-orange-100 dark:bg-orange-950/50 border-orange-400 text-orange-700 dark:text-orange-300", inactive: "border-border text-muted-foreground hover:bg-muted" },
  { value: "critical", label: "Critical", active: "bg-red-100 dark:bg-red-950/50 border-red-400 text-red-700 dark:text-red-300", inactive: "border-border text-muted-foreground hover:bg-muted" },
];

const FREQUENCIES: { value: BugFrequency; label: string }[] = [
  { value: "always", label: "Always" },
  { value: "sometimes", label: "Sometimes" },
  { value: "rarely", label: "Rarely" },
];

function getDeviceInfo(): string {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  let os = "Unknown OS";
  let browser = "Unknown Browser";

  if (/iPhone/.test(ua)) os = "iPhone";
  else if (/iPad/.test(ua)) os = "iPad";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Mac/.test(ua)) os = "macOS";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/Linux/.test(ua)) os = "Linux";

  if (/CriOS/.test(ua)) browser = "Chrome (iOS)";
  else if (/FxiOS/.test(ua)) browser = "Firefox (iOS)";
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = "Safari";
  else if (/Chrome/.test(ua)) browser = "Chrome";
  else if (/Firefox/.test(ua)) browser = "Firefox";
  else if (/Edg/.test(ua)) browser = "Edge";

  return `${os} / ${browser}`;
}

export function BugReportButton() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState<{ githubIssueUrl?: string } | null>(null);
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [relatedBugIds, setRelatedBugIds] = useState<string[]>([]);
  const [openBugs, setOpenBugs] = useState<{ id: string; title: string }[]>([]);
  const [showRelated, setShowRelated] = useState(false);
  const [aiPrompts, setAiPrompts] = useState<FormPrompt[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [appendedIdx, setAppendedIdx] = useState<number | null>(null);

  const { startUpload, isUploading } = useUploadThing("bugScreenshot", {
    onClientUploadComplete: (res) => {
      setScreenshotUrls((prev) => [...prev, ...res.map((f) => f.url)]);
    },
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      page: pathname,
      description: "",
      steps: "",
      expectedBehavior: "",
      actualBehavior: "",
      impact: "",
      workaround: "",
    },
  });

  const selectedCategory = watch("category");
  const selectedSeverity = watch("severity");
  const selectedFrequency = watch("frequency");
  const titleValue = watch("title");
  const allValues = watch();

  const { isDraftSaved, clearDraft } = useFormPersistence({
    key: "bug-report-form",
    values: allValues as Record<string, unknown>,
    reset: reset as (v: Partial<Record<string, unknown>>) => void,
  });

  useEffect(() => {
    if (open) {
      setValue("page", pathname);
      getOpenBugReportsForLinking().then((res) => {
        if (res.success) setOpenBugs(res.data);
      });
    }
  }, [open, pathname, setValue]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  if (!session?.user) return null;

  function handleClose() {
    setOpen(false);
    setSubmitted(null);
    setScreenshotUrls([]);
    setRelatedBugIds([]);
    setShowRelated(false);
    setAiPrompts([]);
    reset();
  }

  async function handleGetInsights() {
    setAiLoading(true);
    setAiPrompts([]);
    const res = await generateBugReportPrompts({
      title: watch("title"),
      category: watch("category"),
      page: watch("page"),
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
      const result = await submitBugReport({
        title: values.title,
        category: values.category,
        severity: values.severity,
        page: values.page || undefined,
        description: values.description || undefined,
        steps: values.steps || undefined,
        expectedBehavior: values.expectedBehavior || undefined,
        actualBehavior: values.actualBehavior || undefined,
        frequency: values.frequency,
        impact: values.impact || undefined,
        workaround: values.workaround || undefined,
        deviceInfo: getDeviceInfo(),
        screenshotUrls: screenshotUrls.length ? screenshotUrls : undefined,
        relatedBugIds: relatedBugIds.length ? relatedBugIds : undefined,
      });
      if (result.success) {
        clearDraft();
        setSubmitted({ githubIssueUrl: result.data.githubIssueUrl });
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
        aria-label="Report a bug"
        className={[
          "group",
          "fixed bottom-20 left-4 z-40",
          "sm:bottom-5 sm:left-5",
          "flex items-center gap-2 overflow-hidden",
          "rounded-full border",
          "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
          "shadow-md transition-all duration-200 ease-out",
          "size-9",
          "sm:size-10 sm:hover:w-32 sm:hover:rounded-xl sm:hover:bg-amber-500/20 sm:hover:border-amber-400 sm:hover:-translate-y-0.5 sm:hover:shadow-amber-500/20 sm:hover:shadow-lg",
          "active:scale-95",
        ].join(" ")}
      >
        <Bug className="size-4 shrink-0 mx-auto sm:ml-3" />
        <span className="hidden whitespace-nowrap text-xs font-semibold sm:block sm:opacity-0 sm:-translate-x-1 sm:transition-all sm:duration-150 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 sm:pr-3">
          Report Bug
        </span>
      </button>

      {/* Modal */}
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={handleClose} />

          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-lg rounded-2xl border border-border bg-card shadow-xl overflow-y-auto max-h-[90dvh]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Bug className="size-4 text-amber-500" />
                <h2 className="text-sm font-semibold">Report a Bug</h2>
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
                <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-2xl">
                  🐛
                </div>
                <div>
                  <p className="font-semibold">Bug reported!</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Thanks — this will be reviewed and fixed soon.
                  </p>
                </div>
                {submitted.githubIssueUrl && (
                  <a
                    href={submitted.githubIssueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="size-3" />
                    View GitHub Issue
                  </a>
                )}
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
                    placeholder="Brief summary of the issue"
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
                                  disabled={appendedIdx === i}
                                  onClick={() => {
                                    appendToField(prompt.targetField as keyof FormValues, prompt.text);
                                    setAppendedIdx(i);
                                    setTimeout(() => setAppendedIdx(null), 1500);
                                  }}
                                  className="rounded-md bg-violet-100 dark:bg-violet-900/40 px-2 py-1 text-[10px] font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors disabled:opacity-60"
                                >
                                  {appendedIdx === i ? "✓ Added" : "Append"}
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

                {/* Page */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Page / Area <span className="text-muted-foreground">(optional)</span></label>
                  <input
                    {...register("page")}
                    placeholder="/training/session-id"
                    className={inputClass}
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Category <span className="text-muted-foreground">(optional)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setValue("category", selectedCategory === value ? undefined : value)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          selectedCategory === value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Severity */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Severity <span className="text-muted-foreground">(optional)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {SEVERITIES.map(({ value, label, active, inactive }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setValue("severity", selectedSeverity === value ? undefined : value)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          selectedSeverity === value ? active : inactive
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Description <span className="text-muted-foreground">(optional)</span></label>
                  <textarea
                    {...register("description")}
                    placeholder="What went wrong? What did you expect to happen?"
                    className={textareaClass}
                  />
                </div>

                {/* Expected behavior */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Expected Behavior <span className="text-muted-foreground">(optional)</span></label>
                  <textarea
                    {...register("expectedBehavior")}
                    placeholder="What did you expect to happen?"
                    className={textareaClass}
                  />
                </div>

                {/* Actual behavior */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Actual Behavior <span className="text-muted-foreground">(optional)</span></label>
                  <textarea
                    {...register("actualBehavior")}
                    placeholder="What actually happened instead?"
                    className={textareaClass}
                  />
                </div>

                {/* Steps */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Steps to Reproduce <span className="text-muted-foreground">(optional)</span></label>
                  <textarea
                    {...register("steps")}
                    placeholder="1. Go to...&#10;2. Tap...&#10;3. See error"
                    className={textareaClass}
                  />
                </div>

                {/* Frequency */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">How often does this happen? <span className="text-muted-foreground">(optional)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {FREQUENCIES.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setValue("frequency", selectedFrequency === value ? undefined : value)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          selectedFrequency === value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Impact */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Who is affected? <span className="text-muted-foreground">(optional)</span></label>
                  <input
                    {...register("impact")}
                    placeholder="e.g. All users on mobile, only me, admin users…"
                    className={inputClass}
                  />
                </div>

                {/* Workaround */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Workaround <span className="text-muted-foreground">(optional)</span></label>
                  <textarea
                    {...register("workaround")}
                    placeholder="Is there a way to work around this issue?"
                    className={textareaClass}
                  />
                </div>

                {/* Screenshots */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">
                    Screenshots <span className="text-muted-foreground">(optional, max 3)</span>
                  </label>
                  {screenshotUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {screenshotUrls.map((url, i) => (
                        <div key={url} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Screenshot ${i + 1}`} className="size-16 rounded-lg border border-border object-cover" />
                          <button
                            type="button"
                            onClick={() => setScreenshotUrls((prev) => prev.filter((_, j) => j !== i))}
                            className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                          >
                            <X className="size-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {screenshotUrls.length < 3 && (
                    <label className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-ring hover:text-foreground ${isUploading ? "opacity-60 pointer-events-none" : ""}`}>
                      {isUploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
                      {isUploading ? "Uploading…" : "Add screenshot"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []).slice(0, 3 - screenshotUrls.length);
                          if (files.length) startUpload(files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Related Reports */}
                {openBugs.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRelated((v) => !v)}
                      className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Link2 className="size-3.5" />
                      Link to related reports{relatedBugIds.length > 0 ? ` (${relatedBugIds.length})` : " (optional)"}
                    </button>
                    {showRelated && (
                      <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-muted/30 divide-y divide-border">
                        {openBugs.map((bug) => (
                          <label key={bug.id} className="flex cursor-pointer items-start gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors">
                            <input
                              type="checkbox"
                              checked={relatedBugIds.includes(bug.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRelatedBugIds((prev) => [...prev, bug.id]);
                                } else {
                                  setRelatedBugIds((prev) => prev.filter((id) => id !== bug.id));
                                }
                              }}
                              className="mt-0.5 shrink-0 accent-primary"
                            />
                            <span className="text-xs leading-snug">{bug.title}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Device Info */}
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium">Device:</span> {getDeviceInfo()}
                </div>

                <div className="mt-1 flex items-center gap-3">
                  {isDraftSaved && (
                    <span className="text-xs text-muted-foreground animate-in fade-in">Draft saved</span>
                  )}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="h-10 flex-1 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    {isPending ? "Submitting…" : "Submit Bug Report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </>
  );
}
