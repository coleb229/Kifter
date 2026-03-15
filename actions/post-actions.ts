"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getPostsCollection, getUsersCollection, getUserBlocksCollection, getPostLikesCollection, getPostCommentsCollection } from "@/lib/db";
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
    const [postsCol, usersCol, blocksCol, likesCol, commentsCol] = await Promise.all([
      getPostsCollection(),
      getUsersCollection(),
      getUserBlocksCollection(),
      getPostLikesCollection(),
      getPostCommentsCollection(),
    ]);

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

    const postIds = docs.map((d) => d._id.toHexString());

    // Batch-fetch authors, like counts, comment counts, and current user likes in parallel
    const authorIds = [...new Set(docs.map((d) => d.userId))];
    const [authors, allLikes, commentCounts, userLikes] = await Promise.all([
      usersCol
        .find({ _id: { $in: authorIds.map((id) => new ObjectId(id)) } })
        .project({ _id: 1, name: 1, image: 1, displayName: 1, profileImage: 1, role: 1 })
        .toArray(),
      likesCol.find({ postId: { $in: postIds } }, { projection: { postId: 1 } }).toArray(),
      commentsCol
        .aggregate<{ _id: string; count: number }>([
          { $match: { postId: { $in: postIds } } },
          { $group: { _id: "$postId", count: { $sum: 1 } } },
        ])
        .toArray(),
      likesCol
        .find({ postId: { $in: postIds }, userId: session.user.id }, { projection: { postId: 1 } })
        .toArray(),
    ]);

    const authorMap = new Map(authors.map((a) => [a._id.toHexString(), a]));
    const likeCountMap = new Map<string, number>();
    for (const l of allLikes) likeCountMap.set(l.postId, (likeCountMap.get(l.postId) ?? 0) + 1);
    const commentCountMap = new Map(commentCounts.map((c) => [c._id, c.count]));
    const likedSet = new Set(userLikes.map((l) => l.postId));

    const posts: Post[] = docs.map((doc) => {
      const author = authorMap.get(doc.userId);
      const id = doc._id.toHexString();
      return {
        id,
        userId: doc.userId,
        authorName: author?.displayName ?? author?.name ?? "Unknown",
        authorImage: author?.profileImage ?? author?.image ?? undefined,
        authorRole: author?.role ?? "member",
        content: doc.content,
        type: doc.type,
        likeCount: likeCountMap.get(id) ?? 0,
        commentCount: commentCountMap.get(id) ?? 0,
        isLiked: likedSet.has(id),
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
