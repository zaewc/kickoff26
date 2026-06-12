import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPredictionsForUser } from "@/lib/predictions";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  return NextResponse.json({
    predictions: await getPredictionsForUser(session),
  });
}
