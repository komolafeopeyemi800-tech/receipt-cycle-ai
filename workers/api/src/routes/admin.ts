import { mailEnabled } from "../lib/mailer";
import { desc, eq, gte, sql } from "drizzle-orm";
import { type Context, Hono } from "hono";
import { z } from "zod";
import { checkProviders } from "../ai/health";
import { adminAuditLogs, appConfig, profile, session, transactions, user } from "../db/schema";
import { ApiError } from "../lib/errors";
import { parseBody } from "../lib/http";
import { newId } from "../lib/scope";
import { parseEmailList } from "../lib/subscription";
import { requireUser } from "../middleware/auth";
import type { AppEnv, Db, Env } from "../types";

const DAY = 24 * 60 * 60 * 1000;

function sanitizeLimit(n: number | null | undefined, fallback: number) {
  if (!Number.isFinite(n ?? Number.NaN)) return fallback;
  return Math.max(0, Math.min(5000, Math.floor(n as number)));
}

/** Emails allowed into the admin dashboard: env list plus the lifetime-pro list (same as Convex). */
export function allowedAdminEmails(env: Env): string[] {
  const out = parseEmailList(env.ADMIN_DASHBOARD_ADMIN_EMAILS);
  for (const e of ["owner@example.com", ...parseEmailList(env.LIFETIME_PRO_EMAILS)]) {
    if (!out.includes(e)) out.push(e);
  }
  return out;
}

export function toPublicConfig(row: typeof appConfig.$inferSelect | undefined) {
  return {
    maintenanceMode: row?.maintenanceMode ?? false,
    scannerEnabled: row?.scannerEnabled ?? true,
    uploadEnabled: row?.uploadEnabled ?? true,
    manualAddEnabled: row?.manualAddEnabled ?? true,
    exportEnabled: row?.exportEnabled ?? true,
    webDashboardEnabled: row?.webDashboardEnabled ?? true,
    webTransactionsEnabled: row?.webTransactionsEnabled ?? true,
    webUploadEnabled: row?.webUploadEnabled ?? true,
    webSettingsEnabled: row?.webSettingsEnabled ?? true,
    mobileScanPageEnabled: row?.mobileScanPageEnabled ?? true,
    mobileUploadPageEnabled: row?.mobileUploadPageEnabled ?? true,
    mobileAddPageEnabled: row?.mobileAddPageEnabled ?? true,
    adminManagedPreferences: row?.adminManagedPreferences ?? false,
    prefReimbursements: row?.prefReimbursements ?? null,
    prefTxnNumber: row?.prefTxnNumber ?? null,
    prefScanPayment: row?.prefScanPayment ?? null,
    prefRequirePay: row?.prefRequirePay ?? null,
    prefRequireNotes: row?.prefRequireNotes ?? null,
    freeCameraLimit: sanitizeLimit(row?.freeCameraLimit, 20),
    freeUploadLimit: sanitizeLimit(row?.freeUploadLimit, 20),
    freeManualLimit: sanitizeLimit(row?.freeManualLimit, 60),
    updatedAt: row?.updatedAt ?? null,
    updatedBy: row?.updatedBy ?? null,
  };
}

async function audit(db: Db, action: string, actor: string, details: unknown) {
  await db.insert(adminAuditLogs).values({
    id: newId(),
    action,
    actor,
    details: JSON.stringify(details),
    createdAt: Date.now(),
  });
}

/** Public: feature switches the clients read on startup (was `admin.publicConfig`). */
export const configRoutes = new Hono<AppEnv>();
configRoutes.get("/", async (c) => {
  const row = await c.get("db").select().from(appConfig).where(eq(appConfig.key, "global")).get();
  return c.json({ ...toPublicConfig(row), passwordAuthEnabled: c.env.PASSWORD_AUTH_ENABLED === "true",
    // Codes can only be delivered when an email key is configured; apps hide the code form otherwise.
    emailCodesEnabled: mailEnabled(c.env),
  });
});

/** True for the signed-in user when their email is on the admin allowlist (was `isCurrentUserAdmin`). */
configRoutes.get("/is-admin", requireUser, async (c) =>
  c.json(allowedAdminEmails(c.env).includes(c.get("user").email.trim().toLowerCase())),
);

/**
 * Admin routes need BOTH a signed-in allowlisted email and the shared dashboard secret in the
 * `x-admin-secret` header. (Convex trusted a typed-in email plus the secret; the email now comes
 * from the session instead.)
 */
async function requireAdmin(c: Context<AppEnv>): Promise<string> {
  const expected = c.env.ADMIN_DASHBOARD_SECRET?.trim();
  if (!expected) throw new ApiError(503, "ADMIN_DASHBOARD_SECRET is not configured on this deployment.");
  if (c.req.header("x-admin-secret") !== expected) throw new ApiError(403, "Unauthorized admin access.");
  const email = c.get("user").email.trim().toLowerCase();
  if (!allowedAdminEmails(c.env).includes(email)) {
    throw new ApiError(403, "This account is not allowed to access admin dashboard.");
  }
  return email;
}

export const adminRoutes = new Hono<AppEnv>();
adminRoutes.use("*", requireUser);

adminRoutes.get("/validate", async (c) => {
  await requireAdmin(c);
  return c.json({ ok: true });
});

adminRoutes.get("/config", async (c) => {
  await requireAdmin(c);
  const row = await c.get("db").select().from(appConfig).where(eq(appConfig.key, "global")).get();
  return c.json(toPublicConfig(row));
});

const configBody = z
  .object({
    maintenanceMode: z.boolean(),
    scannerEnabled: z.boolean(),
    uploadEnabled: z.boolean(),
    manualAddEnabled: z.boolean(),
    exportEnabled: z.boolean(),
    webDashboardEnabled: z.boolean(),
    webTransactionsEnabled: z.boolean(),
    webUploadEnabled: z.boolean(),
    webSettingsEnabled: z.boolean(),
    mobileScanPageEnabled: z.boolean(),
    mobileUploadPageEnabled: z.boolean(),
    mobileAddPageEnabled: z.boolean(),
    adminManagedPreferences: z.boolean(),
    prefReimbursements: z.boolean(),
    prefTxnNumber: z.boolean(),
    prefScanPayment: z.boolean(),
    prefRequirePay: z.boolean(),
    prefRequireNotes: z.boolean(),
    freeCameraLimit: z.number(),
    freeUploadLimit: z.number(),
    freeManualLimit: z.number(),
  })
  .partial();

adminRoutes.put("/config", async (c) => {
  const db = c.get("db");
  const actor = await requireAdmin(c);
  const body = await parseBody(c, configBody);
  const patch: Record<string, unknown> = { ...body, updatedAt: Date.now(), updatedBy: actor };
  if (body.freeCameraLimit !== undefined) patch.freeCameraLimit = sanitizeLimit(body.freeCameraLimit, 20);
  if (body.freeUploadLimit !== undefined) patch.freeUploadLimit = sanitizeLimit(body.freeUploadLimit, 20);
  if (body.freeManualLimit !== undefined) patch.freeManualLimit = sanitizeLimit(body.freeManualLimit, 60);
  await db
    .insert(appConfig)
    .values({ key: "global", ...patch })
    .onConflictDoUpdate({ target: appConfig.key, set: patch });
  await audit(db, "config.update", actor, patch);
  return c.json({ ok: true });
});

adminRoutes.get("/stats", async (c) => {
  await requireAdmin(c);
  const db = c.get("db");
  const now = Date.now();
  const d30 = now - 30 * DAY;
  const d60 = now - 60 * DAY;
  const count = async (q: Promise<{ n: number } | undefined>) => (await q)?.n ?? 0;

  const usersTotal = await count(db.select({ n: sql<number>`count(*)` }).from(user).get());
  const txTotal = await count(db.select({ n: sql<number>`count(*)` }).from(transactions).get());
  const billingUsers = await count(
    db.select({ n: sql<number>`count(*)` }).from(profile).where(sql`coalesce(trim(${profile.polarCustomerId}), '') <> ''`).get(),
  );
  const inRange = (col: Parameters<typeof gte>[0], from: number, to: number) =>
    sql`${col} >= ${from} and ${col} < ${to}`;
  const users30 = await count(db.select({ n: sql<number>`count(*)` }).from(user).where(inRange(user.createdAt, d30, now + 1)).get());
  const usersPrev30 = await count(db.select({ n: sql<number>`count(*)` }).from(user).where(inRange(user.createdAt, d60, d30)).get());
  const tx30 = await count(db.select({ n: sql<number>`count(*)` }).from(transactions).where(inRange(transactions.createdAt, d30, now + 1)).get());
  const txPrev30 = await count(db.select({ n: sql<number>`count(*)` }).from(transactions).where(inRange(transactions.createdAt, d60, d30)).get());
  const active30 = await count(
    db.select({ n: sql<number>`count(distinct ${session.userId})` }).from(session).where(inRange(session.expiresAt, d30, now + 400 * DAY)).get(),
  );
  const activePrev30 = await count(
    db.select({ n: sql<number>`count(distinct ${session.userId})` }).from(session).where(inRange(session.expiresAt, d60, d30)).get(),
  );
  const pct = (cur: number, prev: number) => (prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100));

  const monthly: { month: string; users: number; transactions: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setUTCMonth(d.getUTCMonth() - i, 1);
    d.setUTCHours(0, 0, 0, 0);
    const start = d.getTime();
    const endDate = new Date(d);
    endDate.setUTCMonth(endDate.getUTCMonth() + 1, 1);
    const end = endDate.getTime();
    monthly.push({
      month: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      users: await count(db.select({ n: sql<number>`count(*)` }).from(user).where(inRange(user.createdAt, start, end)).get()),
      transactions: await count(
        db.select({ n: sql<number>`count(*)` }).from(transactions).where(inRange(transactions.createdAt, start, end)).get(),
      ),
    });
  }

  return c.json({
    totals: { users: usersTotal, transactions: txTotal, billingUsers },
    growth: {
      users30,
      usersPrev30,
      userGrowthPct: pct(users30, usersPrev30),
      activeUsers30: active30,
      activeUsersPrev30: activePrev30,
      activeGrowthPct: pct(active30, activePrev30),
      tx30,
      txPrev30,
      txGrowthPct: pct(tx30, txPrev30),
    },
    monthly,
  });
});

adminRoutes.get("/users", async (c) => {
  await requireAdmin(c);
  const db = c.get("db");
  const lim = Math.max(1, Math.min(2000, Math.floor(Number(c.req.query("limit") ?? 50)) || 50));
  const now = Date.now();
  const rows = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      googleSub: profile.googleSub,
      polarCustomerId: profile.polarCustomerId,
      plan: profile.plan,
      pro: profile.proSubscriptionActive,
      status: profile.status,
      role: profile.role,
      liveSessions: sql<number>`(select count(*) from ${session} where ${session.userId} = ${user.id} and ${session.expiresAt} > ${now})`,
    })
    .from(user)
    .leftJoin(profile, eq(profile.userId, user.id))
    .orderBy(desc(user.createdAt))
    .limit(lim);
  return c.json(
    rows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name || null,
      createdAt: u.createdAt.getTime(),
      googleLinked: Boolean(u.googleSub),
      billingLinked: Boolean(u.polarCustomerId?.trim()),
      plan: u.plan ?? (u.pro ? "pro" : "free"),
      proSubscriptionActive: u.pro === true,
      status: u.status ?? "active",
      role: u.role ?? "user",
      concurrentJobs: u.liveSessions ?? 0,
    })),
  );
});

adminRoutes.patch("/users/:id", async (c) => {
  const db = c.get("db");
  const actor = await requireAdmin(c);
  const body = await parseBody(
    c,
    z.object({
      name: z.string().optional(),
      role: z.string().optional(),
      status: z.string().optional(),
      plan: z.string().optional(),
      proSubscriptionActive: z.boolean().optional(),
    }),
  );
  const id = c.req.param("id");
  const exists = await db.select({ id: user.id }).from(user).where(eq(user.id, id)).get();
  if (!exists) throw new ApiError(404, "User not found.");

  const profilePatch: Partial<typeof profile.$inferInsert> = {};
  if (body.role !== undefined) profilePatch.role = body.role.trim().toLowerCase() || "user";
  if (body.status !== undefined) profilePatch.status = body.status.trim().toLowerCase() || "active";
  if (body.plan !== undefined) {
    const plan = body.plan.trim().toLowerCase() || "free";
    profilePatch.plan = plan;
    if (body.proSubscriptionActive === undefined) profilePatch.proSubscriptionActive = plan !== "free";
  }
  if (body.proSubscriptionActive !== undefined) {
    profilePatch.proSubscriptionActive = body.proSubscriptionActive;
    if (body.plan === undefined) profilePatch.plan = body.proSubscriptionActive ? "pro" : "free";
  }
  const stmts = [];
  if (body.name !== undefined) {
    stmts.push(db.update(user).set({ name: body.name.trim(), updatedAt: new Date() }).where(eq(user.id, id)));
  }
  if (Object.keys(profilePatch).length > 0) {
    stmts.push(
      db.insert(profile).values({ userId: id, ...profilePatch }).onConflictDoUpdate({ target: profile.userId, set: profilePatch }),
    );
  }
  if (stmts.length > 0) await db.batch(stmts as [(typeof stmts)[number], ...(typeof stmts)[number][]]);
  await audit(db, "user.update", actor, { userId: id, patch: { ...body } });
  return c.json({ ok: true });
});

/** Deletes the user; foreign keys cascade to sessions, profile, transactions, preferences and memberships. */
adminRoutes.delete("/users/:id", async (c) => {
  const db = c.get("db");
  const actor = await requireAdmin(c);
  const id = c.req.param("id");
  const row = await db.select({ email: user.email }).from(user).where(eq(user.id, id)).get();
  if (!row) throw new ApiError(404, "User not found.");
  await db.delete(user).where(eq(user.id, id));
  await audit(db, "user.delete", actor, { userId: id, email: row.email.toLowerCase() });
  return c.json({ ok: true });
});

adminRoutes.get("/audit-logs", async (c) => {
  await requireAdmin(c);
  const lim = Math.max(1, Math.min(200, Math.floor(Number(c.req.query("limit") ?? 80)) || 80));
  const logs = await c.get("db").select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(lim);
  return c.json(logs);
});

adminRoutes.get("/system-health", async (c) => {
  await requireAdmin(c);
  return c.json({ timestamp: Date.now(), ocr: await checkProviders(c.env), runtime: {} });
});
