import { db } from "@/lib/db";
import {
  fetchFootballDataResults,
  fetchOpenFootballSchedule,
} from "@/lib/free-football";
import { demoMatches } from "@/lib/football";
import { syncMatchClock } from "@/lib/match-clock";
import { settleBettingPool } from "@/lib/scoring";
import { FixtureDataMode, Match } from "@/lib/types";

function fixtureData(match: Match, mode: FixtureDataMode) {
  return {
    stage: match.stage,
    groupName: match.group,
    kickoff: new Date(match.kickoff),
    venue: match.venue,
    status: match.status,
    elapsed: match.elapsed,
    homeTeamId: match.home.id,
    homeName: match.home.name,
    homeCode: match.home.code,
    homeLogo: match.home.logo,
    awayTeamId: match.away.id,
    awayName: match.away.name,
    awayCode: match.away.code,
    awayLogo: match.away.logo,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    dataMode: mode,
  };
}

export async function settleFinishedFixtures() {
  const fixtures = await db.fixture.findMany({
    where: {
      status: "FINISHED",
      settledAt: null,
      homeScore: { not: null },
      awayScore: { not: null },
    },
    include: { predictions: true },
  });

  for (const fixture of fixtures) {
    const actualHome = fixture.homeScore;
    const actualAway = fixture.awayScore;
    if (actualHome === null || actualAway === null) continue;

    const awards = settleBettingPool(
      fixture.predictions.map((prediction) => ({
        id: prediction.id,
        homeScore: prediction.homeScore,
        awayScore: prediction.awayScore,
        wagerPoints: prediction.wagerPoints,
      })),
      actualHome,
      actualAway,
    );

    await db.$transaction(async (transaction) => {
      for (const award of awards) {
        const prediction = fixture.predictions.find(
          (entry) => entry.id === award.id,
        );
        if (!prediction) continue;

        await transaction.prediction.update({
          where: { id: prediction.id },
          data: {
            points: award.payoutPoints,
            exactScore: award.exactScore,
            outcomeCorrect: award.outcomeCorrect,
            scoredAt: new Date(),
          },
        });

        if (award.payoutPoints > 0) {
          const user = await transaction.user.update({
            where: { id: prediction.userId },
            data: { pointBalance: { increment: award.payoutPoints } },
          });
          await transaction.pointTransaction.create({
            data: {
              userId: prediction.userId,
              fixtureId: fixture.id,
              predictionId: prediction.id,
              type: award.refunded ? "NO_WINNER_REFUND" : "POOL_PAYOUT",
              amount: award.payoutPoints,
              balanceAfter: user.pointBalance,
              description: award.refunded
                ? "적중자 없음으로 베팅 포인트 환불"
                : "경기 베팅 풀 적중 배당",
            },
          });
        }
      }

      await transaction.fixture.update({
        where: { id: fixture.id },
        data: { settledAt: new Date() },
      });
    });
  }
}

export async function syncFixtures() {
  const matches = await fetchOpenFootballSchedule();
  const existingFixtures = await db.fixture.findMany({
    include: { _count: { select: { predictions: true } } },
  });
  const migratedIds = new Set<string>();

  // Per-row writes instead of one interactive transaction: against remote
  // Turso the 100+ sequential round-trips blow past the 5s transaction
  // timeout. Upserts are idempotent, so the sync stays safe to re-run.
  for (const match of matches) {
    const existing = existingFixtures.find(
      (fixture) => fixture.externalId === match.id,
    );
    const legacyDemo = existingFixtures.find(
      (fixture) =>
        fixture.dataMode === "demo" &&
        !migratedIds.has(fixture.id) &&
        normalizeTeamName(fixture.homeName) === normalizeTeamName(match.home.name) &&
        normalizeTeamName(fixture.awayName) === normalizeTeamName(match.away.name),
    );

    if (legacyDemo && !existing) {
      migratedIds.add(legacyDemo.id);
      await db.fixture.update({
        where: { id: legacyDemo.id },
        data: {
          externalId: match.id,
          ...fixtureData(match, "open"),
        },
      });
      continue;
    }

    await db.fixture.upsert({
      where: { externalId: match.id },
      create: {
        externalId: match.id,
        ...fixtureData(match, "open"),
      },
      update: {
        stage: match.stage,
        groupName: match.group,
        kickoff: new Date(match.kickoff),
        venue: match.venue,
        homeTeamId: match.home.id,
        homeName: match.home.name,
        homeCode: match.home.code,
        awayTeamId: match.away.id,
        awayName: match.away.name,
        awayCode: match.away.code,
        dataMode: existing?.dataMode === "football-data" ? "football-data" : "open",
        ...(match.status === "FINISHED"
          ? {
              status: match.status,
              homeScore: match.homeScore,
              awayScore: match.awayScore,
            }
          : {}),
      },
    });
  }

  await db.fixture.deleteMany({
    where: {
      dataMode: "demo",
      predictions: { none: {} },
    },
  });

  await settleFinishedFixtures();
  return { mode: "open" as const, count: matches.length };
}

function normalizeTeamName(name: string) {
  const aliases: Record<string, string> = {
    "korea republic": "south korea",
    "united states of america": "united states",
    "czechia": "czech republic",
  };
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return aliases[normalized] ?? normalized;
}

export async function syncFixtureResults() {
  const results = await fetchFootballDataResults();
  const fixtures = await db.fixture.findMany();
  let updated = 0;

  for (const result of results) {
    const teamMatch = fixtures.find(
      (fixture) =>
        normalizeTeamName(fixture.homeName) ===
          normalizeTeamName(result.home.name) &&
        normalizeTeamName(fixture.awayName) ===
          normalizeTeamName(result.away.name),
    );
    const kickoffMatch = fixtures.find(
      (fixture) =>
        Math.abs(fixture.kickoff.getTime() - result.kickoff.getTime()) <=
        2 * 60 * 60 * 1000,
    );
    const fixture = teamMatch ?? kickoffMatch;
    if (!fixture) continue;

    await db.fixture.update({
      where: { id: fixture.id },
      data: {
        kickoff: result.kickoff,
        venue: result.venue ?? fixture.venue,
        status: result.status,
        homeTeamId: result.home.id,
        homeName: result.home.name,
        homeCode: result.home.code,
        homeLogo: result.home.logo,
        awayTeamId: result.away.id,
        awayName: result.away.name,
        awayCode: result.away.code,
        awayLogo: result.away.logo,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        dataMode: "football-data",
      },
    });
    updated += 1;
  }

  await settleFinishedFixtures();
  return { mode: "football-data" as const, received: results.length, updated };
}

export async function ensureSeedFixtures() {
  const count = await db.fixture.count();
  if (count > 0) return;

  await db.$transaction(
    demoMatches.map((match) =>
      db.fixture.upsert({
        where: { externalId: match.id },
        create: {
          externalId: match.id,
          ...fixtureData(match, "demo"),
        },
        update: {},
      }),
    ),
  );
}

export async function getFixtureDataMode(): Promise<FixtureDataMode> {
  const fixture = await db.fixture.findFirst({
    select: { dataMode: true },
    orderBy: { updatedAt: "desc" },
  });
  if (fixture?.dataMode === "football-data") return "football-data";
  if (fixture?.dataMode === "open") return "open";
  return "demo";
}

export async function getStoredMatches(): Promise<Match[]> {
  const fixtures = await db.fixture.findMany({
    include: {
      predictions: {
        select: { homeScore: true, awayScore: true, wagerPoints: true },
      },
    },
    orderBy: { kickoff: "asc" },
  });

  return fixtures
    .map((fixture) => {
      const counts = fixture.predictions.reduce(
        (result, prediction) => {
          if (prediction.homeScore === prediction.awayScore) result.draw += 1;
          else if (prediction.homeScore > prediction.awayScore) result.home += 1;
          else result.away += 1;
          return result;
        },
        { home: 0, draw: 0, away: 0 },
      );
      const total = counts.home + counts.draw + counts.away;
      const poolPoints = fixture.predictions.reduce(
        (sum, prediction) => sum + prediction.wagerPoints,
        0,
      );
      const home = total ? Math.round((counts.home / total) * 100) : 0;
      const draw = total ? Math.round((counts.draw / total) * 100) : 0;

      return syncMatchClock({
        id: fixture.externalId,
        stage: fixture.stage,
        group: fixture.groupName,
        kickoff: fixture.kickoff.toISOString(),
        venue: fixture.venue,
        status: fixture.status as Match["status"],
        elapsed: fixture.elapsed ?? undefined,
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
        homeScore: fixture.homeScore,
        awayScore: fixture.awayScore,
        crowd: {
          home,
          draw,
          away: total ? 100 - home - draw : 0,
          predictions: total,
          poolPoints,
        },
      });
    })
    .sort((a, b) => {
      const statusWeight = { LIVE: 0, UPCOMING: 1, FINISHED: 2 };
      return (
        statusWeight[a.status] - statusWeight[b.status] ||
        Date.parse(a.kickoff) - Date.parse(b.kickoff)
      );
    });
}
