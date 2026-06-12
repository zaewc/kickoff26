import { db } from "@/lib/db";
import {
  Prediction,
  RankingEntry,
  SessionUser,
  UserPredictionEntry,
  UserStats,
} from "@/lib/types";
import { getTimedMatchState } from "@/lib/match-clock";
import { upsertUser } from "@/lib/users";

export async function getPredictionsForUser(
  session: SessionUser | null,
): Promise<Record<number, Prediction>> {
  if (!session) return {};

  const user = await upsertUser(session);
  const predictions = await db.prediction.findMany({
    where: { userId: user.id },
    include: { fixture: { select: { externalId: true } } },
  });

  return Object.fromEntries(
    predictions.map((prediction) => [
      prediction.fixture.externalId,
      {
        home: prediction.homeScore,
        away: prediction.awayScore,
        wager: prediction.wagerPoints,
        updatedAt: prediction.updatedAt.toISOString(),
      },
    ]),
  );
}

export async function getUserStats(
  session: SessionUser | null,
): Promise<UserStats> {
  if (!session) {
    return {
      predictions: 0,
      scoredPredictions: 0,
      correctPredictions: 0,
      hitRate: 0,
      points: 0,
      balance: 0,
    };
  }

  const user = await upsertUser(session);
  const predictions = await db.prediction.findMany({
    where: { userId: user.id },
    select: {
      points: true,
      scoredAt: true,
      outcomeCorrect: true,
    },
  });
  const scored = predictions.filter((prediction) => prediction.scoredAt);
  const correct = scored.filter((prediction) => prediction.outcomeCorrect);

  return {
    predictions: predictions.length,
    scoredPredictions: scored.length,
    correctPredictions: correct.length,
    hitRate: scored.length ? Math.round((correct.length / scored.length) * 100) : 0,
    points: predictions.reduce((sum, prediction) => sum + prediction.points, 0),
    balance: user.pointBalance,
  };
}

export async function getPredictionListForUser(
  session: SessionUser | null,
): Promise<UserPredictionEntry[]> {
  if (!session) return [];

  const user = await upsertUser(session);
  const predictions = await db.prediction.findMany({
    where: { userId: user.id },
    include: { fixture: true },
    orderBy: { fixture: { kickoff: "asc" } },
  });

  return predictions.map((prediction) => {
    const fixture = prediction.fixture;
    const timedState = getTimedMatchState(
      fixture.kickoff.toISOString(),
      fixture.status as UserPredictionEntry["status"],
      fixture.elapsed ?? undefined,
    );

    return {
      id: prediction.id,
      matchId: fixture.externalId,
      stage: fixture.stage,
      group: fixture.groupName,
      kickoff: fixture.kickoff.toISOString(),
      venue: fixture.venue,
      status: timedState.status,
      home: {
        id: fixture.homeTeamId,
        name: fixture.homeName,
        code: fixture.homeCode,
        logo: fixture.homeLogo ?? undefined,
      },
      away: {
        id: fixture.awayTeamId,
        name: fixture.awayName,
        code: fixture.awayCode,
        logo: fixture.awayLogo ?? undefined,
      },
      prediction: {
        home: prediction.homeScore,
        away: prediction.awayScore,
        wager: prediction.wagerPoints,
      },
      result: {
        home: fixture.homeScore,
        away: fixture.awayScore,
      },
      outcomeCorrect: prediction.outcomeCorrect,
      exactScore: prediction.exactScore,
      payoutPoints: prediction.points,
      scoredAt: prediction.scoredAt?.toISOString(),
      updatedAt: prediction.updatedAt.toISOString(),
    };
  });
}

export async function getLeaderboard(limit = 10): Promise<RankingEntry[]> {
  const users = await db.user.findMany({
    include: {
      predictions: {
        select: { points: true, outcomeCorrect: true, scoredAt: true },
      },
    },
  });

  return users
    .map((user) => {
      const correct = user.predictions.filter(
        (prediction) => prediction.outcomeCorrect && prediction.scoredAt,
      ).length;
      const scored = user.predictions.filter(
        (prediction) => prediction.scoredAt,
      );
      return {
        name: user.name,
        detail:
          user.grade && user.classNumber
            ? `${user.grade}학년 ${user.classNumber}반`
            : user.provider === "google"
              ? "Google 사용자"
              : "DataGSM 사용자",
        points: user.pointBalance,
        predictions: user.predictions.length,
        hitRate: scored.length
          ? Math.round((correct / scored.length) * 100)
          : 0,
      };
    })
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.hitRate - a.hitRate ||
        b.predictions - a.predictions,
    )
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
