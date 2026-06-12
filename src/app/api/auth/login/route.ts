import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const AUTH_URL =
  "https://oauth.authorization.datagsm.kr/v1/oauth/authorize";

export async function GET(request: NextRequest) {
  const clientId = process.env.DATAGSM_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/?auth=config", request.url));
  }

  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256")
    .update(verifier)
    .digest("base64url");
  const redirectUri =
    process.env.DATAGSM_REDIRECT_URI ||
    new URL("/api/auth/callback", request.url).toString();

  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(url);
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 600,
  });
  response.cookies.set("oauth_verifier", verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 600,
  });
  return response;
}
