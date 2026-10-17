import { desc, eq, gt, gte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { aiCallLog, aiLockouts, aiSpend, appConfig, user } from "../db/schema";
import { aiStatus } from "../lib/aiBudget";
import { getRuntimeConfig } from "../lib/config";
import { parseBody } from "../lib/http";
import { requireUser } from "../middleware/auth";
import type { AppEnv, Db } from "../types";
import { audit, requireAdmin } from "./admin";

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.floor(n)));

async function settingsOf(db: Db) {
  const c = await getRuntimeConfig(db);
  return { dailyBudgetCents: c.aiDailyBudgetCents, monthlyBudgetCents: c.aiMonthlyBudgetCents, burstCalls: c.aiBurstCalls, enabled: c.aiGuardEnabled };
}

async function topSpenders(db: Db, since: string) {
  const rows = await db
    .select({ userId: aiSpend.userId, email: user.email, micros: sql<number>`sum(${aiSpend.micros})`, calls: sql<number>`sum(${aiSpend.calls})` })
    .from(aiSpend)
    .leftJoin(user, eq(user.id, aiSpend.userId))
    .where(gte(aiSpend.day, since))
    .groupBy(aiSpend.userId)
    .orderBy(desc(sql`sum(${aiSpend.micros})`))
    .limit(15);
  return rows.map((r) => ({ userId: r.userId, email: r.email ?? null, micros: Number(r.micros), calls: Number(r.calls) }));
}

/** Mounted at /api/admin/ai-guard. Same rules as the rest of the admin API: signed in, allowlisted email and the dashboard secret. */
export const aiGuardAdminRoutes = new Hono<AppEnv>();
aiGuardAdminRoutes.use("*", requireUser);

aiGuardAdminRoutes.get("/", async (c) => {
  await requireAdmin(c);
  const db = c.get("db");
  const now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10);
  const month = `${today.slice(0, 7)}-01`;
  const locks = await db
    .select({ userId: aiLockouts.userId, email: user.email, lockedUntil: aiLockouts.lockedUntil, reason: aiLockouts.reason, strikes: aiLockouts.strikes })
    .from(aiLockouts)
    .leftJoin(user, eq(user.id, aiLockouts.userId))
    .where(gt(aiLockouts.lockedUntil, now))
    .orderBy(desc(aiLockouts.lockedUntil));
  const sums = async (u: string) => {
    const t = await db.select({ m: sql<number>`coalesce(sum(case when ${aiSpend.day} = ${today} then ${aiSpend.micros} else 0 end), 0)`, mo: sql<number>`coalesce(sum(${aiSpend.micros}), 0)` }).from(aiSpend).where(sql`${aiSpend.userId} = ${u} and ${aiSpend.day} >= ${month}`).get();
    return { spentTodayMicros: Number(t?.m ?? 0), spentMonthMicros: Number(t?.mo ?? 0) };
  };
  const lockedUsers = [];
  for (const l of locks) lockedUsers.push({ ...l, email: l.email ?? null, ...(await sums(l.userId)) });
  return c.json({ settings: await settingsOf(db), lockedUsers, topToday: await topSpenders(db, today), topMonth: await topSpenders(db, month), now });
});

const settingsBody = z.object({
  dailyBudgetCents: z.number().finite(),
  monthlyBudgetCents: z.number().finite(),
  burstCalls: z.number().finite(),
  enabled: z.boolean(),
}).partial();

aiGuardAdminRoutes.put("/settings", async (c) => {
  const db = c.get("db");
  const actor = await requireAdmin(c);
  const body = await parseBody(c, settingsBody);
  const patch: Record<string, unknown> = { updatedAt: Date.now(), updatedBy: actor };
  if (body.dailyBudgetCents !== undefined) patch.aiDailyBudgetCents = clamp(body.dailyBudgetCents, 1, 10_000);
  if (body.monthlyBudgetCents !== undefined) patch.aiMonthlyBudgetCents = clamp(body.monthlyBudgetCents, 1, 100_000);
  if (body.burstCalls !== undefined) patch.aiBurstCalls = clamp(body.burstCalls, 1, 500);
  if (body.enabled !== undefined) patch.aiGuardEnabled = body.enabled;
  await db.insert(appConfig).values({ key: "global", ...patch }).onConflictDoUpdate({ target: appConfig.key, set: patch });
  await audit(db, "ai-guard.settings", actor, patch);
  return c.json({ ok: true, settings: await settingsOf(db) });
});

aiGuardAdminRoutes.post("/unlock", async (c) => {
  const db = c.get("db");
  const actor = await requireAdmin(c);
  const { userId } = await parseBody(c, z.object({ userId: z.string().min(1).max(100) }));
  const now = Date.now();
  const row = await db.select().from(aiLockouts).where(eq(aiLockouts.userId, userId)).get();
  if (row) {
    // Lift the pause and take back this strike, so the next real offence is not punished twice.
    if (row.strikes <= 1) await db.delete(aiLockouts).where(eq(aiLockouts.userId, userId));
    else await db.update(aiLockouts).set({ lockedUntil: 0, strikes: row.strikes - 1 }).where(eq(aiLockouts.userId, userId));
    // Otherwise the same burst or daily total would lock them again on their next call.
    await db.delete(aiCallLog).where(eq(aiCallLog.userId, userId));
    if (row.reason.startsWith("daily")) await db.update(aiSpend).set({ micros: 0 }).where(sql`${aiSpend.userId} = ${userId} and ${aiSpend.day} = ${new Date(now).toISOString().slice(0, 10)}`);
  }
  await audit(db, "ai-guard.unlock", actor, { userId, hadLock: Boolean(row), reason: row?.reason ?? null });
  return c.json({ ok: true, unlocked: Boolean(row) });
});

/** GET /api/me/ai-status: lets the apps show a small "smart features are paused" note. Never blocks anything. */
export const aiStatusRoutes = new Hono<AppEnv>();
aiStatusRoutes.use("*", requireUser);
aiStatusRoutes.get("/", async (c) => c.json(await aiStatus(c.get("db"), c.get("user").id)));
