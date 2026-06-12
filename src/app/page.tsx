import { Dashboard } from "@/components/dashboard";
import { getSession } from "@/lib/auth";
import {
  ensureSeedFixtures,
  getFixtureDataMode,
  getStoredMatches,
} from "@/lib/fixtures";
import {
  getLeaderboard,
  getPredictionsForUser,
  getUserStats,
} from "@/lib/predictions";

export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureSeedFixtures();
  const session = await getSession();
  const [matches, dataMode, predictions, rankings, userStats] =
    await Promise.all([
      getStoredMatches(),
      getFixtureDataMode(),
      getPredictionsForUser(session),
      getLeaderboard(10),
      getUserStats(session),
    ]);

  return (
    <Dashboard
      initialMatches={matches}
      initialPredictions={predictions}
      initialRankings={rankings}
      initialUserStats={userStats}
      dataMode={dataMode}
      user={session}
    />
  );
}
