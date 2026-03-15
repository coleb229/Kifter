import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { getChallenges } from "@/actions/challenge-actions";
import { ChallengesView } from "@/components/community/challenges-view";

export default async function ChallengesPage() {
  const session = await auth();
  const result = await getChallenges();
  const challenges = result.success ? result.data : [];

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/community"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Community
        </Link>
      </div>

      <div className="mb-8 flex items-center gap-3 animate-fade-up">
        <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/40">
          <Trophy className="size-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Challenges</h1>
          <p className="text-sm text-muted-foreground">30-day fitness challenges</p>
        </div>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
        <ChallengesView challenges={challenges} currentUserId={session!.user.id} />
      </div>
    </div>
  );
}
