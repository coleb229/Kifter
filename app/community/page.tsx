import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { auth } from "@/auth";
import { getPosts } from "@/actions/post-actions";
import { Button } from "@/components/ui/button";
import { PostFeed } from "@/components/community/post-feed";


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

      <PostFeed
        posts={posts}
        currentUserId={session!.user.id}
        currentUserRole={session!.user.role}
      />
    </div>
  );
}
