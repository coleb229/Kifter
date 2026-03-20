"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getBugReportsCollection } from "@/lib/db";
import type { ActionResult, BugCategory, BugFrequency, BugReport, BugSeverity, BugStatus, ImplementationNote } from "@/types";
import { ObjectId } from "mongodb";

interface SubmitBugReportInput {
  title: string;
  category?: BugCategory;
  severity?: BugSeverity;
  page?: string;
  description?: string;
  steps?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  frequency?: BugFrequency;
  impact?: string;
  workaround?: string;
  deviceInfo: string;
  screenshotUrls?: string[];
  relatedBugIds?: string[];
}

export async function submitBugReport(
  data: SubmitBugReportInput
): Promise<ActionResult<{ id: string; githubIssueUrl?: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getBugReportsCollection();
  const now = new Date();

  const result = await col.insertOne({
    _id: new ObjectId(),
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    title: data.title,
    category: data.category || undefined,
    severity: data.severity || undefined,
    status: "open" as BugStatus,
    page: data.page || undefined,
    description: data.description || undefined,
    steps: data.steps || undefined,
    expectedBehavior: data.expectedBehavior || undefined,
    actualBehavior: data.actualBehavior || undefined,
    frequency: data.frequency || undefined,
    impact: data.impact || undefined,
    workaround: data.workaround || undefined,
    deviceInfo: data.deviceInfo,
    screenshotUrls: data.screenshotUrls?.length ? data.screenshotUrls : undefined,
    relatedBugIds: data.relatedBugIds?.length ? data.relatedBugIds : undefined,
    createdAt: now,
  });

  const id = result.insertedId.toString();
  let githubIssueUrl: string | undefined;

  // Optionally create a GitHub issue if token is available
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    try {
      const categoryLabels: Record<BugCategory, string> = {
        ui: "UI/UX",
        feature: "Feature Broken",
        data: "Data Issue",
        performance: "Performance",
        other: "Other",
      };
      const severityLabels: Record<BugSeverity, string> = {
        low: "Low",
        medium: "Medium",
        high: "High",
        critical: "Critical",
      };
      const frequencyLabels = { always: "Always", sometimes: "Sometimes", rarely: "Rarely" };

      const body = [
        "## Bug Report",
        "",
        data.category ? `**Category:** ${categoryLabels[data.category]}` : null,
        data.severity ? `**Severity:** ${severityLabels[data.severity]}` : null,
        data.page ? `**Page:** ${data.page}` : null,
        data.frequency ? `**Frequency:** ${frequencyLabels[data.frequency]}` : null,
        data.impact ? `**Impact:** ${data.impact}` : null,
        `**Submitted:** ${now.toISOString().replace("T", " ").slice(0, 16)} by ${session.user.email ?? session.user.id}`,
        "",
        data.description ? "### Description" : null,
        data.description || null,
        "",
        data.expectedBehavior ? "### Expected Behavior" : null,
        data.expectedBehavior || null,
        data.expectedBehavior ? "" : null,
        data.actualBehavior ? "### Actual Behavior" : null,
        data.actualBehavior || null,
        data.actualBehavior ? "" : null,
        "### Steps to Reproduce",
        data.steps || "Not provided",
        "",
        data.workaround ? "### Workaround" : null,
        data.workaround || null,
        data.workaround ? "" : null,
        "### Device Info",
        data.deviceInfo,
        "",
        `---`,
        `*Kifted bug report ID: ${id}*`,
      ].filter((line) => line !== null).join("\n");

      const ghRes = await fetch("https://api.github.com/repos/coleb229/Kifter/issues", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `[Bug] ${data.title}`,
          body,
          labels: ["bug"],
        }),
      });

      if (ghRes.ok) {
        const ghData = await ghRes.json();
        githubIssueUrl = ghData.html_url as string;
        const issueNumber = ghData.number as number;
        // Update doc with GitHub issue info
        await col.updateOne(
          { _id: result.insertedId },
          { $set: { githubIssueUrl, githubIssueNumber: issueNumber } }
        );
      }
    } catch {
      // GitHub issue creation is best-effort — don't fail the whole submission
    }
  }

  revalidatePath("/admin");
  return { success: true, data: { id, githubIssueUrl } };
}

export async function getBugReports(): Promise<ActionResult<BugReport[]>> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { success: false, error: "Unauthorized" };

  const col = await getBugReportsCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();

  return {
    success: true,
    data: docs.map((d) => ({
      id: d._id.toString(),
      userId: d.userId,
      userEmail: d.userEmail,
      title: d.title,
      category: d.category,
      severity: d.severity,
      status: d.status,
      page: d.page,
      description: d.description,
      steps: d.steps,
      expectedBehavior: d.expectedBehavior,
      actualBehavior: d.actualBehavior,
      frequency: d.frequency,
      impact: d.impact,
      workaround: d.workaround,
      deviceInfo: d.deviceInfo,
      githubIssueUrl: d.githubIssueUrl,
      githubIssueNumber: d.githubIssueNumber,
      screenshotUrls: d.screenshotUrls,
      relatedBugIds: d.relatedBugIds,
      createdAt: d.createdAt.toISOString(),
      implementationNotes: (d.implementationNotes ?? []).map((n) => ({
        timestamp: n.timestamp.toISOString(),
        outcome: n.outcome,
        summary: n.summary,
        details: n.details,
        filesChanged: n.filesChanged,
        commandSource: n.commandSource,
      })),
    })),
  };
}

export async function deleteBugReport(id: string): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { success: false, error: "Unauthorized" };

  const col = await getBugReportsCollection();
  await col.deleteOne({ _id: new ObjectId(id) });

  return { success: true, data: undefined };
}

export async function updateBugReportStatus(
  id: string,
  status: BugStatus
): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { success: false, error: "Unauthorized" };

  const col = await getBugReportsCollection();
  await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status,
        ...(status === "resolved" ? { resolvedAt: new Date() } : {}),
      },
    }
  );

  return { success: true, data: undefined };
}

interface UpdateBugReportPatch {
  title?: string;
  description?: string;
  steps?: string;
  screenshotUrls?: string[];
  severity?: BugSeverity;
}

export async function updateBugReport(
  id: string,
  patch: UpdateBugReportPatch
): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { success: false, error: "Unauthorized" };

  const col = await getBugReportsCollection();
  await col.updateOne({ _id: new ObjectId(id) }, { $set: patch });

  return { success: true, data: undefined };
}

export async function addBugReportImplementationNote(
  id: string,
  note: Omit<ImplementationNote, "timestamp">
): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { success: false, error: "Unauthorized" };

  const col = await getBugReportsCollection();
  await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $push: {
        implementationNotes: {
          timestamp: new Date(),
          outcome: note.outcome,
          summary: note.summary,
          details: note.details,
          filesChanged: note.filesChanged,
          commandSource: note.commandSource,
        },
      },
    }
  );

  return { success: true, data: undefined };
}

export async function getOpenBugReportsForLinking(): Promise<ActionResult<{ id: string; title: string }[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getBugReportsCollection();
  const docs = await col
    .find({ status: "open" }, { projection: { _id: 1, title: 1 } })
    .sort({ createdAt: -1 })
    .toArray();

  return {
    success: true,
    data: docs.map((d) => ({ id: d._id.toString(), title: d.title })),
  };
}
