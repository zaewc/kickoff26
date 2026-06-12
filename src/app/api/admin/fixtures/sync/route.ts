import { NextRequest, NextResponse } from "next/server";
import { syncFixtures } from "@/lib/fixtures";

export async function POST(request: NextRequest) {
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

  try {
    const result = await syncFixtures();
    return NextResponse.json({
      ok: true,
      ...result,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Fixture sync failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "경기 일정 동기화에 실패했습니다.",
      },
      { status: 502 },
    );
  }
}
