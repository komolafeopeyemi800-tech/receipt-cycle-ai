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
import { salesRecords } from "../db/schema";
import { deleteAllReceipts } from "./receipts";
import type { AppEnv } from "../types";

type GoogleProfile = { sub: string; email: string; name?: string; picture?: string };

const isGooglePhoto = (url: string | null | undefined) => !url || /^https:\/\/[a-z0-9-]+\.googleusercontent\.com\//i.test(url);

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
      { email: p.email, name: p.name ?? "", emailVerified: true, image: p.picture ?? null },
      { method: "oauth", oauth: { providerId: "google", profile: { sub: p.sub, email: p.email, name: p.name } } },
    );
    userId = created.id;
    await db
      .insert(profile)
      .values({ userId, googleSub: p.sub })
      .onConflictDoUpdate({ target: profile.userId, set: { googleSub: p.sub } });
    isNewRegistration = true;
  }

  let row = await db.select({ id: user.id, email: user.email, name: user.name, image: user.image }).from(user).where(eq(user.id, userId)).get();
  if (!row) throw new ApiError(500, "Sign-in failed. Please try again.");
  // Keep the Google photo and name fresh, but never overwrite a picture the person uploaded themselves.
  if (p.picture && isGooglePhoto(row.image) && row.image !== p.picture) {
    await db.update(user).set({ image: p.picture, updatedAt: new Date() }).where(eq(user.id, userId));
    row = { ...row, image: p.picture };
  }
  if (!row.name.trim() && p.name) {
    await db.update(user).set({ name: p.name, updatedAt: new Date() }).where(eq(user.id, userId));
    row = { ...row, name: p.name };
  }
  const session = await ctx.internalAdapter.createSession(userId);
  return {
    token: session.token,
    user: { id: row.id, email: row.email, name: row.name.trim() || null, image: row.image ?? null },
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
      picture: claims.picture?.startsWith("https://") ? claims.picture : undefined,
    }),
  );
});

/** Signed-in account endpoints (was auth.me / resetMyData / deleteMyAccount). */
export const meRoutes = new Hono<AppEnv>();

/** Profile pictures are public images (an <img> tag cannot send a login header); the id is an unguessable UUID. */
meRoutes.get("/avatar/:id", async (c) => {
  const obj = await c.env.FILES.get(`avatars/${c.req.param("id")}`);
  if (!obj) return c.body(null, 404);
  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType ?? "image/jpeg",
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
      "cross-origin-resource-policy": "cross-origin",
    },
  });
});

meRoutes.use("*", requireUser);

meRoutes.get("/", async (c) => {
  const u = c.get("user");
  const row = await c.get("db").select({ image: user.image }).from(user).where(eq(user.id, u.id)).get();
  return c.json({ id: u.id, email: u.email, name: u.name.trim() || null, image: row?.image ?? null });
});

/** Change the display name. */
meRoutes.patch("/", async (c) => {
  const { name } = await parseBody(c, z.object({ name: z.string().trim().min(1).max(80) }));
  await c.get("db").update(user).set({ name, updatedAt: new Date() }).where(eq(user.id, c.get("user").id));
  return c.json({ ok: true, name });
});

const AVATAR_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const AVATAR_MAX_BYTES = 1024 * 1024;

/** Upload a profile picture (raw image bytes, max 1 MB — the web app shrinks photos before sending). */
meRoutes.put("/avatar", async (c) => {
  const type = (c.req.header("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!AVATAR_TYPES[type]) throw new ApiError(400, "Use a JPG, PNG or WebP picture.");
  const bytes = await c.req.arrayBuffer();
  if (bytes.byteLength === 0 || bytes.byteLength > AVATAR_MAX_BYTES) throw new ApiError(413, "Picture is too large. Choose one under 1 MB.");
  const id = c.get("user").id;
  await c.env.FILES.put(`avatars/${id}`, bytes, { httpMetadata: { contentType: type } });
  const base = (c.env.BETTER_AUTH_URL ?? new URL(c.req.url).origin).replace(/\/$/, "");
  const image = `${base}/api/me/avatar/${id}?v=${Date.now()}`;
  await c.get("db").update(user).set({ image, updatedAt: new Date() }).where(eq(user.id, id));
  return c.json({ image });
});

/** Remove the picture. */
meRoutes.delete("/avatar", async (c) => {
  const id = c.get("user").id;
  await c.env.FILES.delete(`avatars/${id}`);
  await c.get("db").update(user).set({ image: null, updatedAt: new Date() }).where(eq(user.id, id));
  return c.json({ ok: true });
});

/** Wipes the user's transactions and preferences; keeps the account. */
meRoutes.post("/reset-data", async (c) => {
  const id = c.get("user").id;
  const db = c.get("db");
  await runBatch(db, [
    db.delete(transactions).where(eq(transactions.userId, id)),
    db.delete(userPreferences).where(eq(userPreferences.userId, id)),
    db.delete(salesRecords).where(like(salesRecords.scope, `u:${id}:%`)),
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
    db.delete(salesRecords).where(like(salesRecords.scope, scopes)),
  ];
  if (slugs.length > 0) {
    const teamScopes = slugs.map((s) => `ws:${s}`);
    stmts.push(
      db.delete(accounts).where(inArray(accounts.scope, teamScopes)),
      db.delete(categories).where(inArray(categories.scope, teamScopes)),
      db.delete(budgets).where(inArray(budgets.scope, teamScopes)),
      db.delete(salesRecords).where(inArray(salesRecords.scope, teamScopes)),
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
