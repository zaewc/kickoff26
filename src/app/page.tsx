import { Dashboard } from "@/components/dashboard";
import { getSession } from "@/lib/auth";
import { getWorldCupMatches } from "@/lib/football";

export const revalidate = 30;

export default async function Home() {
  const [session, matchData] = await Promise.all([
    getSession(),
    getWorldCupMatches(),
  ]);

  return (
    <Dashboard
      initialMatches={matchData.matches}
      dataMode={matchData.mode}
      user={session}
    />
  );
}
