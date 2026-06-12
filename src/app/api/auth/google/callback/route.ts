import { NextRequest, NextResponse } from "next/server";
import { sessionCookie, signSession } from "@/lib/auth";
import { SessionUser } from "@/lib/types";
import { findUserBySession, upsertUser } from "@/lib/users";
import { awardReferral } from "@/lib/referral";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

type GoogleProfile = {
  sub?: string;
  name?: string;
  given_name?: string;
  email?: string;
  picture?: string;
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = request.cookies.get("google_oauth_state")?.value;
  const verifier = request.cookies.get("google_oauth_verifier")?.value;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    new URL("/api/auth/google/callback", request.url).toString();

  if (
    !code ||
    !state ||
    state !== savedState ||
    !verifier ||
    !clientId ||
    !clientSecret
  ) {
    return NextResponse.redirect(new URL("/?auth=invalid", request.url));
  }

  try {
    const tokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
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

    const profile = (await profileResponse.json()) as GoogleProfile;
    if (!profile.sub) {
      throw new Error("Google userinfo missing sub");
    }

    const user: SessionUser = {
      id: `google:${profile.sub}`,
      provider: "google",
      name: profile.name ?? profile.given_name ?? profile.email ?? "Google 사용자",
      email: profile.email,
      avatar: profile.picture,
    };
    const existing = await findUserBySession(user);
    const dbUser = await upsertUser(user);
    user.refCode = dbUser.id;

    if (!existing) {
      const ref = request.cookies.get("kickoff_ref")?.value;
      if (ref) {
        try {
          await awardReferral(dbUser.id, decodeURIComponent(ref));
        } catch (error) {
          console.error("Referral award failed:", error);
        }
      }
    }

    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(
      sessionCookie.name,
      signSession(user),
      sessionCookie.options,
    );
    response.cookies.delete("google_oauth_state");
    response.cookies.delete("google_oauth_verifier");
    response.cookies.delete("kickoff_ref");
    return response;
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    return NextResponse.redirect(new URL("/?auth=failed", request.url));
  }
}
