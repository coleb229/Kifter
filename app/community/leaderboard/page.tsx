import { getLeaderboard } from "@/actions/leaderboard-actions";
import { LeaderboardView } from "@/components/community/leaderboard-view";

export default async function LeaderboardPage() {
  const result = await getLeaderboard();
  const entries = result.success ? result.data : [];

  return <LeaderboardView entries={entries} />;
}
