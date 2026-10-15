/**
 * Decides WHAT to send and WHEN. It only creates rows in `notification_jobs`; `pushDispatch.ts` sends them and re-checks
 * every rule at send time. All copy, windows, weights and audiences come from the admin-editable `notification_templates`.
 */
import { and, asc, desc, eq, gte, inArray, like, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import {
  budgets, notificationJobs, notificationPreferences, notificationSettings, notificationTemplates, profile, pushDevices, salesRecords, transactions, user,
} from "../db/schema";
import type { Env } from "../types";
import { ALL_SEEDS, renderTemplate } from "./notificationCatalog";
import { hit } from "./rateLimit";
import { newId } from "./scope";

type Db = ReturnType<typeof drizzle<typeof schema>>;
type Template = typeof notificationTemplates.$inferSelect;
export type Settings = typeof notificationSettings.$inferSelect;

export const DAY = 24 * 60 * 60 * 1000;
export const HOUR = 60 * 60 * 1000;

// ---- small pure helpers (unit tested) --------------------------------------------------------------------------------

export function hash32(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type LocalParts = { year: number; month: number; day: number; hour: number; minute: number; dow: number; date: string };

/** The wall-clock date and time somewhere. Unknown zone names fall back to UTC. */
export function localParts(ms: number, timeZone: string): LocalParts {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short" }).formatToParts(new Date(ms));
  } catch {
    return localParts(ms, "UTC");
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const year = Number(get("year")), month = Number(get("month")), day = Number(get("day"));
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { year, month, day, hour: Number(get("hour")), minute: Number(get("minute")), dow, date: `${get("year")}-${get("month")}-${get("day")}` };
}

/** The UTC time at which the clock in `timeZone` reads `date` + hour:minute. Works across daylight-saving changes. */
export function zonedTime(date: string, hour: number, minute: number, timeZone: string): number {
  const [y, m, d] = date.split("-").map(Number);
  let guess = Date.UTC(y, m - 1, d, hour, minute);
  for (let i = 0; i < 3; i++) {
    const p = localParts(guess, timeZone);
    const shown = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    const wanted = Date.UTC(y, m - 1, d, hour, minute);
    const diff = wanted - shown;
    if (diff === 0) break;
    guess += diff;
  }
  return guess;
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

export function daysBetween(from: string, to: string): number {
  const [a, b, c] = from.split("-").map(Number);
  const [x, y, z] = to.split("-").map(Number);
  return Math.round((Date.UTC(x, y - 1, z) - Date.UTC(a, b - 1, c)) / DAY);
}

/** A stable "random" minute inside a daily window, so a retried job never moves. */
export function windowTime(seed: string, date: string, startHour: number, endHour: number, timeZone: string): number {
  const span = Math.max(1, (endHour - startHour) * 60);
  const offset = hash32(seed) % span;
  return zonedTime(date, startHour, 0, timeZone) + offset * 60_000;
}

/** Which trial day (1 = sign-up day) a person is on, by their own calendar. */
export function trialDay(startedAt: number, now: number, timeZone: string): number {
  return daysBetween(localParts(startedAt, timeZone).date, localParts(now, timeZone).date) + 1;
}

export function formatMoney(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount.toFixed(2)}`;
  }
}

export const PRIORITY: Record<string, number> = { payment: 100, overdue: 90, invoice: 80, budget: 70, service: 60, weekly: 50, lifecycle: 40, campaign: 30, marketing: 25, daily: 20 };

/** Time-to-live and "replace the older one" key per type (spec section 11). */
export function delivery(category: string, key: string): { ttlSeconds: number; collapseKey: string | null } {
  switch (category) {
    case "payment": return { ttlSeconds: 24 * 3600, collapseKey: null };
    case "invoice": case "overdue": return { ttlSeconds: 12 * 3600, collapseKey: `invoice-${key}` };
    case "budget": return { ttlSeconds: 12 * 3600, collapseKey: `budget-${key}` };
    case "daily": return { ttlSeconds: 6 * 3600, collapseKey: "daily" };
    case "lifecycle": return { ttlSeconds: 12 * 3600, collapseKey: "trial" };
    case "campaign": return { ttlSeconds: 24 * 3600, collapseKey: "campaign" };
    case "weekly": return { ttlSeconds: 12 * 3600, collapseKey: "weekly" };
    default: return { ttlSeconds: 12 * 3600, collapseKey: null };
  }
}

/** Weighted pick; rarely-seen messages are favoured. `roll` is a 0..1 number. */
export function weightedPick<T extends { weight: number; seen: boolean }>(items: T[], roll: number): T | null {
  const weights = items.map((i) => Math.max(0, i.weight) * (i.seen ? 0.35 : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  if (!items.length || total <= 0) return null;
  let r = roll * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}

// ---- seeding ----------------------------------------------------------------------------------------------------------------

/** Fills in any template the table does not have yet. Never touches rows the admin has already edited. */
export async function seedTemplates(db: Db): Promise<number> {
  const existing = new Set((await db.select({ key: notificationTemplates.key }).from(notificationTemplates)).map((r) => r.key));
  const missing = ALL_SEEDS.filter((s) => !existing.has(s.key));
  const now = Date.now();
  for (let i = 0; i < missing.length; i += 4) {
    const chunk = missing.slice(i, i + 4).map((s) => ({
      key: s.key, name: s.name, category: s.category, title: s.title, body: s.body, route: s.route,
      enabled: true, androidEnabled: (s.channels ?? "android,web").includes("android"), webEnabled: (s.channels ?? "android,web").includes("web"), webAccessMentions: false,
      updatedAt: now, updatedBy: "seed", kind: s.kind, toggle: s.toggle, audience: s.audience ?? "all", weight: s.weight ?? 1, cooldownDays: s.cooldownDays ?? 10,
      bodyWebMention: s.bodyWebMention ?? null, sequenceDay: s.sequenceDay ?? null, windowStart: s.windowStart ?? null, windowEnd: s.windowEnd ?? null,
      delayMinutes: s.delayMinutes ?? null, channels: s.channels ?? "android,web", version: 1,
    }));
    await db.insert(notificationTemplates).values(chunk).onConflictDoNothing();
  }
  return missing.length;
}

// ---- creating jobs -----------------------------------------------------------------------------------------------------------

export type NewJob = {
  userId: string; template: Pick<Template, "key" | "kind" | "category" | "toggle" | "route" | "channels" | "bodyWebMention">;
  title: string; body: string; scheduledFor: number; dedupeKey: string; payload?: Record<string, unknown>; collapseKey?: string | null; campaignId?: string | null;
  expiresInMs?: number; priority?: number;
};

/** One row per (person, message, day). Returns false when the same job already exists. */
export async function addJob(db: Db, job: NewJob, expiryHours = 12): Promise<boolean> {
  const now = Date.now();
  const d = delivery(job.template.category, job.collapseKey ?? job.template.key);
  const rows = await db.insert(notificationJobs).values({
    id: newId(), userId: job.userId, templateKey: job.template.key, category: job.template.category, route: job.template.route,
    title: job.title, body: job.body, scheduledFor: job.scheduledFor, expiresAt: job.scheduledFor + (job.expiresInMs ?? expiryHours * HOUR),
    status: "queued", priority: job.priority ?? PRIORITY[job.template.category] ?? 10, dedupeKey: job.dedupeKey, attempts: 0, lastError: null, createdAt: now, updatedAt: now,
    toggle: job.template.toggle, kind: job.template.kind, bodyWebMention: job.template.bodyWebMention ?? null, payload: JSON.stringify(job.payload ?? {}),
    collapseKey: job.collapseKey === undefined ? d.collapseKey : job.collapseKey, ttlSeconds: d.ttlSeconds, channels: job.template.channels, campaignId: job.campaignId ?? null,
  }).onConflictDoNothing().returning({ id: notificationJobs.id });
  return rows.length > 0;
}

async function templatesByKind(db: Db, kind: string) {
  return db.select().from(notificationTemplates).where(and(eq(notificationTemplates.kind, kind), eq(notificationTemplates.enabled, true)));
}

type Person = {
  id: string; name: string; createdAt: number; pro: boolean; trialStartedAt: number | null; timezone: string;
  prefs: typeof notificationPreferences.$inferSelect | null;
};

const firstName = (name: string, email = "") => (name.trim().split(/\s+/)[0] || email.split("@")[0] || "there").slice(0, 12);

async function currencyFor(db: Db, userId: string): Promise<string> {
  const row = await db.select({ data: salesRecords.data }).from(salesRecords)
    .where(and(like(salesRecords.scope, `u:${userId}:%`), eq(salesRecords.kind, "invoice_settings"), eq(salesRecords.deleted, 0))).limit(1).get();
  try { return (row && (JSON.parse(row.data).currency as string)) || "USD"; } catch { return "USD"; }
}

type InvoiceRow = { id: string; scope: string; number: string; customer: string; dueDate: string; total: number; paid: number; status: string };

async function invoicesOf(db: Db, userId: string): Promise<InvoiceRow[]> {
  const rows = await db.select().from(salesRecords).where(and(like(salesRecords.scope, `u:${userId}:%`), eq(salesRecords.kind, "invoice"), eq(salesRecords.deleted, 0))).limit(500);
  const out: InvoiceRow[] = [];
  for (const r of rows) {
    try {
      const d = JSON.parse(r.data) as Record<string, unknown>;
      out.push({ id: r.id, scope: r.scope, number: String(d.invoiceNumber ?? r.id), customer: String(d.customerName ?? "Customer"), dueDate: String(d.dueDate ?? ""), total: Number(d.total ?? 0), paid: Number(d.amountPaid ?? 0), status: String(d.status ?? "") });
    } catch { /* skip unreadable record */ }
  }
  return out;
}

const isOpen = (i: InvoiceRow) => i.status !== "paid" && i.status !== "draft" && i.total - i.paid > 0.004 && /^\d{4}-\d{2}-\d{2}$/.test(i.dueDate);

export async function overdueSummary(db: Db, userId: string, today: string) {
  const open = (await invoicesOf(db, userId)).filter((i) => isOpen(i) && i.dueDate < today);
  return { count: open.length, total: open.reduce((s, i) => s + (i.total - i.paid), 0) };
}

// ---- the planner (runs from the cron) ---------------------------------------------------------------------------------

async function audienceOk(db: Db, audience: string, p: Person, ctx: { overdue?: { count: number; total: number }; now: number }): Promise<boolean> {
  switch (audience) {
    case "all": case "voice_unused": return true; // voice entries are not tracked yet, so everyone qualifies
    case "paid": return p.pro;
    case "expired_free": return !p.pro && ctx.now >= (p.trialStartedAt ?? p.createdAt) + 7 * DAY;
    case "trial": return !p.pro && ctx.now < (p.trialStartedAt ?? p.createdAt) + 7 * DAY;
    case "has_overdue": return (ctx.overdue?.count ?? 0) > 0;
    default: return true;
  }
}

async function planSequence(db: Db, p: Person, lp: LocalParts, now: number, s: Settings, tpls: Template[]) {
  const day = trialDay(p.trialStartedAt ?? p.createdAt, now, p.timezone);
  if (p.pro || day < 1 || day > 7) return 0;
  let candidates = tpls.filter((t) => t.sequenceDay === day);
  if (!candidates.length) return 0;
  // variants of one day (day 6) depend on whether there are entries
  if (candidates.length > 1) {
    const n = (await db.select({ n: sql<number>`count(*)` }).from(transactions).where(eq(transactions.userId, p.id)).get())?.n ?? 0;
    candidates = candidates.filter((t) => (t.audience === "has_entries" ? n > 0 : t.audience === "no_entries" ? n === 0 : true));
  }
  const t = candidates[0];
  if (!t) return 0;
  // skip a step when the person already did what it teaches
  if (day === 1 && (await db.select({ n: sql<number>`count(*)` }).from(transactions).where(and(eq(transactions.userId, p.id), eq(transactions.entrySource, "camera"))).get())?.n) return 0;
  if (day === 3 && (await db.select({ n: sql<number>`count(*)` }).from(salesRecords).where(and(like(salesRecords.scope, `u:${p.id}:%`), eq(salesRecords.kind, "invoice"), eq(salesRecords.deleted, 0))).get())?.n) return 0;
  if (day === 4 && (await db.select({ n: sql<number>`count(*)` }).from(budgets).where(like(budgets.scope, `u:${p.id}:%`)).get())?.n) return 0;

  const start = t.windowStart ?? 10, end = t.windowEnd ?? 19;
  let when: number;
  if (day === 1 && t.delayMinutes) {
    when = (p.trialStartedAt ?? p.createdAt) + t.delayMinutes * 60_000;
    const h = localParts(when, p.timezone);
    if (h.hour < start || h.hour >= end) when = zonedTime(h.hour >= end ? addDays(h.date, 1) : h.date, start, 0, p.timezone);
  } else {
    when = windowTime(`${p.id}:${t.key}`, lp.date, start, end, p.timezone);
  }
  if (when < now - s.jobExpiryHours * HOUR) return 0; // that moment is long gone: never send a stale step
  const title = renderTemplate(t.title, { first_name: firstName(p.name) });
  const count = t.body.includes("transaction_count") ? (await db.select({ n: sql<number>`count(*)` }).from(transactions).where(eq(transactions.userId, p.id)).get())?.n ?? 0 : 0;
  const body = renderTemplate(t.body, { first_name: firstName(p.name), transaction_count: count });
  return (await addJob(db, { userId: p.id, template: t, title, body, scheduledFor: Math.max(when, now), dedupeKey: `trial:${p.id}:${day}`, payload: { day } }, s.jobExpiryHours)) ? 1 : 0;
}

async function planDaily(db: Db, p: Person, lp: LocalParts, now: number, s: Settings, pool: Template[]) {
  const day = trialDay(p.trialStartedAt ?? p.createdAt, now, p.timezone);
  if (day < 8 || !pool.length) return 0;
  const dedupeKey = `daily:${p.id}:${lp.date}`;
  const existing = await db.select({ id: notificationJobs.id }).from(notificationJobs).where(eq(notificationJobs.dedupeKey, dedupeKey)).get();
  if (existing) return 0;
  const start = 10, end = 19;
  let when = windowTime(`${p.id}:daily`, lp.date, start, end, p.timezone);
  if (when < now) {
    if (lp.hour >= end) return 0; // today's window has closed
    when = now + (hash32(`${p.id}:${lp.date}`) % 45) * 60_000; // joined mid-window: a little later today
  }
  const overdue = await overdueSummary(db, p.id, lp.date);
  const recent = await db.select({ key: notificationJobs.templateKey, at: notificationJobs.scheduledFor }).from(notificationJobs)
    .where(and(eq(notificationJobs.userId, p.id), eq(notificationJobs.kind, "pool"), gte(notificationJobs.scheduledFor, now - 30 * DAY)));
  const seenEver = new Set(recent.map((r) => r.key));
  const eligible: (Template & { seen: boolean })[] = [];
  for (const t of pool) {
    if (!(await audienceOk(db, t.audience, p, { overdue, now }))) continue;
    const used = recent.some((r) => r.key === t.key && r.at > now - t.cooldownDays * DAY);
    if (used) continue;
    eligible.push({ ...t, seen: seenEver.has(t.key) });
  }
  const pick = weightedPick(eligible, (hash32(`${p.id}:${lp.date}:pick`) % 10_000) / 10_000);
  if (!pick) return 0;
  const currency = await currencyFor(db, p.id);
  const vars = { first_name: firstName(p.name), overdue_count: overdue.count, overdue_total: formatMoney(overdue.total, currency) };
  return (await addJob(db, { userId: p.id, template: pick, title: renderTemplate(pick.title, vars), body: renderTemplate(pick.body, vars), scheduledFor: when, dedupeKey, payload: { pool: pick.key } }, s.jobExpiryHours)) ? 1 : 0;
}

async function planInvoices(db: Db, p: Person, lp: LocalParts, now: number, s: Settings, events: Template[]) {
  if (lp.hour < 8 || lp.hour >= 12) return 0;
  if (!(await hit(db as never, `plan-invoices:${p.id}:${lp.date}`, 1, DAY)).ok) return 0; // once per local day
  const open = (await invoicesOf(db, p.id)).filter(isOpen);
  if (!open.length) return 0;
  const currency = await currencyFor(db, p.id);
  const pickVariant = (cat: string, seed: string, extra: string[]) => {
    const list = events.filter((t) => t.category === cat && t.audience !== "digest" && (t.audience === "any" || extra.includes(t.audience)));
    return list.length ? list[hash32(seed) % list.length] : null;
  };
  let created = 0;
  const crossing: InvoiceRow[] = [];
  for (const inv of open) {
    const toDue = daysBetween(lp.date, inv.dueDate);
    const late = -toDue;
    const left = formatMoney(inv.total - inv.paid, currency);
    const when = (key: string) => { const w = windowTime(key, lp.date, 9, 12, p.timezone); return w < now ? now : w; };
    if ([3, 1, 0].includes(toDue)) {
      const t = pickVariant("invoice", `${inv.id}:${toDue}`, [`days_${toDue}`]);
      if (t) {
        const vars = { invoice_number: inv.number, customer_name: inv.customer.slice(0, 20), amount: left, due_date: inv.dueDate };
        if (await addJob(db, { userId: p.id, template: t, title: renderTemplate(t.title, vars), body: renderTemplate(t.body, vars), scheduledFor: when(`due:${inv.id}`), dedupeKey: `due:${inv.scope}:${inv.id}:${toDue}`, collapseKey: `invoice-${inv.id}`, payload: { invoiceId: inv.id, scope: inv.scope } }, s.jobExpiryHours)) created++;
      }
    }
    if ([1, 3, 7, 14].includes(late)) crossing.push(inv);
  }
  if (crossing.length >= 3) {
    const t = events.find((e) => e.audience === "digest");
    if (t) {
      const vars = { overdue_count: crossing.length, overdue_total: formatMoney(crossing.reduce((a, i) => a + i.total - i.paid, 0), currency) };
      if (await addJob(db, { userId: p.id, template: t, title: renderTemplate(t.title, vars), body: renderTemplate(t.body, vars), scheduledFor: Math.max(now, windowTime(`digest:${p.id}`, lp.date, 9, 12, p.timezone)), dedupeKey: `overdue-digest:${p.id}:${lp.date}`, payload: { digest: true } }, s.jobExpiryHours)) created++;
    }
  } else {
    for (const inv of crossing) {
      const late = daysBetween(inv.dueDate, lp.date);
      const t = pickVariant("overdue", `${inv.id}:${late}`, []);
      if (!t) continue;
      const vars = { invoice_number: inv.number, customer_name: inv.customer.slice(0, 20), amount: formatMoney(inv.total - inv.paid, currency), days_overdue: late };
      const w = windowTime(`od:${inv.id}`, lp.date, 9, 12, p.timezone);
      if (await addJob(db, { userId: p.id, template: t, title: renderTemplate(t.title, vars), body: renderTemplate(t.body, vars), scheduledFor: w < now ? now : w, dedupeKey: `overdue:${inv.scope}:${inv.id}:${late}`, collapseKey: `invoice-${inv.id}`, payload: { invoiceId: inv.id, scope: inv.scope } }, s.jobExpiryHours)) created++;
    }
  }
  return created;
}

async function planWeekly(db: Db, p: Person, lp: LocalParts, now: number, s: Settings, events: Template[]) {
  if (lp.dow !== 1 || lp.hour < 7 || lp.hour >= 10 || p.prefs?.weeklyReports !== true) return 0;
  if (!(await hit(db as never, `plan-weekly:${p.id}:${lp.date}`, 1, DAY)).ok) return 0;
  const from = addDays(lp.date, -7), to = addDays(lp.date, -1);
  const rows = await db.select({ type: transactions.type, amount: transactions.amount }).from(transactions)
    .where(and(eq(transactions.userId, p.id), gte(transactions.date, from), lte(transactions.date, to)));
  const open = (await invoicesOf(db, p.id)).filter(isOpen).length;
  if (!rows.length && !open) return 0;
  const currency = await currencyFor(db, p.id);
  const income = rows.filter((r) => r.type === "income").reduce((a, r) => a + r.amount, 0);
  const expense = rows.filter((r) => r.type !== "income").reduce((a, r) => a + r.amount, 0);
  const variants = events.filter((t) => t.category === "weekly");
  if (!variants.length) return 0;
  const t = variants[hash32(`${p.id}:${lp.date}`) % variants.length];
  const vars = { income_total: formatMoney(income, currency), expense_total: formatMoney(expense, currency), transaction_count: rows.length };
  const w = windowTime(`weekly:${p.id}`, lp.date, 8, 10, p.timezone);
  return (await addJob(db, { userId: p.id, template: t, title: renderTemplate(t.title, vars), body: renderTemplate(t.body, vars), scheduledFor: w < now ? now : w, dedupeKey: `weekly:${p.id}:${lp.date}`, payload: {} }, s.jobExpiryHours)) ? 1 : 0;
}

/** Looks at everyone with a registered device and creates whatever is due. Safe to run every few minutes. */
export async function planNotifications(env: Env, now = Date.now()): Promise<{ created: number; people: number }> {
  const db = drizzle(env.DB, { schema });
  await seedTemplates(db);
  const s = await db.select().from(notificationSettings).where(eq(notificationSettings.key, "global")).get();
  if (!s?.globalEnabled) return { created: 0, people: 0 };
  const [seq, pool, events] = await Promise.all([
    s.lifecycleEnabled ? templatesByKind(db, "sequence") : Promise.resolve([] as Template[]),
    s.remindersEnabled ? templatesByKind(db, "pool") : Promise.resolve([] as Template[]),
    s.transactionalEnabled ? templatesByKind(db, "event") : Promise.resolve([] as Template[]),
  ]);
  const rows = await db
    .select({ id: user.id, name: user.name, createdAt: user.createdAt, pro: profile.proSubscriptionActive, trialStartedAt: profile.trialStartedAt, prefs: notificationPreferences })
    .from(pushDevices).innerJoin(user, eq(user.id, pushDevices.userId)).leftJoin(profile, eq(profile.userId, user.id)).leftJoin(notificationPreferences, eq(notificationPreferences.userId, user.id))
    .where(eq(pushDevices.active, true)).groupBy(user.id).limit(2000);
  let created = 0;
  for (const r of rows) {
    const p: Person = { id: r.id, name: r.name, createdAt: r.createdAt.getTime(), pro: Boolean(r.pro), trialStartedAt: r.trialStartedAt, timezone: r.prefs?.timezone ?? "UTC", prefs: r.prefs };
    const lp = localParts(now, p.timezone);
    try {
      created += await planSequence(db, p, lp, now, s, seq);
      created += await planDaily(db, p, lp, now, s, pool);
      created += await planInvoices(db, p, lp, now, s, events);
      created += await planWeekly(db, p, lp, now, s, events);
    } catch (e) {
      console.error("notification planning failed for a user", e);
    }
  }
  return { created, people: rows.length };
}

// ---- event hooks (called from the places where things happen) --------------------------------------------------------------

async function hasDevice(db: Db, userId: string) {
  return Boolean((await db.select({ id: pushDevices.id }).from(pushDevices).where(and(eq(pushDevices.userId, userId), eq(pushDevices.active, true))).limit(1).get()));
}

/** After a free-trial entry is added: the 20th and 25th entry each get one notice, ever. */
export async function queueQuotaNotice(env: Env, userId: string, entries: number, isPro: boolean) {
  if (isPro || (entries !== 20 && entries !== 25)) return;
  const db = drizzle(env.DB, { schema });
  if (!(await hasDevice(db, userId))) return;
  await seedTemplates(db);
  const t = await db.select().from(notificationTemplates).where(and(eq(notificationTemplates.key, `quota_${entries}`), eq(notificationTemplates.enabled, true))).get();
  if (!t) return;
  await addJob(db, { userId, template: t, title: t.title, body: t.body, scheduledFor: Date.now(), dedupeKey: `quota:${userId}:${entries}` });
}

/** A payment record arrived from the app: tell the owner (immediately, any hour). */
export async function queuePaymentNotice(env: Env, userId: string, scope: string, payment: Record<string, unknown>) {
  const db = drizzle(env.DB, { schema });
  if (!(await hasDevice(db, userId))) return;
  const id = String(payment.id ?? "");
  if (!id) return;
  const remaining = Number(payment.remainingBalance ?? 0);
  const full = remaining <= 0.004;
  await seedTemplates(db);
  const all = (await templatesByKind(db, "event")).filter((t) => t.category === "payment" && (t.audience === "any" || t.audience === (full ? "full" : "partial")));
  if (!all.length) return;
  const t = all[hash32(id) % all.length];
  const currency = await currencyFor(db, userId);
  const vars = { customer_name: String(payment.customerName ?? "Your customer").slice(0, 20), amount_paid: formatMoney(Number(payment.amount ?? 0), currency), invoice_number: String(payment.invoiceNumber ?? "").slice(0, 12), balance: formatMoney(Math.max(0, remaining), currency) };
  await addJob(db, { userId, template: t, title: renderTemplate(t.title, vars), body: renderTemplate(t.body, vars), scheduledFor: Date.now(), dedupeKey: `payment:${scope}:${id}`, payload: {} });
}

/** After an expense is saved: has the month's spending in that category crossed 80%, 95% or 100% of its budget? */
export async function queueBudgetAlerts(env: Env, userId: string, workspace: string, category: string, date: string) {
  const db = drizzle(env.DB, { schema });
  const month = date.slice(0, 7);
  const scope = `u:${userId}:${workspace}`;
  const budget = await db.select().from(budgets).where(and(eq(budgets.scope, scope), eq(budgets.category, category), eq(budgets.month, month))).get();
  if (!budget || budget.limitAmount <= 0) return;
  if (!(await hasDevice(db, userId))) return;
  const spent = (await db.select({ s: sql<number>`coalesce(sum(${transactions.amount}), 0)` }).from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.workspace, workspace), eq(transactions.category, category), eq(transactions.type, "expense"), like(transactions.date, `${month}%`))).get())?.s ?? 0;
  const pct = (spent / budget.limitAmount) * 100;
  const level = pct >= 100 ? 100 : pct >= 95 ? 95 : pct >= 80 ? 80 : 0;
  if (!level) return;
  await seedTemplates(db);
  const variants = (await templatesByKind(db, "event")).filter((t) => t.category === "budget" && t.audience === `level_${level}`);
  if (!variants.length) return;
  const t = variants[hash32(`${budget.id}:${level}`) % variants.length];
  const currency = await currencyFor(db, userId);
  const vars = { budget_name: category.slice(0, 16), percent_used: `${Math.round(pct)}%`, amount_left: formatMoney(Math.max(0, budget.limitAmount - spent), currency) };
  await addJob(db, { userId, template: t, title: renderTemplate(t.title, vars), body: renderTemplate(t.body, vars), scheduledFor: Date.now(), dedupeKey: `budget:${budget.id}:${month}:${level}`, collapseKey: `budget-${budget.id}`, payload: { budgetId: budget.id, level } });
}
