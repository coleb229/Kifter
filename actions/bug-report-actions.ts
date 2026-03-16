"use server";

import { auth } from "@/auth";
import { getBugReportsCollection } from "@/lib/db";
import type { ActionResult, BugCategory, BugReport, BugSeverity, BugStatus } from "@/types";
import { ObjectId } from "mongodb";

interface SubmitBugReportInput {
  title: string;
  category: BugCategory;
  severity: BugSeverity;
  page: string;
  description: string;
  steps?: string;
  deviceInfo: string;
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
    category: data.category,
    severity: data.severity,
    status: "open" as BugStatus,
    page: data.page,
    description: data.description,
    steps: data.steps || undefined,
    deviceInfo: data.deviceInfo,
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

      const body = [
        "## Bug Report",
        "",
        `**Category:** ${categoryLabels[data.category]}`,
        `**Severity:** ${severityLabels[data.severity]}`,
        `**Page:** ${data.page}`,
        `**Submitted:** ${now.toISOString().replace("T", " ").slice(0, 16)} by ${session.user.email ?? session.user.id}`,
        "",
        "### Description",
        data.description,
        "",
        "### Steps to Reproduce",
        data.steps || "Not provided",
        "",
        "### Device Info",
        data.deviceInfo,
        "",
        `---`,
        `*Kifted bug report ID: ${id}*`,
      ].join("\n");

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
      deviceInfo: d.deviceInfo,
      githubIssueUrl: d.githubIssueUrl,
      githubIssueNumber: d.githubIssueNumber,
      createdAt: d.createdAt.toISOString(),
    })),
  };
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
