import Link from "next/link";
import { Plus, Users, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { getPosts } from "@/actions/post-actions";
import { Button } from "@/components/ui/button";
import { PostFeed } from "@/components/community/post-feed";
import { OnboardingTip } from "@/components/ui/onboarding-tip";


export default async function CommunityPage() {
  const session = await auth();
  const result = await getPosts();
  const posts = result.success ? result.data.posts : [];
  const nextCursor = result.success ? result.data.nextCursor : null;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-up">
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
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" render={<Link href="/community/leaderboard" />}>
            Leaderboard
          </Button>
          <Button size="sm" variant="outline" render={<Link href="/community/challenges" />}>
            <Trophy className="size-4" />
            Challenges
          </Button>
          <Button size="sm" render={<Link href="/community/new" />}>
            <Plus className="size-4" />
            New Post
          </Button>
        </div>
      </div>

      {posts.length === 0 && (
        <OnboardingTip
          tipKey="community-start"
          title="Share your progress with the community"
          description="Post progress updates, share completed workouts with one tap from Training, join 30-day challenges, and climb the weekly leaderboard."
          className="mb-6"
        />
      )}
      <PostFeed
        posts={posts}
        initialNextCursor={nextCursor}
        currentUserId={session!.user.id}
        currentUserRole={session!.user.role}
      />
    </div>
  );
}
