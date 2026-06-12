import { Match, MatchStatus } from "@/lib/types";

const MATCH_WINDOW_MINUTES = 135;
const FIRST_HALF_MINUTES = 45;
const HALF_TIME_MINUTES = 15;
const REGULATION_MINUTES = 90;

export function getTimedMatchState(
  kickoff: string,
  storedStatus: MatchStatus,
  storedElapsed: number | undefined,
  now = new Date(),
): Pick<Match, "status" | "elapsed"> {
  if (storedStatus === "FINISHED") {
    return { status: "FINISHED", elapsed: storedElapsed };
  }

  const elapsedWallMinutes = Math.floor(
    (now.getTime() - Date.parse(kickoff)) / 60_000,
  );
  if (elapsedWallMinutes < 0) {
    return { status: "UPCOMING", elapsed: undefined };
  }
  if (elapsedWallMinutes >= MATCH_WINDOW_MINUTES) {
    return { status: "FINISHED", elapsed: storedElapsed };
  }

  let elapsed = elapsedWallMinutes;
  if (elapsedWallMinutes > FIRST_HALF_MINUTES) {
    elapsed =
      elapsedWallMinutes <= FIRST_HALF_MINUTES + HALF_TIME_MINUTES
        ? FIRST_HALF_MINUTES
        : elapsedWallMinutes - HALF_TIME_MINUTES;
  }

  return {
    status: "LIVE",
    elapsed: Math.min(REGULATION_MINUTES, Math.max(1, elapsed)),
  };
}

export function syncMatchClock(match: Match, now = new Date()): Match {
  return {
    ...match,
    ...getTimedMatchState(match.kickoff, match.status, match.elapsed, now),
  };
}
