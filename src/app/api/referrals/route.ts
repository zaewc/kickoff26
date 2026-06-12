import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { REFERRAL_BONUS_POINTS } from "@/lib/referral";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { datagsmId: session.id },
    select: {
      id: true,
      _count: {
        select: {
          pointTransactions: {
            where: { type: "REFERRAL_BONUS" },
          },
        },
      },
    },
  });
  if (!user) {
    return NextResponse.json(
      { error: "사용자 정보를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const referralCount = user._count.pointTransactions;
  return NextResponse.json({
    shareUrl: new URL(`/r/${encodeURIComponent(user.id)}`, request.url).toString(),
    referralCount,
    earnedPoints: referralCount * REFERRAL_BONUS_POINTS,
    rewardPoints: REFERRAL_BONUS_POINTS,
  });
}
