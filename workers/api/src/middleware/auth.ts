import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { getAuth } from "../auth";
import { profile, session, user } from "../db/schema";
import { ApiError } from "../lib/errors";
import type { AppEnv, AuthedUser } from "../types";

/**
 * Resolve the signed-in user id for a request. A bearer token is the raw `session.token` that
 * Better Auth (or the Google endpoint) returned at sign-in; browsers that use Better Auth's
 * cookie are handled by falling back to its own session lookup.
 */
export async function getSessionUserId(c: Parameters<Parameters<typeof createMiddleware<AppEnv>>[0]>[0]): Promise<string | null> {
  const header = c.req.header("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (token) {
    const row = await c.get("db").select().from(session).where(eq(session.token, token)).get();
    if (!row || row.expiresAt.getTime() <= Date.now()) return null;
    return row.userId;
  }
  const viaCookie = await getAuth(c.env, c.get("db")).api.getSession({ headers: c.req.raw.headers });
  return viaCookie?.user.id ?? null;
}

async function loadAuthedUser(c: Parameters<Parameters<typeof createMiddleware<AppEnv>>[0]>[0], userId: string): Promise<AuthedUser | null> {
  const db = c.get("db");
  const u = await db.select().from(user).where(eq(user.id, userId)).get();
  if (!u) return null;
  let p = await db.select().from(profile).where(eq(profile.userId, userId)).get();
  if (!p) {
    await db.insert(profile).values({ userId }).onConflictDoNothing();
    p = await db.select().from(profile).where(eq(profile.userId, userId)).get();
  }
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    createdAt: u.createdAt.getTime(),
    profile: {
      plan: p?.plan ?? null,
      proSubscriptionActive: p?.proSubscriptionActive ?? false,
      trialStartedAt: p?.trialStartedAt ?? null,
      trialLifetimeAdds: p?.trialLifetimeAdds ?? null,
      role: p?.role ?? null,
      status: p?.status ?? null,
    },
  };
}

/** Requires a valid session; sets `c.var.user`. Every data route uses this (fixes Convex's unauthenticated reads). */
export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
  const userId = await getSessionUserId(c);
  if (!userId) throw new ApiError(401, "Sign in required.");
  const authed = await loadAuthedUser(c, userId);
  if (!authed) throw new ApiError(401, "Sign in required.");
  if (authed.profile.status === "blocked" || authed.profile.status === "suspended") {
    throw new ApiError(403, "This account is disabled.");
  }
  c.set("user", authed);
  await next();
});
