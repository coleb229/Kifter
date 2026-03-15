"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@base-ui/react/avatar";
import {
  Trash2,
  Dumbbell,
  MessageCircle,
  UserX,
  Heart,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { deletePost } from "@/actions/post-actions";
import { blockUser } from "@/actions/block-actions";
import { toggleLike, addComment, deleteComment, getComments } from "@/actions/social-actions";
import type { Post, PostComment, UserRole } from "@/types";

interface Props {
  post: Post;
  currentUserId: string;
  currentUserRole: UserRole;
  index?: number;
}

const roleBadge: Record<UserRole, { label: string; className: string }> = {
  admin: {
    label: "Admin",
    className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  },
  member: {
    label: "Member",
    className: "bg-muted text-muted-foreground",
  },
  restricted: {
    label: "Restricted",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  },
};

const typeChip: Record<Post["type"], { label: string; className: string; icon: React.ElementType }> = {
  progress: {
    label: "Progress Update",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    icon: Dumbbell,
  },
  general: {
    label: "General",
    className: "bg-muted text-muted-foreground",
    icon: MessageCircle,
  },
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function PostCard({ post, currentUserId, currentUserRole, index }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [blockConfirming, setBlockConfirming] = useState(false);

  // Like state (optimistic)
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isLiking, startLikeTransition] = useTransition();

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [commentText, setCommentText] = useState("");
  const [isLoadingComments, startLoadComments] = useTransition();
  const [isSubmittingComment, startSubmitComment] = useTransition();

  const canDelete = post.userId === currentUserId || currentUserRole === "admin";
  const canBlock = post.userId !== currentUserId && currentUserRole !== "admin";
  const badge = roleBadge[post.authorRole];
  const chip = typeChip[post.type];
  const ChipIcon = chip.icon;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirming) { setConfirming(true); return; }
    startTransition(async () => {
      await deletePost(post.id);
      router.refresh();
    });
  }

  function handleLike() {
    // Optimistic update
    setIsLiked((prev) => !prev);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    startLikeTransition(async () => {
      const result = await toggleLike(post.id);
      if (!result.success) {
        // Revert on failure
        setIsLiked((prev) => !prev);
        setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
      }
    });
  }

  function handleToggleComments() {
    if (!showComments && comments === null) {
      startLoadComments(async () => {
        const result = await getComments(post.id);
        if (result.success) setComments(result.data);
      });
    }
    setShowComments((prev) => !prev);
  }

  function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    startSubmitComment(async () => {
      const result = await addComment(post.id, text);
      if (result.success) {
        setComments((prev) => [...(prev ?? []), result.data]);
        setCommentCount((prev) => prev + 1);
        setCommentText("");
      }
    });
  }

  function handleDeleteComment(commentId: string) {
    startTransition(async () => {
      const result = await deleteComment(commentId);
      if (result.success) {
        setComments((prev) => (prev ?? []).filter((c) => c.id !== commentId));
        setCommentCount((prev) => prev - 1);
      }
    });
  }

  return (
    <div
      className="rounded-xl border border-border bg-card animate-fade-up"
      style={index !== undefined ? { animationDelay: `${index * 60}ms` } : undefined}
    >
      {/* Main card content */}
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Avatar.Root className="mt-0.5 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
              <Avatar.Image src={post.authorImage} alt={post.authorName} className="size-full object-cover" />
              <Avatar.Fallback className="text-xs font-semibold text-muted-foreground">
                {getInitials(post.authorName)}
              </Avatar.Fallback>
            </Avatar.Root>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-sm font-semibold">{post.authorName}</p>
                {post.authorRole !== "member" && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>

          {/* Type chip */}
          <span className={`hidden shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium sm:flex ${chip.className}`}>
            <ChipIcon className="size-3" />
            {chip.label}
          </span>
        </div>

        {/* Content */}
        <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {/* Footer: likes, comments, actions */}
        <div className="mt-4 flex items-center justify-between gap-2">
          {/* Like + comment buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                isLiked
                  ? "text-rose-500"
                  : "text-muted-foreground hover:text-rose-500"
              }`}
            >
              <Heart className={`size-4 ${isLiked ? "fill-current" : ""}`} />
              <span>{likeCount}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleComments}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <MessageSquare className="size-4" />
              <span>{commentCount}</span>
            </button>
          </div>

          {/* Block / Delete */}
          <div className="flex items-center gap-2">
            {canBlock && (
              blockConfirming ? (
                <>
                  <span className="text-xs text-muted-foreground">Block user?</span>
                  <button
                    type="button"
                    onClick={() => startTransition(async () => { await blockUser(post.userId); router.refresh(); })}
                    disabled={isPending}
                    className="text-xs font-medium text-destructive transition-colors hover:underline"
                  >
                    {isPending ? "Blocking…" : "Yes"}
                  </button>
                  <button type="button" onClick={() => setBlockConfirming(false)} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setBlockConfirming(true)}
                  aria-label="Block user"
                  className="rounded p-1 text-muted-foreground transition-all hover:text-destructive"
                >
                  <UserX className="size-3.5" />
                </button>
              )
            )}

            {canDelete && !blockConfirming && (
              confirming ? (
                <>
                  <span className="text-xs text-muted-foreground">Delete?</span>
                  <button type="button" onClick={handleDelete} disabled={isPending} className="text-xs font-medium text-destructive transition-colors hover:underline">
                    {isPending ? "Deleting…" : "Yes"}
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setConfirming(false); }} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                    Cancel
                  </button>
                </>
              ) : (
                <button type="button" onClick={handleDelete} aria-label="Delete post" className="rounded p-1 text-muted-foreground transition-all hover:text-destructive">
                  <Trash2 className="size-3.5" />
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-border px-5 py-4 flex flex-col gap-3">
          {isLoadingComments && (
            <div className="flex justify-center py-2">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoadingComments && comments && comments.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-1">No comments yet.</p>
          )}

          {!isLoadingComments && comments && comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5 group/comment">
              <Avatar.Root className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                <Avatar.Image src={c.authorImage} alt={c.authorName} className="size-full object-cover" />
                <Avatar.Fallback className="text-[10px] font-semibold text-muted-foreground">
                  {getInitials(c.authorName)}
                </Avatar.Fallback>
              </Avatar.Root>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold">{c.authorName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {(c.userId === currentUserId || currentUserRole === "admin") && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(c.id)}
                      disabled={isPending}
                      className="opacity-0 group-hover/comment:opacity-100 rounded p-0.5 text-muted-foreground transition-all hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          ))}

          {/* New comment form */}
          <form onSubmit={handleSubmitComment} className="flex items-end gap-2 pt-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value.slice(0, 300))}
              placeholder="Write a comment…"
              rows={1}
              className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitComment(e as unknown as React.FormEvent); }
              }}
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !commentText.trim()}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:brightness-110 disabled:opacity-50"
            >
              {isSubmittingComment ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
