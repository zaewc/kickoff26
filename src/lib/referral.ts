import { db } from "@/lib/db";

export const REFERRAL_BONUS_POINTS = 10;

// 신규 가입자가 레퍼럴 링크를 통해 들어온 경우, 초대한 사람에게 보상을 지급한다.
// refValue는 초대자의 db id(cuid) 또는 datagsmId일 수 있다(세션 호환).
export async function awardReferral(newUserId: string, refValue: string) {
  const ref = refValue.trim();
  if (!ref) return;

  const referrer =
    (await db.user.findUnique({ where: { id: ref } })) ??
    (await db.user.findUnique({ where: { datagsmId: ref } }));

  // 초대자가 없거나, 자기 자신을 초대한 경우는 무시
  if (!referrer || referrer.id === newUserId) return;

  await db.$transaction(async (tx) => {
    // 이미 누군가에게 귀속된 신규 사용자면 중복 지급 방지(원자적)
    const claimed = await tx.user.updateMany({
      where: { id: newUserId, referredBy: null },
      data: { referredBy: referrer.id },
    });
    if (claimed.count === 0) return;

    const updated = await tx.user.update({
      where: { id: referrer.id },
      data: { pointBalance: { increment: REFERRAL_BONUS_POINTS } },
    });

    await tx.pointTransaction.create({
      data: {
        userId: referrer.id,
        type: "REFERRAL_BONUS",
        amount: REFERRAL_BONUS_POINTS,
        balanceAfter: updated.pointBalance,
        description: "친구 초대 보상",
      },
    });
  });
}
