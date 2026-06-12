import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/?auth=config", request.url));
  }

  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    new URL("/api/auth/google/callback", request.url).toString();

  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(url);
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 600,
  });
  response.cookies.set("google_oauth_verifier", verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 600,
  });
  return response;
}
