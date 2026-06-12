import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SessionUser } from "@/lib/types";

const SESSION_COOKIE = "kickoff_session";

const encode = (value: string) => Buffer.from(value).toString("base64url");
const decode = (value: string) =>
  Buffer.from(value, "base64url").toString("utf8");

const sessionSecret = () =>
  process.env.SESSION_SECRET || "development-only-change-this-secret";

export function signSession(user: SessionUser) {
  const payload = encode(
    JSON.stringify({
      user,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    }),
  );
  const signature = createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;
  if (!value) return null;

  try {
    const [payload, signature] = value.split(".");
    if (!payload || !signature) return null;

    const expected = createHmac("sha256", sessionSecret())
      .update(payload)
      .digest("base64url");

    if (
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return null;
    }

    const parsed = JSON.parse(decode(payload)) as {
      user: SessionUser;
      expiresAt: number;
    };
    return parsed.expiresAt > Date.now() ? parsed.user : null;
  } catch {
    return null;
  }
}

export const sessionCookie = {
  name: SESSION_COOKIE,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  },
};
