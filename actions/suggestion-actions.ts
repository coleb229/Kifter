"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getUserSuggestionsCollection } from "@/lib/db";
import type { ActionResult, UserSuggestion, UserSuggestionDoc, SuggestionStatus, ImplementationNote } from "@/types";
import { ObjectId } from "mongodb";

interface SubmitSuggestionInput {
  title: string;
  description: string;
  imageUrls?: string[];
}

export async function submitSuggestion(
  data: SubmitSuggestionInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getUserSuggestionsCollection();

  const result = await col.insertOne({
    _id: new ObjectId(),
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    title: data.title,
    description: data.description,
    status: "new" as SuggestionStatus,
    imageUrls: data.imageUrls?.length ? data.imageUrls : undefined,
    createdAt: new Date(),
  });

  const id = result.insertedId.toString();

  // Optionally add as a draft item to the "User Suggestions" column on the GitHub project board
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    try {
      // First create a draft issue on the project board
      const mutation = `
        mutation {
          addProjectV2DraftIssue(input: {
            projectId: "PVT_kwHOAV__us4BRx8S"
            title: ${JSON.stringify(data.title)}
            body: ${JSON.stringify(`## User Suggestion\n\n${data.description}\n\n---\n*Submitted by ${session.user.email ?? session.user.id}*`)}
          }) {
            projectItem {
              id
            }
          }
        }
      `;
      const ghRes = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: mutation }),
      });

      if (ghRes.ok) {
        const ghData = await ghRes.json() as { data?: { addProjectV2DraftIssue?: { projectItem?: { id: string } } } };
        const itemId = ghData.data?.addProjectV2DraftIssue?.projectItem?.id;
        if (itemId) {
          // Move to "User Suggestions" status column
          const statusMutation = `
            mutation {
              updateProjectV2ItemFieldValue(input: {
                projectId: "PVT_kwHOAV__us4BRx8S"
                itemId: "${itemId}"
                fieldId: "PVTSSF_lAHOAV__us4BRx8Szg_gd_8"
                value: { singleSelectOptionId: "d38808ce" }
              }) {
                projectV2Item { id }
              }
            }
          `;
          await fetch("https://api.github.com/graphql", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: statusMutation }),
          });
        }
      }
    } catch {
      // Best-effort — don't fail the submission
    }
  }

  revalidatePath("/admin");
  return { success: true, data: { id } };
}

export async function getUserSuggestions(): Promise<ActionResult<UserSuggestion[]>> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { success: false, error: "Unauthorized" };

  const col = await getUserSuggestionsCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();

  return {
    success: true,
    data: docs.map((d: UserSuggestionDoc & { _id: ObjectId }) => ({
      id: d._id.toString(),
      userId: d.userId,
      userEmail: d.userEmail,
      title: d.title,
      description: d.description,
      status: d.status,
      imageUrls: d.imageUrls,
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

export async function deleteUserSuggestion(id: string): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { success: false, error: "Unauthorized" };

  const col = await getUserSuggestionsCollection();
  await col.deleteOne({ _id: new ObjectId(id) });

  return { success: true, data: undefined };
}

export async function updateSuggestionStatus(
  id: string,
  status: SuggestionStatus
): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { success: false, error: "Unauthorized" };

  const col = await getUserSuggestionsCollection();
  await col.updateOne({ _id: new ObjectId(id) }, { $set: { status } });

  return { success: true, data: undefined };
}

export async function addSuggestionImplementationNote(
  id: string,
  note: Omit<ImplementationNote, "timestamp">
): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { success: false, error: "Unauthorized" };

  const col = await getUserSuggestionsCollection();
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

interface UpdateUserSuggestionPatch {
  title?: string;
  description?: string;
  imageUrls?: string[];
}

export async function updateUserSuggestion(
  id: string,
  patch: UpdateUserSuggestionPatch
): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { success: false, error: "Unauthorized" };

  const col = await getUserSuggestionsCollection();
  await col.updateOne({ _id: new ObjectId(id) }, { $set: patch });

  return { success: true, data: undefined };
}
