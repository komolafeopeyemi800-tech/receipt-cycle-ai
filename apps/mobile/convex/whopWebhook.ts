import bcrypt from "bcryptjs";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { internalMutation } from "./_generated/server";

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Create or patch a `users` row from webhook identity (single mutation — avoids nested `runMutation`).
 */
async function ensureUserRowFromWebhook(
  ctx: MutationCtx,
  args: { email: string; whopUserId: string | undefined; proActive: boolean; plan: string },
): Promise<void> {
  const email = args.email.trim().toLowerCase();
  const { whopUserId, proActive, plan } = args;

  const byEmail = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .unique();
  if (byEmail) {
    await ctx.db.patch(byEmail._id, {
      proSubscriptionActive: proActive,
      plan,
      ...(whopUserId && (!byEmail.whopSub || byEmail.whopSub === whopUserId) ? { whopSub: whopUserId } : {}),
    });
    return;
  }

  if (whopUserId) {
    const bySub = await ctx.db
      .query("users")
      .withIndex("by_whop_sub", (q) => q.eq("whopSub", whopUserId))
      .unique();
    if (bySub) {
      await ctx.db.patch(bySub._id, { proSubscriptionActive: proActive, plan });
      return;
    }
  }

  const passwordHash = await bcrypt.hash(randomHex(32), 10);
  await ctx.db.insert("users", {
    email,
    passwordHash,
    whopSub: whopUserId,
    proSubscriptionActive: proActive,
    plan,
  });
}

const entitlementStatus = v.union(
  v.literal("free"),
  v.literal("pro_monthly"),
  v.literal("pro_yearly"),
  v.literal("cancelling"),
);

function normalizeEmail(email: string | undefined): string | undefined {
  const e = email?.trim().toLowerCase();
  return e && e.includes("@") ? e : undefined;
}

async function latestEntitlementByWhopUserId(
  ctx: Parameters<typeof upsertEntitlementFromWebhook.handler>[0],
  whopUserId: string,
) {
  const rows = await ctx.db
    .query("whopEntitlements")
    .withIndex("by_whop_user", (q) => q.eq("whopUserId", whopUserId))
    .collect();
  if (rows.length === 0) return null;
  return rows.sort((a, b) => (b.lastEventAt ?? 0) - (a.lastEventAt ?? 0))[0] ?? null;
}

async function latestEntitlementByEmail(
  ctx: Parameters<typeof upsertEntitlementFromWebhook.handler>[0],
  email: string,
) {
  const rows = await ctx.db
    .query("whopEntitlements")
    .withIndex("by_email", (q) => q.eq("email", email))
    .collect();
  if (rows.length === 0) return null;
  return rows.sort((a, b) => (b.lastEventAt ?? 0) - (a.lastEventAt ?? 0))[0] ?? null;
}

async function findUserForEntitlement(
  ctx: Parameters<typeof upsertEntitlementFromWebhook.handler>[0],
  whopUserId: string | undefined,
  email: string | undefined,
) {
  if (whopUserId) {
    const bySub = await ctx.db
      .query("users")
      .withIndex("by_whop_sub", (q) => q.eq("whopSub", whopUserId))
      .unique();
    if (bySub) return bySub;
  }
  if (email) {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
  }
  return null;
}

/** Persist latest entitlement snapshot and apply it to a matching user when possible. */
export const upsertEntitlementFromWebhook = internalMutation({
  args: {
    whopUserId: v.optional(v.string()),
    email: v.optional(v.string()),
    membershipId: v.optional(v.string()),
    status: entitlementStatus,
    proActive: v.boolean(),
    paymentStatus: v.optional(v.string()),
    source: v.optional(v.string()),
    eventType: v.string(),
  },
  handler: async (ctx, args) => {
    const whopUserId = args.whopUserId?.trim() || undefined;
    const email = normalizeEmail(args.email);
    if (!whopUserId && !email) return { ok: false as const, reason: "missing_identity" as const };

    let entitlement = (whopUserId ? await latestEntitlementByWhopUserId(ctx, whopUserId) : null) ?? (email ? await latestEntitlementByEmail(ctx, email) : null);

    const now = Date.now();
    if (!entitlement) {
      const id = await ctx.db.insert("whopEntitlements", {
        whopUserId,
        email,
        membershipId: args.membershipId,
        subscriptionStatus: args.status,
        proActive: args.proActive,
        paymentStatus: args.paymentStatus,
        source: args.source,
        lastEventType: args.eventType,
        lastEventAt: now,
      });
      entitlement = await ctx.db.get(id);
    } else {
      await ctx.db.patch(entitlement._id, {
        whopUserId: whopUserId ?? entitlement.whopUserId,
        email: email ?? entitlement.email,
        membershipId: args.membershipId ?? entitlement.membershipId,
        subscriptionStatus: args.status,
        proActive: args.proActive,
        paymentStatus: args.paymentStatus ?? entitlement.paymentStatus,
        source: args.source ?? entitlement.source,
        lastEventType: args.eventType,
        lastEventAt: now,
      });
      entitlement = await ctx.db.get(entitlement._id);
    }

    let user = await findUserForEntitlement(ctx, whopUserId, email);
    if (!user && email) {
      await ensureUserRowFromWebhook(ctx, {
        email,
        whopUserId,
        proActive: args.proActive,
        plan: args.status,
      });
      user = await findUserForEntitlement(ctx, whopUserId, email);
    }
    if (user) {
      await ctx.db.patch(user._id, {
        proSubscriptionActive: args.proActive,
        plan: args.status,
        whopSub: whopUserId ?? user.whopSub,
      });
    }

    await ctx.db.insert("adminAuditLogs", {
      action: "whop.webhook_sync",
      actor: "whop_webhook",
      details: JSON.stringify({
        eventType: args.eventType,
        whopUserId: whopUserId ?? null,
        email: email ?? null,
        membershipId: args.membershipId ?? null,
        status: args.status,
        proActive: args.proActive,
        paymentStatus: args.paymentStatus ?? null,
        source: args.source ?? null,
        appliedToUserId: user?._id ?? null,
      }),
      createdAt: now,
    });
    return { ok: true as const, appliedToUserId: user?._id ?? null, entitlementId: entitlement?._id ?? null };
  },
});

/** Called after sign-in/sign-up to apply any existing Whop entitlement captured by webhook. */
export const reconcileEntitlementForUser = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return { ok: false as const };

    const email = normalizeEmail(user.email);
    const bySub = user.whopSub ? await latestEntitlementByWhopUserId(ctx, user.whopSub) : null;
    const byEmail = email ? await latestEntitlementByEmail(ctx, email) : null;
    const ent = bySub ?? byEmail;
    if (!ent) return { ok: true as const, applied: false as const };

    await ctx.db.patch(user._id, {
      proSubscriptionActive: ent.proActive,
      plan: ent.subscriptionStatus,
      whopSub: user.whopSub ?? ent.whopUserId,
    });
    return { ok: true as const, applied: true as const };
  },
});
