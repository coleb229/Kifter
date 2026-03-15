"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { PostCard } from "@/components/community/post-card";
import type { Post, UserRole } from "@/types";

interface Props {
  posts: Post[];
  currentUserId: string;
  currentUserRole: UserRole;
}

type TypeFilter = "all" | "progress" | "general";

export function PostFeed({ posts, currentUserId, currentUserRole }: Props) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const filtered = posts.filter((p) => {
    const matchesType = typeFilter === "all" || p.type === typeFilter;
    const matchesQuery =
      !query || p.content.toLowerCase().includes(query.toLowerCase());
    return matchesType && matchesQuery;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center animate-fade-up" style={{ animationDelay: "60ms" }}>
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search posts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1">
          {(["all", "progress", "general"] as TypeFilter[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                typeFilter === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t === "all" ? "All" : t === "progress" ? "Progress" : "General"}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center animate-fade-up">
          <p className="text-sm text-muted-foreground">
            {posts.length === 0
              ? "No posts yet. Be the first!"
              : "No posts match your filters."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
