import { getLeaderboard, getLeaderboardExercises } from "@/actions/leaderboard-actions";
import { LeaderboardView } from "@/components/community/leaderboard-view";

export default async function LeaderboardPage() {
  const [result, exercisesResult] = await Promise.all([
    getLeaderboard(),
    getLeaderboardExercises(),
  ]);
  const entries = result.success ? result.data : [];
  const exercises = exercisesResult.success ? exercisesResult.data : [];

  return <LeaderboardView entries={entries} exercises={exercises} />;
}
