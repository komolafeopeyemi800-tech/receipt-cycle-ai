import { desc, eq } from "drizzle-orm";
import { adminAuditLogs, profile, user, whopEntitlements } from "../db/schema";
import type { Db } from "../types";
import { newId } from "./scope";

export type EntitlementStatus = "free" | "pro_monthly" | "pro_yearly" | "cancelling";

export function normalizeEmail(email: string | undefined | null): string | undefined {
  const e = email?.trim().toLowerCase();
  return e && e.includes("@") ? e : undefined;
}

async function latestEntitlement(db: Db, whopUserId: string | undefined, email: string | undefined) {
  if (whopUserId) {
    const bySub = await db
      .select()
      .from(whopEntitlements)
      .where(eq(whopEntitlements.whopUserId, whopUserId))
      .orderBy(desc(whopEntitlements.lastEventAt))
      .get();
    if (bySub) return bySub;
  }
  if (email) {
    return (
      (await db
        .select()
        .from(whopEntitlements)
        .where(eq(whopEntitlements.email, email))
        .orderBy(desc(whopEntitlements.lastEventAt))
        .get()) ?? null
    );
  }
  return null;
}

async function findUserIdForEntitlement(db: Db, whopUserId: string | undefined, email: string | undefined) {
  if (whopUserId) {
    const bySub = await db.select({ userId: profile.userId }).from(profile).where(eq(profile.whopSub, whopUserId)).get();
    if (bySub) return bySub.userId;
  }
  if (email) {
    const byEmail = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).get();
    if (byEmail) return byEmail.id;
  }
  return null;
}

/** Create a bare user + profile for a paying customer who has not signed up yet. */
async function createUserFromWebhook(
  db: Db,
  args: { email: string; whopUserId: string | undefined; proActive: boolean; plan: string },
) {
  const id = newId();
  const now = Date.now();
  await db.batch([
    db.insert(user).values({ id, email: args.email, name: "", emailVerified: false, createdAt: new Date(now), updatedAt: new Date(now) }),
    db.insert(profile).values({
      userId: id,
      whopSub: args.whopUserId ?? null,
      proSubscriptionActive: args.proActive,
      plan: args.plan,
    }),
  ]);
}

/** Persist the latest Whop entitlement snapshot and apply it to the matching user (port of upsertEntitlementFromWebhook). */
export async function upsertEntitlementFromWebhook(
  db: Db,
  args: {
    whopUserId?: string;
    email?: string;
    membershipId?: string;
    status: EntitlementStatus;
    proActive: boolean;
    paymentStatus?: string;
    source?: string;
    eventType: string;
  },
) {
  const whopUserId = args.whopUserId?.trim() || undefined;
  const email = normalizeEmail(args.email);
  if (!whopUserId && !email) return { ok: false as const, reason: "missing_identity" as const };

  const existing = await latestEntitlement(db, whopUserId, email);
  const now = Date.now();
  if (!existing) {
    await db.insert(whopEntitlements).values({
      id: newId(),
      whopUserId: whopUserId ?? null,
      email: email ?? null,
      membershipId: args.membershipId ?? null,
      subscriptionStatus: args.status,
      proActive: args.proActive,
      paymentStatus: args.paymentStatus ?? null,
      source: args.source ?? null,
      lastEventType: args.eventType,
      lastEventAt: now,
    });
  } else {
    await db
      .update(whopEntitlements)
      .set({
        whopUserId: whopUserId ?? existing.whopUserId,
        email: email ?? existing.email,
        membershipId: args.membershipId ?? existing.membershipId,
        subscriptionStatus: args.status,
        proActive: args.proActive,
        paymentStatus: args.paymentStatus ?? existing.paymentStatus,
        source: args.source ?? existing.source,
        lastEventType: args.eventType,
        lastEventAt: now,
      })
      .where(eq(whopEntitlements.id, existing.id));
  }

  let userId = await findUserIdForEntitlement(db, whopUserId, email);
  if (!userId && email) {
    await createUserFromWebhook(db, { email, whopUserId, proActive: args.proActive, plan: args.status });
    userId = await findUserIdForEntitlement(db, whopUserId, email);
  }
  if (userId) {
    const current = await db.select({ whopSub: profile.whopSub }).from(profile).where(eq(profile.userId, userId)).get();
    await db
      .insert(profile)
      .values({ userId, proSubscriptionActive: args.proActive, plan: args.status, whopSub: whopUserId ?? null })
      .onConflictDoUpdate({
        target: profile.userId,
        set: {
          proSubscriptionActive: args.proActive,
          plan: args.status,
          whopSub: whopUserId ?? current?.whopSub ?? null,
        },
      });
  }

  await db.insert(adminAuditLogs).values({
    id: newId(),
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
      appliedToUserId: userId,
    }),
    createdAt: now,
  });
  return { ok: true as const, appliedToUserId: userId };
}

/** Apply any stored entitlement to a user after sign-in (port of reconcileEntitlementForUser). */
export async function reconcileEntitlementForUser(db: Db, userId: string) {
  const row = await db
    .select({ email: user.email, whopSub: profile.whopSub })
    .from(user)
    .leftJoin(profile, eq(profile.userId, user.id))
    .where(eq(user.id, userId))
    .get();
  if (!row) return { ok: false as const };
  const ent = await latestEntitlement(db, row.whopSub ?? undefined, normalizeEmail(row.email));
  if (!ent) return { ok: true as const, applied: false as const };
  await db
    .insert(profile)
    .values({
      userId,
      proSubscriptionActive: ent.proActive,
      plan: ent.subscriptionStatus,
      whopSub: row.whopSub ?? ent.whopUserId ?? null,
    })
    .onConflictDoUpdate({
      target: profile.userId,
      set: {
        proSubscriptionActive: ent.proActive,
        plan: ent.subscriptionStatus,
        whopSub: row.whopSub ?? ent.whopUserId ?? null,
      },
    });
  return { ok: true as const, applied: true as const };
}
