import { Dashboard } from "@/components/dashboard";
import { DatabaseSetup } from "@/components/database-setup";
import { getSession } from "@/lib/auth";
import { isPersistentDatabaseConfigured } from "@/lib/db";
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
  if (!isPersistentDatabaseConfigured) {
    return <DatabaseSetup />;
  }

  try {
    await ensureSeedFixtures();
  } catch (error) {
    console.error("Database initialization failed:", error);
    return <DatabaseSetup />;
  }

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
