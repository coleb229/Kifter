"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Bug, ChevronDown, ChevronRight, ExternalLink, Trash2 } from "lucide-react";
import { updateBugReportStatus, deleteBugReport } from "@/actions/bug-report-actions";
import type { BugReport, BugStatus } from "@/types";

interface BugReportsPanelProps {
  initialReports: BugReport[];
}


const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
  medium: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300",
  high: "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300",
  critical: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300",
};

const CATEGORY_LABELS: Record<string, string> = {
  ui: "UI/UX",
  feature: "Feature Broken",
  data: "Data Issue",
  performance: "Performance",
  other: "Other",
};

const STATUS_OPTIONS: { value: BugStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "testing", label: "Testing" },
  { value: "resolved", label: "Resolved" },
];

const STATUS_STYLES: Record<BugStatus, string> = {
  open: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
  in_progress: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
  testing: "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300",
  resolved: "bg-muted text-muted-foreground",
};

function BugReportCard({ report, onDelete }: { report: BugReport; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<BugStatus>(report.status);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function handleStatusChange(newStatus: BugStatus) {
    setStatus(newStatus);
    startTransition(async () => {
      await updateBugReportStatus(report.id, newStatus);
    });
  }

  function handleDelete() {
    if (!confirm("Delete this bug report? This cannot be undone.")) return;
    startDelete(async () => {
      await deleteBugReport(report.id);
      onDelete(report.id);
    });
  }

  return (
    <div className={`rounded-xl border border-border bg-card transition-opacity ${isPending ? "opacity-60" : ""}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="mt-0.5 shrink-0">
          {expanded ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLES[report.severity]}`}>
              {report.severity}
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {CATEGORY_LABELS[report.category]}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
              {status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-medium leading-snug">{report.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {report.page} · {format(new Date(report.createdAt), "MMM d, yyyy 'at' h:mm a")}
            {report.userEmail && ` · ${report.userEmail}`}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm whitespace-pre-wrap">{report.description}</p>
          </div>

          {report.steps && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Steps to Reproduce</p>
              <p className="text-sm whitespace-pre-wrap">{report.steps}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Device</p>
            <p className="text-sm text-muted-foreground">{report.deviceInfo}</p>
          </div>

          {report.screenshotUrls && report.screenshotUrls.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Screenshots</p>
              <div className="flex flex-wrap gap-2">
                {report.screenshotUrls.map((url, i) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Screenshot ${i + 1}`} className="h-24 rounded-lg border border-border object-cover hover:opacity-80 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Status:</span>
            {STATUS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleStatusChange(value)}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  status === value
                    ? STATUS_STYLES[value] + " border-transparent"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              {report.githubIssueUrl && (
                <a
                  href={report.githubIssueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <ExternalLink className="size-3" />
                  GitHub #{report.githubIssueNumber}
                </a>
              )}
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                title="Delete report"
                className="flex items-center gap-1 rounded-full border border-destructive/30 px-2.5 py-0.5 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                <Trash2 className="size-3" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function BugReportsPanel({ initialReports }: BugReportsPanelProps) {
  const [reports, setReports] = useState(initialReports);
  const openCount = reports.filter((r) => r.status !== "resolved").length;

  function handleDelete(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
          <Bug className="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Bug Reports</h2>
          <p className="text-sm text-muted-foreground">
            {openCount} open · {reports.length} total
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          No bug reports yet.
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <BugReportCard key={report.id} report={report} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
