"use client";

import { useState, useTransition, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bug, X, ExternalLink } from "lucide-react";
import { submitBugReport } from "@/actions/bug-report-actions";
import type { BugCategory, BugSeverity } from "@/types";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  page: z.string().min(1, "Page is required"),
  category: z.enum(["ui", "feature", "data", "performance", "other"] as const),
  severity: z.enum(["low", "medium", "high", "critical"] as const),
  description: z.string().min(10, "Description must be at least 10 characters"),
  steps: z.string().optional(),
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

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      page: pathname,
      category: "ui",
      severity: "medium",
      description: "",
      steps: "",
    },
  });

  const selectedCategory = watch("category");
  const selectedSeverity = watch("severity");

  // Update page field when modal opens
  useEffect(() => {
    if (open) {
      setValue("page", pathname);
    }
  }, [open, pathname, setValue]);

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
    setSubmitted(null);
    reset();
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await submitBugReport({
        title: values.title,
        category: values.category,
        severity: values.severity,
        page: values.page,
        description: values.description,
        steps: values.steps || undefined,
        deviceInfo: getDeviceInfo(),
      });
      if (result.success) {
        setSubmitted({ githubIssueUrl: result.data.githubIssueUrl });
        reset();
      }
    });
  }

  return (
    <>
      {/* Floating button — bottom-left, above mobile nav */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Report a bug"
        className={[
          "group",
          "fixed bottom-20 left-4 z-40",
          "sm:bottom-5 sm:left-5",
          "flex items-center gap-2 overflow-hidden",
          "h-10 rounded-full border",
          "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
          "shadow-md transition-all duration-200 ease-out",
          // Mobile: always show full pill
          "w-auto px-3",
          // Desktop: icon-only, expands on hover
          "sm:w-10 sm:px-0 sm:hover:w-32 sm:hover:rounded-xl sm:hover:bg-amber-500/20 sm:hover:border-amber-400 sm:hover:-translate-y-0.5 sm:hover:shadow-amber-500/20 sm:hover:shadow-lg",
          "active:scale-95",
        ].join(" ")}
      >
        <Bug className="size-4 shrink-0 sm:ml-3" />
        {/* Always visible on mobile, hidden until hover on desktop */}
        <span className="whitespace-nowrap text-xs font-semibold sm:opacity-0 sm:-translate-x-1 sm:transition-all sm:duration-150 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 sm:pr-3">
          Report Bug
        </span>
      </button>

      {/* Modal */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
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
                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Title</label>
                  <input
                    {...register("title")}
                    placeholder="Brief summary of the issue"
                    className={inputClass}
                  />
                  {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                </div>

                {/* Page */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Page / Area</label>
                  <input
                    {...register("page")}
                    placeholder="/training/session-id"
                    className={inputClass}
                  />
                  {errors.page && <p className="text-xs text-destructive">{errors.page.message}</p>}
                </div>

                {/* Category */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setValue("category", value)}
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
                  <label className="text-sm font-medium">Severity</label>
                  <div className="flex flex-wrap gap-2">
                    {SEVERITIES.map(({ value, label, active, inactive }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setValue("severity", value)}
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
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    {...register("description")}
                    placeholder="What went wrong? What did you expect to happen?"
                    className={textareaClass}
                  />
                  {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                </div>

                {/* Steps */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">
                    Steps to Reproduce <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <textarea
                    {...register("steps")}
                    placeholder="1. Go to...&#10;2. Tap...&#10;3. See error"
                    className={textareaClass}
                  />
                </div>

                {/* Device Info — read-only */}
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium">Device:</span> {getDeviceInfo()}
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="mt-1 h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {isPending ? "Submitting…" : "Submit Bug Report"}
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </>
  );
}
