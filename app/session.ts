import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { env } from "./lib/utils/env.server";

type AuthSessionState = { userId: string };

const ONE_YEAR_IN_SECS = 60 * 60 * 24 * 365;

export const authSessionStorage = createCookieSessionStorage<AuthSessionState>({
  cookie: {
    name: "auth",
    httpOnly: true,
    maxAge: ONE_YEAR_IN_SECS,
    sameSite: "lax",
    secrets: [env.COOKIE_SECRET],
    secure: true,
  },
});

export async function getAuthSession(request: Request) {
  return authSessionStorage.getSession(request.headers.get("Cookie"));
}

export async function requireUser(request: Request): Promise<string> {
  const userId = await getUser(request);

  if (userId === undefined) {
    throw redirect("/auth");
  }

  return userId;
}

export async function requireAnonymous(request: Request) {
  const userId = await getUser(request);

  if (userId !== undefined) {
    throw redirect("/");
  }
}

export async function getUser(request: Request): Promise<string | undefined> {
  const authSession = await getAuthSession(request);

  return authSession.get("userId");
}
