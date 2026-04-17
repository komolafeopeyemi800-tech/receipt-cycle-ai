import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function findSessionByRawToken(ctx: any, token: string) {
  const normalized = token.trim();
  const hashed = await sha256Hex(normalized);
  const byHashed = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", hashed))
    .unique();
  if (byHashed) return byHashed;
  // Backward compatibility for old plaintext session rows.
  return await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", normalized))
    .unique();
}

async function findPasswordResetByRawToken(ctx: any, token: string) {
  const normalized = token.trim();
  const hashed = await sha256Hex(normalized);
  const byHashed = await ctx.db
    .query("passwordResetTokens")
    .withIndex("by_token", (q) => q.eq("token", hashed))
    .unique();
  if (byHashed) return byHashed;
  // Backward compatibility for old plaintext reset token rows.
  return await ctx.db
    .query("passwordResetTokens")
    .withIndex("by_token", (q) => q.eq("token", normalized))
    .unique();
}

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
  },
});

export const insertUser = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    name: v.optional(v.string()),
    googleSub: v.optional(v.string()),
    whopSub: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      email: args.email,
      passwordHash: args.passwordHash,
      name: args.name,
      googleSub: args.googleSub,
      whopSub: args.whopSub,
    });
  },
});

/** Link Whop OIDC subject to an existing email/password row (OAuth proves email at Whop). */
export const linkWhopToExistingUser = internalMutation({
  args: {
    userId: v.id("users"),
    whopSub: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { userId, whopSub, name }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found.");
    if (user.whopSub && user.whopSub !== whopSub) {
      throw new Error("This account is already linked to a different Whop login.");
    }
    const patch: { whopSub: string; name?: string } = { whopSub };
    if (name && !user.name?.trim()) patch.name = name;
    await ctx.db.patch(userId, patch);
  },
});

export const getUserByGoogleSub = internalQuery({
  args: { googleSub: v.string() },
  handler: async (ctx, { googleSub }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_google_sub", (q) => q.eq("googleSub", googleSub))
      .unique();
  },
});

export const getUserByWhopSub = internalQuery({
  args: { whopSub: v.string() },
  handler: async (ctx, { whopSub }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_whop_sub", (q) => q.eq("whopSub", whopSub))
      .unique();
  },
});

export const deletePasswordResetsForUser = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const rows = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const r of rows) await ctx.db.delete(r._id);
  },
});

export const insertPasswordReset = internalMutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const hashed = await sha256Hex(args.token.trim());
    return await ctx.db.insert("passwordResetTokens", { ...args, token: hashed });
  },
});

export const getPasswordReset = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    return await findPasswordResetByRawToken(ctx, token);
  },
});

export const deletePasswordReset = internalMutation({
  args: { id: v.id("passwordResetTokens") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const insertSession = internalMutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, { userId, token, expiresAt }) => {
    const hashed = await sha256Hex(token.trim());
    return await ctx.db.insert("sessions", { userId, token: hashed, expiresAt });
  },
});

export const me = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    if (!token) return null;
    const sess = await findSessionByRawToken(ctx, token);
    if (!sess || sess.expiresAt < Date.now()) return null;
    const user = await ctx.db.get(sess.userId);
    if (!user) return null;
    return {
      id: user._id as string,
      email: user.email,
      name: user.name ?? null,
    };
  },
});

export const signOut = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const sess = await findSessionByRawToken(ctx, token);
    if (sess) await ctx.db.delete(sess._id);
  },
});

/** Used by authNode.changePassword — validates session and returns password hash for bcrypt check */
export const getUserForPasswordChange = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const sess = await findSessionByRawToken(ctx, token);
    if (!sess || sess.expiresAt < Date.now()) return null;
    const user = await ctx.db.get(sess.userId);
    if (!user) return null;
    return { userId: user._id, passwordHash: user.passwordHash };
  },
});

export const patchUserPassword = internalMutation({
  args: { userId: v.id("users"), passwordHash: v.string() },
  handler: async (ctx, { userId, passwordHash }) => {
    await ctx.db.patch(userId, { passwordHash });
  },
});

export const resetMyData = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const sess = await findSessionByRawToken(ctx, token);
    const userId = !sess || sess.expiresAt < Date.now() ? null : sess.userId;
    if (!userId) throw new Error("Session expired. Sign in again.");

    const txRows = await ctx.db.query("transactions").collect();
    for (const row of txRows) {
      if ((row as { userId?: string }).userId === (userId as string)) {
        await ctx.db.delete(row._id);
      }
    }

    const pref = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId as string))
      .unique();
    if (pref) await ctx.db.delete(pref._id);

    return { ok: true as const };
  },
});

export const deleteMyAccount = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const sess = await findSessionByRawToken(ctx, token);
    const userId = !sess || sess.expiresAt < Date.now() ? null : sess.userId;
    if (!userId) throw new Error("Session expired. Sign in again.");
    const uid = userId as string;

    const sessions = await ctx.db.query("sessions").collect();
    for (const s of sessions) {
      if ((s.userId as string) === uid) await ctx.db.delete(s._id);
    }

    const resets = await ctx.db.query("passwordResetTokens").collect();
    for (const r of resets) {
      if ((r.userId as string) === uid) await ctx.db.delete(r._id);
    }

    const txRows = await ctx.db.query("transactions").collect();
    for (const row of txRows) {
      if ((row as { userId?: string }).userId === uid) await ctx.db.delete(row._id);
    }

    const pref = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .unique();
    if (pref) await ctx.db.delete(pref._id);

    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .collect();
    for (const m of members) await ctx.db.delete(m._id);

    const owned = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", uid))
      .collect();
    for (const ws of owned) {
      const memberRows = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspace", (q) => q.eq("workspaceKey", ws.slug))
        .collect();
      for (const m of memberRows) await ctx.db.delete(m._id);
      await ctx.db.delete(ws._id);
    }

    await ctx.db.delete(userId);
    return { ok: true as const };
  },
});
