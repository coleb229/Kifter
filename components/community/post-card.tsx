"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@base-ui/react/avatar";
import { Trash2, Dumbbell, MessageCircle, UserX } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { deletePost } from "@/actions/post-actions";
import { blockUser } from "@/actions/block-actions";
import type { Post, UserRole } from "@/types";

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

  const canDelete = post.userId === currentUserId || currentUserRole === "admin";
  const canBlock = post.userId !== currentUserId && currentUserRole !== "admin";
  const badge = roleBadge[post.authorRole];
  const chip = typeChip[post.type];
  const ChipIcon = chip.icon;

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
  });

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      await deletePost(post.id);
      router.refresh();
    });
  }

  return (
    <div
      className="group relative rounded-xl border border-border bg-card p-5 animate-fade-up"
      style={index !== undefined ? { animationDelay: `${index * 60}ms` } : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar.Root className="mt-0.5 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
            <Avatar.Image
              src={post.authorImage}
              alt={post.authorName}
              className="size-full object-cover"
            />
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

      {/* Actions */}
      <div className="absolute right-3 bottom-3 flex items-center gap-2">
        {/* Block user */}
        {canBlock && (
          blockConfirming ? (
            <>
              <span className="text-xs text-muted-foreground">Block user?</span>
              <button
                type="button"
                onClick={() => {
                  startTransition(async () => {
                    await blockUser(post.userId);
                    router.refresh();
                  });
                }}
                disabled={isPending}
                className="text-xs font-medium text-destructive transition-colors hover:underline"
              >
                {isPending ? "Blocking…" : "Yes"}
              </button>
              <button
                type="button"
                onClick={() => setBlockConfirming(false)}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setBlockConfirming(true)}
              aria-label="Block user"
              className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
            >
              <UserX className="size-3.5" />
            </button>
          )
        )}

        {/* Delete post */}
        {canDelete && !blockConfirming && (
          confirming ? (
            <>
              <span className="text-xs text-muted-foreground">Delete?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="text-xs font-medium text-destructive transition-colors hover:underline"
              >
                {isPending ? "Deleting…" : "Yes"}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              aria-label="Delete post"
              className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
            >
              <Trash2 className="size-3.5" />
            </button>
          )
        )}
      </div>
    </div>
  );
}
