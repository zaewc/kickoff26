import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { upsertUser } from "@/lib/users";

type RouteContext = {
  params: Promise<{ matchId: string }>;
};

const parseScore = (value: unknown) =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 20
    ? value
    : null;

const parseWager = (value: unknown) =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 10 &&
  value <= 500 &&
  value % 10 === 0
    ? value
    : null;

export async function PUT(request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { matchId } = await context.params;
  const externalId = Number(matchId);
  if (!Number.isSafeInteger(externalId)) {
    return NextResponse.json({ error: "잘못된 경기 ID입니다." }, { status: 400 });
  }

  let body: {
    homeScore?: unknown;
    awayScore?: unknown;
    wagerPoints?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const homeScore = parseScore(body.homeScore);
  const awayScore = parseScore(body.awayScore);
  const wagerPoints = parseWager(body.wagerPoints);
  if (homeScore === null || awayScore === null) {
    return NextResponse.json(
      { error: "점수는 0부터 20 사이의 정수여야 합니다." },
      { status: 400 },
    );
  }
  if (wagerPoints === null) {
    return NextResponse.json(
      { error: "베팅 포인트는 10부터 500까지 10P 단위로 입력하세요." },
      { status: 400 },
    );
  }

  const [user, fixture] = await Promise.all([
    upsertUser(session),
    db.fixture.findUnique({ where: { externalId } }),
  ]);

  if (!fixture) {
    return NextResponse.json({ error: "경기를 찾을 수 없습니다." }, { status: 404 });
  }
  if (fixture.status !== "UPCOMING" || fixture.kickoff <= new Date()) {
    return NextResponse.json(
      { error: "경기가 시작되어 예측이 마감되었습니다." },
      { status: 409 },
    );
  }

  let result;
  try {
    result = await db.$transaction(async (transaction) => {
      const existing = await transaction.prediction.findUnique({
        where: {
          userId_fixtureId: { userId: user.id, fixtureId: fixture.id },
        },
      });
      const wagerDifference = wagerPoints - (existing?.wagerPoints ?? 0);
      const currentUser = await transaction.user.findUniqueOrThrow({
        where: { id: user.id },
      });

      if (wagerDifference > currentUser.pointBalance) {
        throw new Error("INSUFFICIENT_POINTS");
      }

      const saved = existing
        ? await transaction.prediction.update({
            where: { id: existing.id },
            data: {
              homeScore,
              awayScore,
              wagerPoints,
              points: 0,
              exactScore: false,
              outcomeCorrect: false,
              scoredAt: null,
            },
          })
        : await transaction.prediction.create({
            data: {
              userId: user.id,
              fixtureId: fixture.id,
              homeScore,
              awayScore,
              wagerPoints,
            },
          });

      let balance = currentUser.pointBalance;
      if (wagerDifference !== 0) {
        const updatedUser = await transaction.user.update({
          where: { id: user.id },
          data: { pointBalance: { decrement: wagerDifference } },
        });
        balance = updatedUser.pointBalance;
        await transaction.pointTransaction.create({
          data: {
            userId: user.id,
            fixtureId: fixture.id,
            predictionId: saved.id,
            type: wagerDifference > 0 ? "WAGER" : "WAGER_REFUND",
            amount: -wagerDifference,
            balanceAfter: balance,
            description:
              wagerDifference > 0
                ? "경기 예측 베팅"
                : "베팅 포인트 하향 조정 환불",
          },
        });
      }

      await transaction.predictionRevision.create({
        data: {
          userId: user.id,
          fixtureId: fixture.id,
          homeScore,
          awayScore,
          wagerPoints,
          action: existing ? "UPDATE" : "CREATE",
        },
      });
      return { prediction: saved, balance };
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_POINTS") {
      return NextResponse.json(
        { error: "보유 포인트가 부족합니다." },
        { status: 409 },
      );
    }
    throw error;
  }

  return NextResponse.json({
    prediction: {
      home: result.prediction.homeScore,
      away: result.prediction.awayScore,
      wager: result.prediction.wagerPoints,
      updatedAt: result.prediction.updatedAt.toISOString(),
    },
    balance: result.balance,
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { matchId } = await context.params;
  const externalId = Number(matchId);
  const [user, fixture] = await Promise.all([
    upsertUser(session),
    db.fixture.findUnique({ where: { externalId } }),
  ]);

  if (!fixture) {
    return NextResponse.json({ error: "경기를 찾을 수 없습니다." }, { status: 404 });
  }
  if (fixture.status !== "UPCOMING" || fixture.kickoff <= new Date()) {
    return NextResponse.json(
      { error: "경기가 시작되어 예측을 삭제할 수 없습니다." },
      { status: 409 },
    );
  }

  const existing = await db.prediction.findUnique({
    where: {
      userId_fixtureId: { userId: user.id, fixtureId: fixture.id },
    },
  });
  if (!existing) return new NextResponse(null, { status: 204 });

  const balance = await db.$transaction(async (transaction) => {
    await transaction.predictionRevision.create({
      data: {
        userId: user.id,
        fixtureId: fixture.id,
        homeScore: existing.homeScore,
        awayScore: existing.awayScore,
        wagerPoints: existing.wagerPoints,
        action: "DELETE",
      },
    });
    await transaction.prediction.delete({ where: { id: existing.id } });
    const updatedUser = await transaction.user.update({
      where: { id: user.id },
      data: { pointBalance: { increment: existing.wagerPoints } },
    });
    await transaction.pointTransaction.create({
      data: {
        userId: user.id,
        fixtureId: fixture.id,
        predictionId: existing.id,
        type: "WAGER_REFUND",
        amount: existing.wagerPoints,
        balanceAfter: updatedUser.pointBalance,
        description: "예측 삭제로 베팅 포인트 환불",
      },
    });
    return updatedUser.pointBalance;
  });

  return NextResponse.json({ balance });
}
