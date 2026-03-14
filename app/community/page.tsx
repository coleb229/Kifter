import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { auth } from "@/auth";
import { getPosts } from "@/actions/post-actions";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/community/post-card";

export default async function CommunityPage() {
  const session = await auth();
  const result = await getPosts();
  const posts = result.success ? result.data : [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/40">
            <Users className="size-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Community</h1>
            <p className="text-sm text-muted-foreground">
              Progress updates from the community
            </p>
          </div>
        </div>
        <Button size="sm" render={<Link href="/community/new" />}>
          <Plus className="size-4" />
          New Post
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No posts yet. Be the first!</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            render={<Link href="/community/new" />}
          >
            Create a post
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={session!.user.id}
              currentUserRole={session!.user.role}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
