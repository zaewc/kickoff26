import { NextRequest, NextResponse } from "next/server";

const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const response = NextResponse.redirect(new URL("/", request.url));
  const normalized = code.trim();

  if (normalized && normalized.length <= 64) {
    response.cookies.set("kickoff_ref", encodeURIComponent(normalized), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: REFERRAL_COOKIE_MAX_AGE,
    });
  }

  return response;
}
