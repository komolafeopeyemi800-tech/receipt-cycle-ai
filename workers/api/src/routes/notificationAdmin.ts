import { and, desc, eq, gte, inArray, like, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import {
  notificationAttempts, notificationCampaigns, notificationEvents, notificationJobs, notificationPreferences, notificationSettings, notificationTemplateHistory,
  notificationTemplates, profile, pushDevices, user,
} from "../db/schema";
import { ApiError } from "../lib/errors";
import { parseBody } from "../lib/http";
import { MERGE_FIELDS, policyApplies, policyProblems, renderTemplate, templateProblems } from "../lib/notificationCatalog";
import { addJob, DAY, localParts, overdueSummary, seedTemplates, zonedTime, addDays } from "../lib/notificationEngine";
import { firebaseSession, sendFcm } from "../lib/pushDispatch";
import { newId } from "../lib/scope";
import type { AppEnv } from "../types";
import { audit, requireAdmin } from "./admin";

export const notificationAdminRoutes = new Hono<AppEnv>();

const settingsDefaults = {
  globalEnabled: false, lifecycleEnabled: true, remindersEnabled: true, transactionalEnabled: true, marketingEnabled: true, androidOfferCampaignsEnabled: false,
  quietHoursStart: 21, quietHoursEnd: 8, combinedDailyCap: 8, transactionalDailyCap: 6, lifecycleDailyCap: 1, dailyReminderCap: 1, marketingDailyCap: 1,
  campaignsPerWeek: 2, campaignMinGapHours: 48, jobExpiryHours: 12, backoffEnabled: true, webAccessMentionsAndroid: false,
};
const settingsSchema = z.object({
  globalEnabled: z.boolean(), lifecycleEnabled: z.boolean(), remindersEnabled: z.boolean(), transactionalEnabled: z.boolean(), marketingEnabled: z.boolean(),
  androidOfferCampaignsEnabled: z.boolean(), quietHoursStart: z.number().int().min(0).max(23), quietHoursEnd: z.number().int().min(0).max(23),
  combinedDailyCap: z.number().int().min(1).max(50), transactionalDailyCap: z.number().int().min(1).max(50),
  lifecycleDailyCap: z.number().int().min(1).max(10).default(1), dailyReminderCap: z.number().int().min(1).max(10).default(1), marketingDailyCap: z.number().int().min(1).max(10).default(1),
  campaignsPerWeek: z.number().int().min(1).max(21).default(2), campaignMinGapHours: z.number().int().min(0).max(240).default(48), jobExpiryHours: z.number().int().min(1).max(72).default(12),
  backoffEnabled: z.boolean().default(true), webAccessMentionsAndroid: z.boolean().default(false),
});

const templateSchema = z.object({
  name: z.string().min(1).max(80), category: z.string().min(1), title: z.string().min(1).max(200), body: z.string().min(1).max(400), route: z.string().min(1).max(80),
  enabled: z.boolean(), kind: z.enum(["sequence", "pool", "event", "quota", "campaign"]).default("event"),
  toggle: z.enum(["dailyReminder", "invoiceReminders", "overdueReminders", "paymentConfirmations", "budgetAlerts", "weeklyReports", "marketingUpdates", "none"]).default("marketingUpdates"),
  audience: z.string().min(1).max(40).default("all"), weight: z.number().int().min(0).max(20).default(1), cooldownDays: z.number().int().min(0).max(90).default(10),
  bodyWebMention: z.string().max(400).nullish(), sequenceDay: z.number().int().min(1).max(7).nullish(), windowStart: z.number().int().min(0).max(23).nullish(),
  windowEnd: z.number().int().min(1).max(24).nullish(), delayMinutes: z.number().int().min(0).max(1440).nullish(),
  channels: z.string().regex(/^(android|web)(,(android|web))?$/).default("android,web"),
});

const stamp = (n: number) => new Date(n).toISOString();

// ---- overview -----------------------------------------------------------------------------------------------------------------
notificationAdminRoutes.get("/", async (c) => {
  await requireAdmin(c);
  const db = c.get("db");
  await seedTemplates(db as never);
  const settings = await db.select().from(notificationSettings).where(eq(notificationSettings.key, "global")).get();
  const templates = await db.select().from(notificationTemplates).orderBy(notificationTemplates.kind, notificationTemplates.sequenceDay, notificationTemplates.key).limit(500);
  const counts = await db.select({ key: notificationJobs.templateKey, status: notificationJobs.status, n: sql<number>`count(*)` }).from(notificationJobs).groupBy(notificationJobs.templateKey, notificationJobs.status);
  const opens = await db.select({ key: notificationJobs.templateKey, n: sql<number>`count(*)` }).from(notificationEvents)
    .innerJoin(notificationJobs, eq(notificationJobs.id, notificationEvents.jobId)).where(eq(notificationEvents.kind, "opened")).groupBy(notificationJobs.templateKey);
  const stats: Record<string, { sent: number; failed: number; skipped: number; queued: number; opened: number }> = {};
  for (const r of counts) {
    const s = (stats[r.key] ??= { sent: 0, failed: 0, skipped: 0, queued: 0, opened: 0 });
    if (r.status === "sent") s.sent += r.n; else if (r.status === "failed") s.failed += r.n; else if (r.status === "skipped" || r.status === "cancelled") s.skipped += r.n; else s.queued += r.n;
  }
  for (const r of opens) (stats[r.key] ??= { sent: 0, failed: 0, skipped: 0, queued: 0, opened: 0 }).opened = r.n;
  const devices = await db.select({ platform: pushDevices.platform, active: pushDevices.active, n: sql<number>`count(*)` }).from(pushDevices).groupBy(pushDevices.platform, pushDevices.active);
  const campaigns = await db.select().from(notificationCampaigns).orderBy(desc(notificationCampaigns.createdAt)).limit(50);
  return c.json({
    settings: settings ?? { key: "global", ...settingsDefaults, updatedAt: 0, updatedBy: "default" },
    templates, stats, campaigns, mergeFields: MERGE_FIELDS,
    devices: { android: devices.filter((d) => d.platform === "android" && d.active).reduce((a, d) => a + d.n, 0), web: devices.filter((d) => d.platform === "web" && d.active).reduce((a, d) => a + d.n, 0), removed: devices.filter((d) => !d.active).reduce((a, d) => a + d.n, 0) },
    firebase: Boolean(c.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()),
  });
});

notificationAdminRoutes.put("/settings", async (c) => {
  const actor = await requireAdmin(c);
  const body = await parseBody(c, settingsSchema);
  const values = { key: "global", ...body, updatedAt: Date.now(), updatedBy: actor };
  await c.get("db").insert(notificationSettings).values(values).onConflictDoUpdate({ target: notificationSettings.key, set: values });
  await audit(c.get("db"), "notifications.settings.update", actor, body);
  return c.json({ ok: true });
});

// ---- templates: edit, validate, history, restore ------------------------------------------------------------------------------
notificationAdminRoutes.put("/templates/:key", async (c) => {
  const actor = await requireAdmin(c);
  const body = await parseBody(c, templateSchema);
  const db = c.get("db"), key = c.req.param("key");
  const problems = templateProblems({ title: body.title, body: body.body, bodyWebMention: body.bodyWebMention, kind: body.kind, category: body.category });
  if (problems.length) return c.json({ error: problems.join(" "), problems, code: "blocked_policy" }, 422);
  const old = await db.select().from(notificationTemplates).where(eq(notificationTemplates.key, key)).get();
  if (old) await db.insert(notificationTemplateHistory).values({ id: newId(), templateKey: key, version: old.version, snapshot: JSON.stringify(old), updatedAt: Date.now(), updatedBy: actor });
  const values = {
    key, ...body, bodyWebMention: body.bodyWebMention || null, sequenceDay: body.sequenceDay ?? null, windowStart: body.windowStart ?? null, windowEnd: body.windowEnd ?? null,
    delayMinutes: body.delayMinutes ?? null, androidEnabled: body.channels.includes("android"), webEnabled: body.channels.includes("web"), webAccessMentions: Boolean(body.bodyWebMention),
    version: (old?.version ?? 0) + 1, updatedAt: Date.now(), updatedBy: actor,
  };
  await db.insert(notificationTemplates).values(values).onConflictDoUpdate({ target: notificationTemplates.key, set: values });
  await audit(db, "notifications.template.save", actor, { key, version: values.version });
  return c.json({ ok: true, version: values.version });
});

notificationAdminRoutes.get("/templates/:key/history", async (c) => {
  await requireAdmin(c);
  const rows = await c.get("db").select().from(notificationTemplateHistory).where(eq(notificationTemplateHistory.templateKey, c.req.param("key"))).orderBy(desc(notificationTemplateHistory.version)).limit(30);
  return c.json(rows.map((r) => ({ version: r.version, updatedAt: r.updatedAt, updatedBy: r.updatedBy, template: JSON.parse(r.snapshot) })));
});

notificationAdminRoutes.post("/templates/:key/restore", async (c) => {
  const actor = await requireAdmin(c);
  const { version } = await parseBody(c, z.object({ version: z.number().int().min(1) }));
  const db = c.get("db"), key = c.req.param("key");
  const row = await db.select().from(notificationTemplateHistory).where(and(eq(notificationTemplateHistory.templateKey, key), eq(notificationTemplateHistory.version, version))).get();
  if (!row) throw new ApiError(404, "That version does not exist.");
  const old = await db.select().from(notificationTemplates).where(eq(notificationTemplates.key, key)).get();
  if (old) await db.insert(notificationTemplateHistory).values({ id: newId(), templateKey: key, version: old.version, snapshot: JSON.stringify(old), updatedAt: Date.now(), updatedBy: actor });
  const snap = JSON.parse(row.snapshot) as typeof notificationTemplates.$inferSelect;
  await db.update(notificationTemplates).set({ ...snap, version: (old?.version ?? 0) + 1, updatedAt: Date.now(), updatedBy: actor }).where(eq(notificationTemplates.key, key));
  await audit(db, "notifications.template.restore", actor, { key, version });
  return c.json({ ok: true });
});

// ---- delivery log ---------------------------------------------------------------------------------------------------------------
async function logRows(c: Parameters<typeof requireAdmin>[0], limit: number) {
  const db = c.get("db");
  const status = c.req.query("status"), category = c.req.query("category"), q = c.req.query("q")?.trim().toLowerCase();
  const conds = [status ? eq(notificationJobs.status, status) : undefined, category ? eq(notificationJobs.category, category) : undefined, q ? like(user.email, `%${q}%`) : undefined].filter(Boolean) as ReturnType<typeof eq>[];
  const rows = await db.select({
    id: notificationJobs.id, email: user.email, templateKey: notificationJobs.templateKey, category: notificationJobs.category, title: notificationJobs.title, status: notificationJobs.status,
    reason: notificationJobs.lastError, scheduledFor: notificationJobs.scheduledFor, updatedAt: notificationJobs.updatedAt, attempts: notificationJobs.attempts, campaignId: notificationJobs.campaignId,
  }).from(notificationJobs).innerJoin(user, eq(user.id, notificationJobs.userId)).where(conds.length ? and(...conds) : undefined).orderBy(desc(notificationJobs.updatedAt)).limit(limit);
  return rows;
}

notificationAdminRoutes.get("/log", async (c) => {
  await requireAdmin(c);
  return c.json(await logRows(c, 200));
});

notificationAdminRoutes.get("/log.csv", async (c) => {
  await requireAdmin(c);
  const rows = await logRows(c, 5000);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = ["time,user,template,category,status,reason,title", ...rows.map((r) => [stamp(r.updatedAt), r.email, r.templateKey, r.category, r.status, r.reason, r.title].map(esc).join(","))].join("\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="notification-log.csv"' } });
});

// ---- one person ---------------------------------------------------------------------------------------------------------------
notificationAdminRoutes.get("/user", async (c) => {
  await requireAdmin(c);
  const db = c.get("db");
  const email = (c.req.query("email") ?? "").trim().toLowerCase();
  const u = await db.select({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt }).from(user).where(eq(user.email, email)).get();
  if (!u) throw new ApiError(404, "No account with that email.");
  const [prefs, p, devices, jobs, opened] = await Promise.all([
    db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, u.id)).get(),
    db.select({ pro: profile.proSubscriptionActive, trialStartedAt: profile.trialStartedAt }).from(profile).where(eq(profile.userId, u.id)).get(),
    db.select({ platform: pushDevices.platform, active: pushDevices.active, lastSeenAt: pushDevices.lastSeenAt, permission: pushDevices.permissionStatus }).from(pushDevices).where(eq(pushDevices.userId, u.id)),
    db.select().from(notificationJobs).where(eq(notificationJobs.userId, u.id)).orderBy(desc(notificationJobs.createdAt)).limit(25),
    db.select({ at: sql<number>`max(${notificationEvents.createdAt})` }).from(notificationEvents).where(eq(notificationEvents.userId, u.id)).get(),
  ]);
  const start = p?.trialStartedAt ?? u.createdAt.getTime();
  const tz = prefs?.timezone ?? "UTC";
  const trialDay = Math.max(1, Math.round((Date.parse(localParts(Date.now(), tz).date) - Date.parse(localParts(start, tz).date)) / DAY) + 1);
  return c.json({ user: { email: u.email, name: u.name, createdAt: u.createdAt.getTime() }, plan: p?.pro ? "paid" : trialDay <= 7 ? `trial day ${trialDay}` : "expired free", prefs, devices, lastOpenAt: opened?.at ?? null, jobs: jobs.map((j) => ({ id: j.id, template: j.templateKey, title: j.title, status: j.status, reason: j.lastError, scheduledFor: j.scheduledFor })) });
});

// ---- campaigns ----------------------------------------------------------------------------------------------------------------
const audienceSchema = z.object({
  plan: z.enum(["all", "trial", "paid", "expired_free", "cancelled"]).default("all"), platform: z.enum(["any", "android", "web"]).default("any"),
  inactiveDays: z.number().int().min(0).max(365).nullish(), hasOverdue: z.boolean().nullish(),
});
const campaignSchema = z.object({
  name: z.string().min(1).max(80), templateKey: z.string().min(1), fields: z.record(z.string(), z.string().max(120)).default({}), audience: audienceSchema.default({ plan: "all", platform: "any" }),
  sendMode: z.enum(["now", "at", "local"]).default("now"), sendAt: z.number().int().nullish(),
});

type AudienceUser = { id: string; name: string; email: string; timezone: string; marketing: boolean; platforms: string[] };

async function resolveAudience(db: ReturnType<AppEnvDb>, filter: z.infer<typeof audienceSchema>, template: typeof notificationTemplates.$inferSelect) {
  const now = Date.now();
  const rows = await db.select({
    id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, pro: profile.proSubscriptionActive, trialStartedAt: profile.trialStartedAt, polar: profile.polarCustomerId,
    tz: notificationPreferences.timezone, marketing: notificationPreferences.marketingUpdates, platform: pushDevices.platform,
  }).from(pushDevices).innerJoin(user, eq(user.id, pushDevices.userId)).leftJoin(profile, eq(profile.userId, user.id)).leftJoin(notificationPreferences, eq(notificationPreferences.userId, user.id))
    .where(eq(pushDevices.active, true)).limit(20000);
  const channels = template.channels.split(",");
  const byUser = new Map<string, AudienceUser & { createdAt: number; pro: boolean; trialStartedAt: number | null; polar: boolean }>();
  for (const r of rows) {
    if (!channels.includes(r.platform)) continue;
    if (filter.platform !== "any" && r.platform !== filter.platform) continue;
    const e = byUser.get(r.id) ?? { id: r.id, name: r.name, email: r.email, timezone: r.tz ?? "UTC", marketing: r.marketing ?? true, platforms: [], createdAt: r.createdAt.getTime(), pro: Boolean(r.pro), trialStartedAt: r.trialStartedAt, polar: Boolean(r.polar) };
    e.platforms.push(r.platform);
    byUser.set(r.id, e);
  }
  const lastOpen = new Map((await db.select({ id: notificationEvents.userId, at: sql<number>`max(${notificationEvents.createdAt})` }).from(notificationEvents).groupBy(notificationEvents.userId)).map((r) => [r.id, r.at]));
  const out: AudienceUser[] = [];
  let toggledOff = 0, filteredOut = 0;
  for (const u of byUser.values()) {
    const start = u.trialStartedAt ?? u.createdAt;
    const inTrial = !u.pro && now < start + 7 * DAY;
    const ok =
      filter.plan === "all" ? true : filter.plan === "paid" ? u.pro : filter.plan === "trial" ? inTrial : filter.plan === "expired_free" ? !u.pro && !inTrial : !u.pro && u.polar;
    if (!ok) { filteredOut++; continue; }
    if (filter.inactiveDays != null && now - (lastOpen.get(u.id) ?? u.createdAt) < filter.inactiveDays * DAY) { filteredOut++; continue; }
    if (filter.hasOverdue != null) {
      const od = await overdueSummary(db as never, u.id, localParts(now, u.timezone).date);
      if ((od.count > 0) !== filter.hasOverdue) { filteredOut++; continue; }
    }
    if (template.toggle !== "none" && !u.marketing && template.toggle === "marketingUpdates") { toggledOff++; continue; }
    out.push(u);
  }
  return { users: out, toggledOff, filteredOut };
}
type AppEnvDb = () => ReturnType<typeof import("drizzle-orm/d1").drizzle<typeof import("../db/schema")>>;

function checkCampaignText(t: typeof notificationTemplates.$inferSelect, fields: Record<string, string>) {
  const missing = [...(t.title + t.body).matchAll(/\{\{\s*([a-z_]+)\s*\}\}/g)].map((m) => m[1]).filter((f) => !["first_name"].includes(f) && !(fields[f] ?? "").trim());
  if (missing.length) throw new ApiError(400, `Fill in: ${[...new Set(missing)].join(", ")}.`);
  for (const f of Object.keys(fields)) if (f in MERGE_FIELDS && fields[f].length > MERGE_FIELDS[f]) throw new ApiError(400, `"${f}" is too long (${fields[f].length} of ${MERGE_FIELDS[f]} characters).`);
  const vars = { first_name: "Alexander", ...fields };
  const title = renderTemplate(t.title, vars), body = renderTemplate(t.body, vars);
  if (title.length > 40 || body.length > 100) throw new ApiError(400, `The message is too long after filling it in (title ${title.length}/40, message ${body.length}/100).`);
  if (policyApplies("campaign", t.category)) {
    const bad = policyProblems(`${title} ${body}`);
    if (bad.length) throw new ApiError(400, `Not allowed in a campaign: ${bad.join("; ")}.`);
  }
  return { title, body };
}

notificationAdminRoutes.get("/campaigns", async (c) => {
  await requireAdmin(c);
  return c.json(await c.get("db").select().from(notificationCampaigns).orderBy(desc(notificationCampaigns.createdAt)).limit(100));
});

notificationAdminRoutes.post("/campaigns", async (c) => {
  const actor = await requireAdmin(c);
  const body = await parseBody(c, campaignSchema);
  const db = c.get("db");
  const t = await db.select().from(notificationTemplates).where(eq(notificationTemplates.key, body.templateKey)).get();
  if (!t || t.kind !== "campaign") throw new ApiError(404, "Choose a campaign template.");
  checkCampaignText(t, body.fields);
  if (body.sendMode === "at" && !body.sendAt) throw new ApiError(400, "Choose a send time.");
  const now = Date.now();
  const id = newId();
  await db.insert(notificationCampaigns).values({ id, name: body.name, templateKey: t.key, fields: JSON.stringify(body.fields), audience: JSON.stringify(body.audience), sendMode: body.sendMode, sendAt: body.sendAt ?? null, status: "draft", createdBy: actor, queued: 0, createdAt: now, updatedAt: now });
  await audit(db, "notifications.campaign.create", actor, { id, name: body.name });
  return c.json({ id });
});

async function loadCampaign(c: Parameters<typeof requireAdmin>[0]) {
  const db = c.get("db");
  const camp = await db.select().from(notificationCampaigns).where(eq(notificationCampaigns.id, c.req.param("id") ?? "")).get();
  if (!camp) throw new ApiError(404, "Campaign not found.");
  const t = await db.select().from(notificationTemplates).where(eq(notificationTemplates.key, camp.templateKey)).get();
  if (!t) throw new ApiError(404, "The template of this campaign was removed.");
  return { camp, t, fields: JSON.parse(camp.fields) as Record<string, string>, audience: audienceSchema.parse(JSON.parse(camp.audience)) };
}

notificationAdminRoutes.post("/campaigns/:id/audience", async (c) => {
  await requireAdmin(c);
  const { t, audience } = await loadCampaign(c);
  const r = await resolveAudience(c.get("db") as never, audience, t);
  return c.json({ recipients: r.users.length, excludedMarketingOff: r.toggledOff, excludedByFilter: r.filteredOut, sample: r.users.slice(0, 10).map((u) => ({ email: u.email, platforms: u.platforms })) });
});

notificationAdminRoutes.post("/campaigns/:id/test", async (c) => {
  const actor = await requireAdmin(c);
  const { camp, t, fields } = await loadCampaign(c);
  const text = checkCampaignText(t, fields);
  const db = c.get("db");
  const me = await db.select({ id: user.id }).from(user).where(eq(user.email, actor)).get();
  const devices = me ? await db.select().from(pushDevices).where(and(eq(pushDevices.userId, me.id), eq(pushDevices.active, true))).limit(5) : [];
  if (!devices.length) throw new ApiError(404, "Your own account has no registered device. Open the app or website, turn notifications on, then try again.");
  const session = await firebaseSession(c.env);
  if (!session) throw new ApiError(503, "Firebase is not configured on the server.");
  const results: { platform: string; ok: boolean; error?: string }[] = [];
  for (const d of devices) {
    const r = await sendFcm(session.account, session.token, d, { ...text, route: t.route, jobId: `test-${camp.id}`, templateKey: t.key, category: t.category });
    const j = (await r.json().catch(() => ({}))) as { error?: { message?: string } };
    results.push({ platform: d.platform, ok: r.ok, ...(r.ok ? {} : { error: j.error?.message }) });
  }
  return c.json({ sent: results.filter((x) => x.ok).length, results });
});

notificationAdminRoutes.post("/campaigns/:id/send", async (c) => {
  const actor = await requireAdmin(c);
  const { camp, t, fields, audience } = await loadCampaign(c);
  if (!["draft", "scheduled"].includes(camp.status)) throw new ApiError(409, `This campaign is already ${camp.status}.`);
  const db = c.get("db");
  const settings = await db.select().from(notificationSettings).where(eq(notificationSettings.key, "global")).get();
  if (!settings?.globalEnabled) throw new ApiError(409, "Sending is switched off (Global sending). Turn it on first.");
  checkCampaignText(t, fields);
  const { users } = await resolveAudience(db as never, audience, t);
  const now = Date.now();
  let queued = 0;
  for (const u of users.slice(0, 5000)) {
    const vars = { first_name: (u.name.trim().split(/\s+/)[0] || u.email.split("@")[0]).slice(0, 12), ...fields };
    const lp = localParts(now, u.timezone);
    const when =
      camp.sendMode === "at" ? camp.sendAt ?? now :
      camp.sendMode === "local" ? (zonedTime(lp.date, 10, 0, u.timezone) > now ? zonedTime(lp.date, 10, 0, u.timezone) : zonedTime(addDays(lp.date, 1), 10, 0, u.timezone)) : now;
    const ok = await addJob(db as never, { userId: u.id, template: t, title: renderTemplate(t.title, vars), body: renderTemplate(t.body, vars), scheduledFor: Math.max(when, camp.sendMode === "at" ? when : now), dedupeKey: `campaign:${camp.id}:${u.id}`, campaignId: camp.id, payload: {}, expiresInMs: 24 * 3600_000 }, settings.jobExpiryHours);
    if (ok) queued++;
  }
  await db.update(notificationCampaigns).set({ status: queued ? "sending" : "sent", queued, updatedAt: now }).where(eq(notificationCampaigns.id, camp.id));
  await audit(db, "notifications.campaign.send", actor, { id: camp.id, queued });
  return c.json({ queued });
});

notificationAdminRoutes.post("/campaigns/:id/cancel", async (c) => {
  const actor = await requireAdmin(c);
  const db = c.get("db"), id = c.req.param("id") ?? "";
  await db.update(notificationJobs).set({ status: "cancelled", lastError: "campaign_cancelled", updatedAt: Date.now() }).where(and(eq(notificationJobs.campaignId, id), eq(notificationJobs.status, "queued")));
  await db.update(notificationCampaigns).set({ status: "cancelled", updatedAt: Date.now() }).where(eq(notificationCampaigns.id, id));
  await audit(db, "notifications.campaign.cancel", actor, { id });
  return c.json({ ok: true });
});

/** Pause every campaign that is waiting, for a maintenance window or an incident. */
notificationAdminRoutes.post("/campaigns-pause-all", async (c) => {
  const actor = await requireAdmin(c);
  const r = await c.get("db").update(notificationJobs).set({ status: "cancelled", lastError: "campaigns_paused", updatedAt: Date.now() }).where(and(eq(notificationJobs.category, "campaign"), eq(notificationJobs.status, "queued"))).returning({ id: notificationJobs.id });
  await audit(c.get("db"), "notifications.campaigns.pause_all", actor, { cancelled: r.length });
  return c.json({ cancelled: r.length });
});
