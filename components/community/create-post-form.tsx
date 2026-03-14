"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/actions/post-actions";

export function CreatePostForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState("");
  const [type, setType] = useState<"progress" | "general">("progress");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createPost({ content, type });
      if (result.success) {
        router.push("/community");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-6 animate-fade-up"
      style={{ animationDelay: "80ms" }}
    >
      {/* Type selector */}
      <div className="mb-4">
        <p className="mb-2 text-sm font-medium">Post type</p>
        <div className="flex gap-2">
          {(["progress", "general"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                type === t
                  ? "bg-indigo-600 text-white shadow"
                  : "border border-border bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "progress" ? "Progress Update" : "General"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium" htmlFor="content">
            {type === "progress" ? "What did you accomplish?" : "What's on your mind?"}
          </label>
          <span className="text-xs text-muted-foreground">{content.length}/500</span>
        </div>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 500))}
          placeholder={
            type === "progress"
              ? "Share your workout, milestone, or PR…"
              : "Share something with the community…"
          }
          rows={5}
          required
          className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
        >
          {isPending ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
