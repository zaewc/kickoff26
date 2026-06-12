import { NextRequest, NextResponse } from "next/server";
import { sessionCookie, signSession } from "@/lib/auth";
import { SessionUser } from "@/lib/types";

const TOKEN_URL = "https://oauth.authorization.datagsm.kr/v1/oauth/token";
const USERINFO_URL = "https://oauth.resource.datagsm.kr/userinfo";

type DataGsmProfile = {
  sub?: string;
  id?: string | number;
  name?: string;
  email?: string;
  student?: {
    name?: string;
    grade?: number;
    classNumber?: number;
    class_num?: number;
    number?: number;
  };
  grade?: number;
  classNumber?: number;
  class_num?: number;
  number?: number;
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = request.cookies.get("oauth_state")?.value;
  const verifier = request.cookies.get("oauth_verifier")?.value;
  const clientId = process.env.DATAGSM_CLIENT_ID;
  const redirectUri =
    process.env.DATAGSM_REDIRECT_URI ||
    new URL("/api/auth/callback", request.url).toString();

  if (!code || !state || state !== savedState || !verifier || !clientId) {
    return NextResponse.redirect(new URL("/?auth=invalid", request.url));
  }

  try {
    const tokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        redirect_uri: redirectUri,
        code_verifier: verifier,
      }),
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokens = (await tokenResponse.json()) as { access_token: string };
    const profileResponse = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
    });

    if (!profileResponse.ok) {
      throw new Error(`Userinfo request failed: ${profileResponse.status}`);
    }

    const profile = (await profileResponse.json()) as DataGsmProfile;
    const student = profile.student;
    const user: SessionUser = {
      id: String(profile.sub ?? profile.id ?? profile.email ?? "datagsm-user"),
      name: profile.name ?? student?.name ?? "DataGSM 사용자",
      email: profile.email,
      grade: profile.grade ?? student?.grade,
      classNumber:
        profile.classNumber ??
        profile.class_num ??
        student?.classNumber ??
        student?.class_num,
      number: profile.number ?? student?.number,
    };

    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(
      sessionCookie.name,
      signSession(user),
      sessionCookie.options,
    );
    response.cookies.delete("oauth_state");
    response.cookies.delete("oauth_verifier");
    return response;
  } catch (error) {
    console.error("DataGSM OAuth callback failed:", error);
    return NextResponse.redirect(new URL("/?auth=failed", request.url));
  }
}
