import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settleFinishedFixtures } from "@/lib/fixtures";

type RouteContext = {
  params: Promise<{ matchId: string }>;
};

const parseScore = (value: unknown) =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 30
    ? value
    : null;

export async function PUT(request: NextRequest, context: RouteContext) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET이 설정되지 않았습니다." },
      { status: 503 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const { matchId } = await context.params;
  const externalId = Number(matchId);
  const body = (await request.json()) as {
    homeScore?: unknown;
    awayScore?: unknown;
  };
  const homeScore = parseScore(body.homeScore);
  const awayScore = parseScore(body.awayScore);
  if (!Number.isSafeInteger(externalId) || homeScore === null || awayScore === null) {
    return NextResponse.json(
      { error: "경기 ID와 0~30 사이의 스코어를 확인하세요." },
      { status: 400 },
    );
  }

  const fixture = await db.fixture.findUnique({ where: { externalId } });
  if (!fixture) {
    return NextResponse.json({ error: "경기를 찾을 수 없습니다." }, { status: 404 });
  }
  if (fixture.settledAt) {
    return NextResponse.json(
      { error: "이미 정산된 경기는 수정할 수 없습니다." },
      { status: 409 },
    );
  }

  await db.fixture.update({
    where: { id: fixture.id },
    data: {
      status: "FINISHED",
      homeScore,
      awayScore,
      dataMode: "open",
    },
  });
  await settleFinishedFixtures();

  return NextResponse.json({
    ok: true,
    matchId: externalId,
    homeScore,
    awayScore,
    settledAt: new Date().toISOString(),
  });
}
