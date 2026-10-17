import { and, eq, gte, lt, sql } from "drizzle-orm";
import { aiCallLog, aiLockouts, aiSpend } from "../db/schema";
import type { Db, Env } from "../types";
import { getRuntimeConfig } from "./config";
import { ApiError } from "./errors";

/**
 * Cost guard for the paid AI features. Every paid call is estimated in micro-dollars (1 USD = 1,000,000) and added to the
 * person's spend for the UTC day and month. A person who runs far above heavy-user levels, or fires paid calls back to back
 * like a bot, has the paid AI features paused for 24 hours (72 hours, then 7 days on repeats). Manual entry, CSV import,
 * exports and every other non-AI route are never touched. The per-feature daily counts (dailyLimit.ts) still apply as before.
 */

export type AiKind = "scan" | "voice" | "upload" | "assistant" | "document" | "extract";

/** The one place that says what each paid call costs us (micro-dollars). */
export const AI_COST_MICROS = {
  scan: 10_000, // receipt photo (measured 0.004-0.01 USD)
  voice: 3_000, // voice entry (about 0.002 USD)
  assistant: 3_000,
  extract: 3_000, // text extraction / column mapping
  upload: 3_000,
  azurePage: 10_000, // Azure document intelligence, per page and per pass
} as const;

export const BURST_WINDOW_MS = 10 * 60 * 1000;
const HOUR = 3_600_000;
const STRIKE_MEMORY_MS = 30 * 24 * HOUR;
const LOCK_HOURS = [24, 72, 168];
/** Text extraction and column mapping come in many small pieces for one big statement, so they cost but do not count as a burst. */
const NOT_A_BURST: AiKind[] = ["extract"];

export const lockedMessage = (hours: number) =>
  `You have reached the limit for smart features (scanning, voice and document reading) for now. They will be available again in about ${hours} hours. You can still add transactions manually.`;

export const hoursLeft = (until: number, now: number) => Math.max(1, Math.ceil((until - now) / HOUR));

/** Cost of an Azure read: pages billed x passes (a statement scan that falls back to a second model bills twice). */
export const azureCostMicros = (pages: number, passes = 1) => Math.max(1, Math.floor(pages)) * Math.max(1, passes) * AI_COST_MICROS.azurePage;

export type AiUser = { id: string };
export type GuardResult = { ok: true } | { ok: false; message: string; lockedUntil: number; hours: number };

const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);
const monthStart = (t: number) => `${new Date(t).toISOString().slice(0, 7)}-01`;

export async function activeLock(db: Db, userId: string, now = Date.now()) {
  const row = await db.select().from(aiLockouts).where(eq(aiLockouts.userId, userId)).get();
  return row && row.lockedUntil > now ? row : null;
}

async function lockUser(db: Db, userId: string, reason: string, now: number): Promise<number> {
  const prev = await db.select().from(aiLockouts).where(eq(aiLockouts.userId, userId)).get();
  const strikes = prev && now - prev.lastStrikeAt < STRIKE_MEMORY_MS ? prev.strikes + 1 : 1;
  const until = now + LOCK_HOURS[Math.min(strikes, LOCK_HOURS.length) - 1]! * HOUR;
  const values = { lockedUntil: until, reason, strikes, lastStrikeAt: now };
  await db.insert(aiLockouts).values({ userId, createdAt: now, ...values }).onConflictDoUpdate({ target: aiLockouts.userId, set: values });
  return until;
}

async function addSpend(db: Db, userId: string, micros: number, now: number, calls: number) {
  const day = dayKey(now);
  await db
    .insert(aiSpend)
    .values({ userId, day, micros: Math.max(0, micros), calls })
    .onConflictDoUpdate({
      target: [aiSpend.userId, aiSpend.day],
      set: { micros: sql`max(0, ${aiSpend.micros} + ${micros})`, calls: sql`${aiSpend.calls} + ${calls}` },
    });
}

export async function spendToday(db: Db, userId: string, now = Date.now()): Promise<number> {
  const r = await db.select({ m: aiSpend.micros }).from(aiSpend).where(and(eq(aiSpend.userId, userId), eq(aiSpend.day, dayKey(now)))).get();
  return r?.m ?? 0;
}

export async function spendThisMonth(db: Db, userId: string, now = Date.now()): Promise<number> {
  const r = await db
    .select({ m: sql<number>`coalesce(sum(${aiSpend.micros}), 0)` })
    .from(aiSpend)
    .where(and(eq(aiSpend.userId, userId), gte(aiSpend.day, monthStart(now)), lt(aiSpend.day, `${dayKey(now)}~`)))
    .get();
  return Number(r?.m ?? 0);
}

/**
 * Call before every paid AI request. Refuses (and, when a rule trips, locks) or records the estimated cost and lets it through.
 * Never throws for a normal refusal: callers turn `message` into their own refusal shape.
 */
export async function guardAi(db: Db, _env: Env | undefined, user: AiUser, kind: AiKind, estimatedCostMicros: number, now = Date.now()): Promise<GuardResult> {
  const cfg = await getRuntimeConfig(db);
  if (!cfg.aiGuardEnabled) return { ok: true };
  const refuse = (until: number): GuardResult => {
    const hours = hoursLeft(until, now);
    return { ok: false, message: lockedMessage(hours), lockedUntil: until, hours };
  };

  const lock = await activeLock(db, user.id, now);
  if (lock) return refuse(lock.lockedUntil);

  const cost = Math.max(0, Math.floor(estimatedCostMicros));
  const countsAsBurst = !NOT_A_BURST.includes(kind);
  if (countsAsBurst) {
    const recent = await db
      .select({ n: sql<number>`count(*)` })
      .from(aiCallLog)
      .where(and(eq(aiCallLog.userId, user.id), gte(aiCallLog.at, now - BURST_WINDOW_MS)))
      .get();
    if (Number(recent?.n ?? 0) + 1 > cfg.aiBurstCalls) return refuse(await lockUser(db, user.id, `burst: more than ${cfg.aiBurstCalls} paid AI calls in 10 minutes`, now));
  }
  const day = (await spendToday(db, user.id, now)) + cost;
  if (day > cfg.aiDailyBudgetCents * 10_000) return refuse(await lockUser(db, user.id, `daily budget: about $${(day / 1e6).toFixed(2)} in a day`, now));
  const month = (await spendThisMonth(db, user.id, now)) + cost;
  if (month > cfg.aiMonthlyBudgetCents * 10_000) return refuse(await lockUser(db, user.id, `monthly budget: about $${(month / 1e6).toFixed(2)} in a month`, now));

  await addSpend(db, user.id, cost, now, 1);
  if (countsAsBurst) {
    await db.insert(aiCallLog).values({ userId: user.id, at: now });
    // keep the log small: forget this person's calls older than an hour
    await db.delete(aiCallLog).where(and(eq(aiCallLog.userId, user.id), lt(aiCallLog.at, now - HOUR)));
  }
  return { ok: true };
}

/**
 * Adds (or, with a negative number, takes back) cost once the real figure is known, e.g. Azure pages actually billed minus the
 * estimate charged up front. Never refuses and never locks; the next guardAi sees the new total.
 */
export async function chargeAi(db: Db, _env: Env | undefined, user: AiUser, extraMicros: number, now = Date.now()): Promise<void> {
  if (!extraMicros) return;
  const cfg = await getRuntimeConfig(db);
  if (!cfg.aiGuardEnabled) return;
  await addSpend(db, user.id, Math.trunc(extraMicros), now, 0);
}

/** Throwing flavour for routes that answer errors with ApiError (HTTP 429 and the friendly text). */
export async function guardAiOrThrow(db: Db, env: Env | undefined, user: AiUser, kind: AiKind, estimatedCostMicros: number, now = Date.now()): Promise<void> {
  const r = await guardAi(db, env, user, kind, estimatedCostMicros, now);
  if (!r.ok) throw new ApiError(429, r.message);
}

/** For GET /api/me/ai-status. */
export async function aiStatus(db: Db, userId: string, now = Date.now()): Promise<{ locked: boolean; until: number | null }> {
  const cfg = await getRuntimeConfig(db);
  if (!cfg.aiGuardEnabled) return { locked: false, until: null };
  const lock = await activeLock(db, userId, now);
  return { locked: Boolean(lock), until: lock?.lockedUntil ?? null };
}
