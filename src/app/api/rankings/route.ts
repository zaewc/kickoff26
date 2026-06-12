import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/predictions";

export async function GET() {
  return NextResponse.json({ rankings: await getLeaderboard(100) });
}
