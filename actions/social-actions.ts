"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import {
  getPostLikesCollection,
  getPostCommentsCollection,
  getUsersCollection,
} from "@/lib/db";
import type { ActionResult, PostComment } from "@/types";

export async function toggleLike(
  postId: string
): Promise<ActionResult<{ liked: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const col = await getPostLikesCollection();
    const existing = await col.findOne({ postId, userId: session.user.id });
    if (existing) {
      await col.deleteOne({ _id: existing._id });
      return { success: true, data: { liked: false } };
    } else {
      await col.insertOne({
        _id: new ObjectId(),
        postId,
        userId: session.user.id,
        createdAt: new Date(),
      });
      return { success: true, data: { liked: true } };
    }
  } catch {
    return { success: false, error: "Failed to toggle like" };
  }
}

export async function addComment(
  postId: string,
  content: string
): Promise<ActionResult<PostComment>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const trimmed = content.trim().slice(0, 300);
  if (!trimmed) return { success: false, error: "Comment cannot be empty" };

  try {
    const usersCol = await getUsersCollection();
    const user = await usersCol.findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { name: 1, displayName: 1, image: 1, profileImage: 1 } }
    );

    const authorName = user?.displayName ?? user?.name ?? "Unknown";
    const authorImage = user?.profileImage ?? user?.image ?? undefined;

    const col = await getPostCommentsCollection();
    const doc = {
      _id: new ObjectId(),
      postId,
      userId: session.user.id,
      authorName,
      authorImage,
      content: trimmed,
      createdAt: new Date(),
    };
    await col.insertOne(doc);

    return {
      success: true,
      data: {
        id: doc._id.toHexString(),
        postId,
        userId: session.user.id,
        authorName,
        authorImage,
        content: trimmed,
        createdAt: doc.createdAt.toISOString(),
      },
    };
  } catch {
    return { success: false, error: "Failed to add comment" };
  }
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const col = await getPostCommentsCollection();
    const comment = await col.findOne({ _id: new ObjectId(commentId) });
    if (!comment) return { success: false, error: "Comment not found" };

    const isOwner = comment.userId === session.user.id;
    const isAdmin = session.user.role === "admin";
    if (!isOwner && !isAdmin) return { success: false, error: "Not authorized" };

    await col.deleteOne({ _id: new ObjectId(commentId) });
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete comment" };
  }
}

export async function getComments(
  postId: string
): Promise<ActionResult<PostComment[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const col = await getPostCommentsCollection();
    const docs = await col
      .find({ postId })
      .sort({ createdAt: 1 })
      .toArray();

    return {
      success: true,
      data: docs.map((d) => ({
        id: d._id.toHexString(),
        postId: d.postId,
        userId: d.userId,
        authorName: d.authorName,
        authorImage: d.authorImage,
        content: d.content,
        createdAt: d.createdAt.toISOString(),
      })),
    };
  } catch {
    return { success: false, error: "Failed to fetch comments" };
  }
}
