"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getPostsCollection, getUsersCollection, getUserBlocksCollection } from "@/lib/db";
import type { ActionResult, Post, PostDoc } from "@/types";

// ── Create post ───────────────────────────────────────────────────────────────

export async function createPost(data: {
  content: string;
  type: "progress" | "general";
}): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role === "restricted") {
    return { success: false, error: "Your access is restricted" };
  }

  const content = data.content.trim().slice(0, 500);
  if (!content) return { success: false, error: "Post cannot be empty" };

  try {
    const col = await getPostsCollection();
    const doc: Omit<PostDoc, "_id"> = {
      userId: session.user.id,
      content,
      type: data.type,
      createdAt: new Date(),
    };
    const result = await col.insertOne(doc as PostDoc);
    return { success: true, data: { id: result.insertedId.toHexString() } };
  } catch {
    return { success: false, error: "Failed to create post" };
  }
}

// ── Get posts (feed) ──────────────────────────────────────────────────────────

export async function getPosts(): Promise<ActionResult<Post[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const postsCol = await getPostsCollection();
    const usersCol = await getUsersCollection();
    const blocksCol = await getUserBlocksCollection();

    const blockedIds = await blocksCol
      .find({ blockerId: session.user.id }, { projection: { blockedId: 1 } })
      .toArray()
      .then((docs) => docs.map((d) => d.blockedId));

    const query = blockedIds.length > 0 ? { userId: { $nin: blockedIds } } : {};

    const docs = await postsCol
      .find(query)
      .sort({ createdAt: 1 })
      .limit(100)
      .toArray();

    if (docs.length === 0) return { success: true, data: [] };

    // Batch-fetch all authors
    const authorIds = [...new Set(docs.map((d) => d.userId))];
    const authors = await usersCol
      .find({ _id: { $in: authorIds.map((id) => new ObjectId(id)) } })
      .project({ _id: 1, name: 1, image: 1, displayName: 1, profileImage: 1, role: 1 })
      .toArray();

    const authorMap = new Map(authors.map((a) => [a._id.toHexString(), a]));

    const posts: Post[] = docs.map((doc) => {
      const author = authorMap.get(doc.userId);
      return {
        id: doc._id.toHexString(),
        userId: doc.userId,
        authorName: author?.displayName ?? author?.name ?? "Unknown",
        authorImage: author?.profileImage ?? author?.image ?? undefined,
        authorRole: author?.role ?? "member",
        content: doc.content,
        type: doc.type,
        createdAt: doc.createdAt.toISOString(),
      };
    });

    return { success: true, data: posts };
  } catch {
    return { success: false, error: "Failed to fetch posts" };
  }
}

// ── Delete post ───────────────────────────────────────────────────────────────

export async function deletePost(postId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const col = await getPostsCollection();
    const post = await col.findOne({ _id: new ObjectId(postId) });
    if (!post) return { success: false, error: "Post not found" };

    const isOwner = post.userId === session.user.id;
    const isAdmin = session.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return { success: false, error: "Not authorized to delete this post" };
    }

    await col.deleteOne({ _id: new ObjectId(postId) });
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete post" };
  }
}
