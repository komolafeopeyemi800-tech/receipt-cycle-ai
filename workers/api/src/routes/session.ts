import { eq, inArray, like } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { getAuth } from "../auth";
import {
  accounts,
  budgets,
  categories,
  profile,
  transactions,
  user,
  userPreferences,
  workspaceInvites,
  workspaceMembers,
  workspaces,
} from "../db/schema";
import { runBatch, type Stmt } from "../lib/batch";
import { ApiError } from "../lib/errors";
import { googleVerifier } from "../lib/googleIdToken";
import { parseBody } from "../lib/http";
import { requireUser } from "../middleware/auth";
import { deleteAllReceipts } from "./receipts";
import type { AppEnv } from "../types";

type GoogleProfile = { sub: string; email: string; name?: string };

/**
 * Sign in (or register) someone who proved their identity with Google. Same account rules as the
 * Convex version: match by Google id first, then by email, and never silently take over an account
 * that was created with a password.
 */
async function completeGoogleSignIn(c: import("hono").Context<AppEnv>, p: GoogleProfile) {
  const db = c.get("db");
  const ctx = await getAuth(c.env, db).$context;

  let userId: string;
  let isNewRegistration = false;

  const bySub = await db.select({ userId: profile.userId }).from(profile).where(eq(profile.googleSub, p.sub)).get();
  if (bySub) {
    userId = bySub.userId;
  } else {
    const existing = await db
      .select({ id: user.id, googleSub: profile.googleSub })
      .from(user)
      .leftJoin(profile, eq(profile.userId, user.id))
      .where(eq(user.email, p.email))
      .get();
    if (existing) {
      if (!existing.googleSub) {
        throw new ApiError(
          409,
          "This email is already registered with a password. Sign in with email and password, or use a different Google account.",
        );
      }
      throw new ApiError(409, "Google sign-in could not be completed for this account. Try a different sign-in method.");
    }
    const created = await ctx.internalAdapter.createUser(
      { email: p.email, name: p.name ?? "", emailVerified: true },
      { method: "oauth", oauth: { providerId: "google", profile: { sub: p.sub, email: p.email, name: p.name } } },
    );
    userId = created.id;
    await db
      .insert(profile)
      .values({ userId, googleSub: p.sub })
      .onConflictDoUpdate({ target: profile.userId, set: { googleSub: p.sub } });
    isNewRegistration = true;
  }

  const row = await db.select({ id: user.id, email: user.email, name: user.name }).from(user).where(eq(user.id, userId)).get();
  if (!row) throw new ApiError(500, "Sign-in failed. Please try again.");
  const session = await ctx.internalAdapter.createSession(userId);
  return {
    token: session.token,
    user: { id: row.id, email: row.email, name: row.name.trim() || null },
    isNewRegistration,
  };
}

export const socialRoutes = new Hono<AppEnv>();

socialRoutes.post("/google", async (c) => {
  const { idToken } = await parseBody(c, z.object({ idToken: z.string().min(1) }));
  const audiences = [c.env.GOOGLE_WEB_CLIENT_ID, c.env.GOOGLE_IOS_CLIENT_ID, c.env.GOOGLE_ANDROID_CLIENT_ID]
    .map((x) => x?.trim())
    .filter((x): x is string => !!x);
  if (audiences.length === 0) {
    throw new ApiError(503, "Google sign-in is not configured on the server (set GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID or GOOGLE_ANDROID_CLIENT_ID).");
  }
  let claims;
  try {
    claims = await googleVerifier.verify(idToken, audiences);
  } catch {
    throw new ApiError(401, "Google sign-in failed. Please try again.");
  }
  if (!claims.sub) throw new ApiError(401, "Google sign-in failed: missing account id.");
  if (!claims.email) throw new ApiError(400, "Google did not share an email with this app.");
  if (claims.email_verified === false) throw new ApiError(400, "Verify your Google email address, then try again.");
  return c.json(
    await completeGoogleSignIn(c, {
      sub: claims.sub,
      email: claims.email.trim().toLowerCase(),
      name: claims.name?.trim() || undefined,
    }),
  );
});

/** Signed-in account endpoints (was auth.me / resetMyData / deleteMyAccount). */
export const meRoutes = new Hono<AppEnv>();
meRoutes.use("*", requireUser);

meRoutes.get("/", (c) => {
  const u = c.get("user");
  return c.json({ id: u.id, email: u.email, name: u.name.trim() || null });
});

/** Wipes the user's transactions and preferences; keeps the account. */
meRoutes.post("/reset-data", async (c) => {
  const id = c.get("user").id;
  const db = c.get("db");
  await runBatch(db, [
    db.delete(transactions).where(eq(transactions.userId, id)),
    db.delete(userPreferences).where(eq(userPreferences.userId, id)),
  ]);
  await deleteAllReceipts(c.env.FILES, id);
  return c.json({ ok: true });
});

/** Permanently deletes the account and everything it owns. */
meRoutes.delete("/", async (c) => {
  const id = c.get("user").id;
  const db = c.get("db");
  const owned = await db.select({ slug: workspaces.slug }).from(workspaces).where(eq(workspaces.ownerUserId, id));
  const slugs = owned.map((w) => w.slug);
  const scopes = `u:${id}:%`;
  const stmts: Stmt[] = [
    db.delete(accounts).where(like(accounts.scope, scopes)),
    db.delete(categories).where(like(categories.scope, scopes)),
    db.delete(budgets).where(like(budgets.scope, scopes)),
  ];
  if (slugs.length > 0) {
    const teamScopes = slugs.map((s) => `ws:${s}`);
    stmts.push(
      db.delete(accounts).where(inArray(accounts.scope, teamScopes)),
      db.delete(categories).where(inArray(categories.scope, teamScopes)),
      db.delete(budgets).where(inArray(budgets.scope, teamScopes)),
      db.delete(workspaceMembers).where(inArray(workspaceMembers.workspaceKey, slugs)),
      db.delete(workspaceInvites).where(inArray(workspaceInvites.workspaceKey, slugs)),
      db.delete(workspaces).where(inArray(workspaces.slug, slugs)),
    );
  }
  // Deleting the user cascades to sessions, credentials, profile, transactions, preferences and memberships.
  stmts.push(db.delete(user).where(eq(user.id, id)));
  await runBatch(db, stmts);
  await deleteAllReceipts(c.env.FILES, id);
  return c.json({ ok: true });
});
