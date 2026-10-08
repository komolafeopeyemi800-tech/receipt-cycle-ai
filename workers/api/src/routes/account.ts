import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { profile, transactions, userPreferences } from "../db/schema";
import { reconcileEntitlementForUser } from "../lib/entitlements";
import { parseBody } from "../lib/http";
import {
  TRIAL_MAX_TRANSACTIONS,
  computeSubscriptionState,
  subscriptionPayload,
} from "../lib/subscription";
import { requireUser } from "../middleware/auth";
import type { AppEnv } from "../types";

// ---------------------------------------------------------------------------
// Preferences (GET/PUT /api/preferences)
// ---------------------------------------------------------------------------

const prefsBody = z.object({
  currency: z.string().min(1),
  dateFormat: z.enum(["iso", "us", "eu"]),
  merchants: z.array(z.string()),
  locations: z.array(z.object({ id: z.string(), label: z.string(), address: z.string() })),
  reimbursements: z.boolean().nullish(),
  txnNumber: z.boolean().nullish(),
  scanPayment: z.boolean().nullish(),
  requirePay: z.boolean().nullish(),
  requireNotes: z.boolean().nullish(),
  voiceInputLanguage: z.string().nullish(),
});

export const preferenceRoutes = new Hono<AppEnv>();
preferenceRoutes.use("*", requireUser);

preferenceRoutes.get("/", async (c) => {
  const row = await c
    .get("db")
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, c.get("user").id))
    .get();
  return c.json(row ?? null);
});

preferenceRoutes.put("/", async (c) => {
  const userId = c.get("user").id;
  const body = await parseBody(c, prefsBody);
  const values = {
    userId,
    currency: body.currency,
    dateFormat: body.dateFormat,
    merchants: body.merchants,
    locations: body.locations,
    reimbursements: body.reimbursements ?? null,
    txnNumber: body.txnNumber ?? null,
    scanPayment: body.scanPayment ?? null,
    requirePay: body.requirePay ?? null,
    requireNotes: body.requireNotes ?? null,
    voiceInputLanguage: body.voiceInputLanguage ?? null,
  };
  await c
    .get("db")
    .insert(userPreferences)
    .values(values)
    .onConflictDoUpdate({ target: userPreferences.userId, set: values });
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Subscription (GET /api/subscription, POST /api/subscription/bootstrap)
// ---------------------------------------------------------------------------

export const subscriptionRoutes = new Hono<AppEnv>();
subscriptionRoutes.use("*", requireUser);

subscriptionRoutes.get("/", async (c) => {
  const u = c.get("user");
  const st = computeSubscriptionState(
    {
      createdAt: u.createdAt,
      proSubscriptionActive: u.profile.proSubscriptionActive,
      trialStartedAt: u.profile.trialStartedAt,
      trialLifetimeAdds: u.profile.trialLifetimeAdds,
    },
    Date.now(),
  );
  return c.json(subscriptionPayload(u.id, st));
});

/**
 * Called after sign-in or checkout return: applies any stored billing entitlement, then for non-Pro
 * users backfills the trial counters (port of bootstrapSubscription).
 */
subscriptionRoutes.post("/bootstrap", async (c) => {
  const db = c.get("db");
  const u = c.get("user");
  await reconcileEntitlementForUser(db, u.id);

  const p = await db.select().from(profile).where(eq(profile.userId, u.id)).get();
  if (!p) return c.json({ ok: false });
  if (p.proSubscriptionActive) return c.json({ ok: true });

  const patch: { trialLifetimeAdds?: number; trialStartedAt?: number } = {};
  if (p.trialLifetimeAdds == null) {
    const counted = await db
      .select({ n: sql<number>`count(*)` })
      .from(transactions)
      .where(eq(transactions.userId, u.id))
      .get();
    patch.trialLifetimeAdds = Math.min(counted?.n ?? 0, TRIAL_MAX_TRANSACTIONS);
  }
  if (p.trialStartedAt == null) patch.trialStartedAt = u.createdAt;
  if (Object.keys(patch).length > 0) {
    await db
      .update(profile)
      .set(patch)
      .where(and(eq(profile.userId, u.id), eq(profile.proSubscriptionActive, false)));
  }
  return c.json({ ok: true });
});
