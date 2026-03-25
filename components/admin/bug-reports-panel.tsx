"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Bug, ChevronDown, ChevronRight, ExternalLink, Trash2, ChevronLeft, Pencil, Check, X, ImagePlus, Loader2 } from "lucide-react";
import { updateBugReportStatus, deleteBugReport, updateBugReport } from "@/actions/bug-report-actions";
import { useUploadThing } from "@/lib/uploadthing-client";
import { ImplementationLog } from "@/components/admin/implementation-log";
import type { BugReport, BugSeverity, BugStatus } from "@/types";

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

const PAGE_SIZE = 10;
const FILTER_OPTIONS: { value: "all" | BugStatus; label: string }[] = [
  { value: "all", label: "All" },
  ...STATUS_OPTIONS,
];

const SEVERITY_OPTIONS: BugSeverity[] = ["low", "medium", "high", "critical"];

function BugReportCard({ report, onDelete }: { report: BugReport; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<BugStatus>(report.status);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [isSaving, startSave] = useTransition();

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(report.title);
  const [editDescription, setEditDescription] = useState(report.description ?? "");
  const [editSteps, setEditSteps] = useState(report.steps ?? "");
  const [editSeverity, setEditSeverity] = useState<BugSeverity>(report.severity ?? "medium");
  const [editScreenshots, setEditScreenshots] = useState<string[]>(report.screenshotUrls ?? []);

  const { startUpload: startScreenshotUpload, isUploading: isUploadingScreenshot } = useUploadThing("bugScreenshot", {
    onClientUploadComplete: (res) => {
      setEditScreenshots((prev) => [...prev, ...res.map((f) => f.url)]);
    },
  });

  // Displayed values (updated optimistically after save)
  const [displayTitle, setDisplayTitle] = useState(report.title);
  const [displayDescription, setDisplayDescription] = useState(report.description ?? "");
  const [displaySteps, setDisplaySteps] = useState(report.steps);
  const [displaySeverity, setDisplaySeverity] = useState<BugSeverity>(report.severity ?? "medium");
  const [displayScreenshots, setDisplayScreenshots] = useState<string[]>(report.screenshotUrls ?? []);

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

  function handleEditSave() {
    startSave(async () => {
      const filteredScreenshots = editScreenshots.filter((u) => u.trim());
      await updateBugReport(report.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        steps: editSteps.trim() || undefined,
        severity: editSeverity,
        screenshotUrls: filteredScreenshots.length ? filteredScreenshots : undefined,
      });
      setDisplayTitle(editTitle.trim());
      setDisplayDescription(editDescription.trim());
      setDisplaySteps(editSteps.trim() || undefined);
      setDisplaySeverity(editSeverity);
      setDisplayScreenshots(filteredScreenshots);
      setEditing(false);
    });
  }

  function handleEditCancel() {
    setEditTitle(displayTitle);
    setEditDescription(displayDescription);
    setEditSteps(displaySteps ?? "");
    setEditSeverity(displaySeverity);
    setEditScreenshots(displayScreenshots);
    setEditing(false);
  }

  const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

  return (
    <div className={`rounded-xl border border-border bg-card transition-opacity ${isPending ? "opacity-60" : ""}`}>
      <button
        type="button"
        onClick={() => !editing && setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="mt-0.5 shrink-0">
          {expanded ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLES[displaySeverity]}`}>
              {displaySeverity}
            </span>
            {report.category && (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {CATEGORY_LABELS[report.category]}
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
              {status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-medium leading-snug">{displayTitle}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {report.page} · {format(new Date(report.createdAt), "MMM d, yyyy 'at' h:mm a")}
            {report.userEmail && ` · ${report.userEmail}`}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Title</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Severity</label>
                <div className="flex flex-wrap gap-1.5">
                  {SEVERITY_OPTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => setEditSeverity(s)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${editSeverity === s ? SEVERITY_STYLES[s] : "border border-border text-muted-foreground hover:bg-muted"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Description</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} className={`${inputClass} resize-y`} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Steps to Reproduce (optional)</label>
                <textarea value={editSteps} onChange={(e) => setEditSteps(e.target.value)} rows={3} className={`${inputClass} resize-y`} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Screenshots</label>
                {editScreenshots.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {editScreenshots.map((url, i) => (
                      <div key={url} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Screenshot ${i + 1}`} className="size-16 rounded-lg border border-border object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditScreenshots((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                        >
                          <X className="size-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {editScreenshots.length < 3 && (
                  <label className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-ring hover:text-foreground ${isUploadingScreenshot ? "pointer-events-none opacity-60" : ""}`}>
                    {isUploadingScreenshot ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
                    {isUploadingScreenshot ? "Uploading…" : "Add screenshot"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []).slice(0, 3 - editScreenshots.length);
                        if (files.length) startScreenshotUpload(files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleEditSave} disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">
                  <Check className="size-3" /> {isSaving ? "Saving…" : "Save"}
                </button>
                <button type="button" onClick={handleEditCancel} disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                  <X className="size-3" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">{displayDescription}</p>
              </div>

              {displaySteps && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Steps to Reproduce</p>
                  <p className="text-sm whitespace-pre-wrap">{displaySteps}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Device</p>
                <p className="text-sm text-muted-foreground">{report.deviceInfo}</p>
              </div>

              {report.relatedBugIds && report.relatedBugIds.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Related Reports</p>
                  <div className="flex flex-wrap gap-1.5">
                    {report.relatedBugIds.map((id) => (
                      <span key={id} className="rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                        #{id.slice(-6)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {displayScreenshots.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Screenshots</p>
                  <div className="flex flex-wrap gap-2">
                    {displayScreenshots.map((url, i) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Screenshot ${i + 1}`} className="h-24 rounded-lg border border-border object-cover hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
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
              {!editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  title="Edit report"
                  className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Pencil className="size-3" />
                  Edit
                </button>
              )}
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

          <ImplementationLog notes={report.implementationNotes ?? []} />
        </div>
      )}
    </div>
  );
}

export function BugReportsPanel({ initialReports }: BugReportsPanelProps) {
  const [reports, setReports] = useState(initialReports);
  const [filter, setFilter] = useState<"all" | BugStatus>("open");
  const [page, setPage] = useState(1);

  const openCount = reports.filter((r) => r.status !== "resolved").length;

  function handleDelete(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleFilterChange(value: "all" | BugStatus) {
    setFilter(value);
    setPage(1);
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

      {/* Filter pills */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleFilterChange(value)}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
              filter === value
                ? value === "all"
                  ? "border-transparent bg-foreground text-background"
                  : STATUS_STYLES[value as BugStatus] + " border-transparent"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          No bug reports match this filter.
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((report) => (
              <BugReportCard key={report.id} report={report} onDelete={handleDelete} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 transition-colors hover:bg-muted disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" /> Prev
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 transition-colors hover:bg-muted disabled:opacity-40"
              >
                Next <ChevronRight className="size-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
