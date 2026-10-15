/**
 * Sends queued notifications through Firebase (FCM HTTP v1). Every rule is checked again here, at the moment of sending:
 * switches, the person's own toggles, quiet hours, frequency caps, back-off for people who ignore messages, "already did it
 * today", whether the invoice is still unpaid, and the wording rules for Google Play.
 */
import { SignJWT, importPKCS8 } from "jose";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import {
  notificationAttempts, notificationEvents, notificationJobs, notificationPreferences, notificationSettings, pushDevices, salesRecords, transactions, user,
} from "../db/schema";
import { policyApplies, policyProblems } from "./notificationCatalog";
import { DAY, HOUR, addDays, localParts, planNotifications, zonedTime } from "./notificationEngine";
import { newId } from "./scope";
import type { Env } from "../types";

export type ServiceAccount = { client_email: string; private_key: string; project_id: string; token_uri?: string };

async function accessToken(account: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(account.private_key, "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/firebase.messaging" }).setProtectedHeader({ alg: "RS256", typ: "JWT" }).setIssuer(account.client_email).setSubject(account.client_email).setAudience(account.token_uri ?? "https://oauth2.googleapis.com/token").setIssuedAt(now).setExpirationTime(now + 3600).sign(key);
  const response = await fetch(account.token_uri ?? "https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  const payload = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description ?? "Firebase authorization failed.");
  return payload.access_token;
}

/** Where each message opens, for the website. (The phone app maps the same names to its own screens.) */
export const WEB_ROUTES: Record<string, string> = {
  scan: "/transactions", add: "/transactions", voice: "/dashboard", invoice_new: "/invoices?create=1", budget_new: "/budgets", insights: "/insights", reports: "/reports",
  home: "/dashboard", invoices: "/invoices", budgets: "/budgets", transactions: "/transactions", coach: "/ai-assistant", export: "/transactions",
};

export type OutMessage = { title: string; body: string; route: string; jobId: string; templateKey: string; category: string; ttlSeconds?: number; collapseKey?: string | null };

/** Builds the Firebase message for one device. Android shows a normal notification; the web shows a browser notification that opens the site. */
export function fcmMessage(device: { token: string; platform: string }, msg: OutMessage, webBase = "https://receiptcycle.com") {
  const data = { route: msg.route, jobId: msg.jobId, templateKey: msg.templateKey, category: msg.category };
  const ttl = msg.ttlSeconds ?? 43200;
  if (device.platform === "web") {
    const path = WEB_ROUTES[msg.route] ?? (msg.route.startsWith("/") ? msg.route : "/dashboard");
    return {
      message: {
        token: device.token,
        data,
        webpush: {
          headers: { TTL: String(ttl), ...(msg.collapseKey ? { Topic: msg.collapseKey.replace(/[^A-Za-z0-9\-_.~%]/g, "").slice(0, 32) } : {}) },
          notification: { title: msg.title, body: msg.body, icon: `${webBase}/icon-192.png`, badge: `${webBase}/favicon-32.png` },
          fcm_options: { link: `${webBase}${path}` },
        },
      },
    };
  }
  // No click_action here: it names an intent the app does not declare, which makes tapping the notification do nothing.
  return {
    message: {
      token: device.token,
      notification: { title: msg.title, body: msg.body },
      data,
      android: { ttl: `${ttl}s`, priority: "HIGH", ...(msg.collapseKey ? { collapse_key: msg.collapseKey } : {}), notification: { channel_id: channelFor(msg.category) } },
    },
  };
}

/** Android notification channel per category, so people can mute one kind in system settings. */
export function channelFor(category: string): string {
  if (category === "invoice" || category === "overdue") return "invoices";
  if (category === "payment") return "payments";
  if (category === "budget") return "budgets";
  if (category === "weekly") return "reports";
  if (category === "marketing" || category === "campaign" || category === "service") return "updates";
  return "reminders";
}

export async function sendFcm(account: ServiceAccount, accessTokenValue: string, device: { token: string; platform: string }, msg: OutMessage) {
  return fetch(`https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessTokenValue}`, "content-type": "application/json" },
    body: JSON.stringify(fcmMessage(device, msg)),
  });
}

/** Service account + a fresh Google access token, or null when Firebase is not set up yet. */
export async function firebaseSession(env: Env) {
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) return null;
  const account = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as ServiceAccount;
  return { account, token: await accessToken(account) };
}

const TRANSACTIONAL = ["invoice", "overdue", "payment", "budget"];

function toggleOn(prefs: typeof notificationPreferences.$inferSelect | null, toggle: string): boolean {
  if (toggle === "none") return true;
  const v = (prefs as Record<string, unknown> | null)?.[toggle];
  return typeof v === "boolean" ? v : toggle !== "weeklyReports";
}

export async function dispatchPushQueue(env: Env, now = Date.now()) {
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) return { processed: 0, disabled: "firebase_not_configured" };
  const db = drizzle(env.DB, { schema });
  const settings = await db.select().from(notificationSettings).where(eq(notificationSettings.key, "global")).get();
  if (!settings?.globalEnabled) return { processed: 0, disabled: "global_kill_switch" };

  const jobs = await db.select().from(notificationJobs)
    .where(and(eq(notificationJobs.status, "queued"), lte(notificationJobs.scheduledFor, now)))
    .orderBy(desc(notificationJobs.priority), notificationJobs.scheduledFor).limit(100);
  if (!jobs.length) return { processed: 0 };

  let session: Awaited<ReturnType<typeof firebaseSession>> = null;
  const prefsCache = new Map<string, typeof notificationPreferences.$inferSelect | null>();
  const sentCache = new Map<string, { category: string; updatedAt: number }[]>();
  const finish = (id: string, status: string, error: string | null, extra: Record<string, unknown> = {}) =>
    db.update(notificationJobs).set({ status, lastError: error, updatedAt: Date.now(), ...extra }).where(eq(notificationJobs.id, id));

  for (const job of jobs) {
    if (job.expiresAt <= now) { await finish(job.id, "skipped", "expired"); continue; }
    if (!prefsCache.has(job.userId)) prefsCache.set(job.userId, (await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, job.userId)).get()) ?? null);
    const prefs = prefsCache.get(job.userId)!;
    const tz = prefs?.timezone ?? "UTC";
    const lp = localParts(now, tz);
    const service = job.category === "service";

    // 1. master and per-area switches
    const area =
      (job.category === "lifecycle" && settings.lifecycleEnabled) ||
      (["daily", "weekly"].includes(job.category) && settings.remindersEnabled) ||
      (TRANSACTIONAL.includes(job.category) && settings.transactionalEnabled) ||
      (["marketing", "campaign"].includes(job.category) && settings.marketingEnabled) ||
      service;
    if (!area) { await finish(job.id, "skipped", "channel_kill_switch"); continue; }

    // 2. the person's own toggle, checked now and not only when the job was created
    if (!toggleOn(prefs, job.toggle)) { await finish(job.id, "skipped", "preference_disabled"); continue; }

    // 3. quiet hours: wait until morning (payments and service notices may go at once)
    const quiet = settings.quietHoursStart > settings.quietHoursEnd ? lp.hour >= settings.quietHoursStart || lp.hour < settings.quietHoursEnd : lp.hour >= settings.quietHoursStart && lp.hour < settings.quietHoursEnd;
    if (quiet && job.category !== "payment" && !service) {
      const morning = zonedTime(lp.hour >= settings.quietHoursStart ? addDays(lp.date, 1) : lp.date, settings.quietHoursEnd, 0, tz);
      if (morning > job.expiresAt) { await finish(job.id, "skipped", "expired"); continue; }
      await finish(job.id, "queued", "quiet_hours_deferred", { scheduledFor: morning });
      continue;
    }

    // 4. things that make a message pointless right now
    if (job.kind === "pool") {
      const doneToday = (await db.select({ n: sql<number>`count(*)` }).from(transactions).where(and(eq(transactions.userId, job.userId), eq(transactions.date, lp.date))).get())?.n ?? 0;
      if (doneToday > 0) { await finish(job.id, "skipped", "logged_today"); continue; }
    }
    if (["pool", "lifecycle"].includes(job.category) || job.kind === "pool") {
      const last = (await db.select({ at: sql<number>`max(${notificationEvents.createdAt})` }).from(notificationEvents).where(eq(notificationEvents.userId, job.userId)).get())?.at ?? 0;
      if (job.kind === "pool") {
        if (last && now - last < 3 * HOUR) { await finish(job.id, "skipped", "recently_active"); continue; }
        if (settings.backoffEnabled) {
          const since = last || (await db.select({ c: user.createdAt }).from(user).where(eq(user.id, job.userId)).get())?.c?.getTime() || now;
          const idle = Math.floor((now - since) / DAY);
          if (idle >= 30) { await finish(job.id, "skipped", "backoff_30_days"); continue; }
          if (idle >= 14 && ![1, 4].includes(lp.dow)) { await finish(job.id, "skipped", "backoff_14_days"); continue; }
          if (idle >= 7 && lp.day % 2 === 1) { await finish(job.id, "skipped", "backoff_7_days"); continue; }
        }
      }
    }
    if (job.payload && job.payload !== "{}") {
      try {
        const p = JSON.parse(job.payload) as { invoiceId?: string; scope?: string };
        if (p.invoiceId && p.scope) {
          const rec = await db.select().from(salesRecords).where(and(eq(salesRecords.scope, p.scope), eq(salesRecords.kind, "invoice"), eq(salesRecords.id, p.invoiceId))).get();
          const d = rec && !rec.deleted ? (JSON.parse(rec.data) as Record<string, unknown>) : null;
          if (!d || d.status === "paid" || Number(d.total ?? 0) - Number(d.amountPaid ?? 0) <= 0.004) { await finish(job.id, "cancelled", "condition_changed"); continue; }
        }
      } catch { /* an unreadable payload simply skips the extra check */ }
    }

    // 5. frequency caps (priority order comes from the queue order above)
    if (!service) {
      if (!sentCache.has(job.userId)) {
        sentCache.set(job.userId, (await db.select({ category: notificationJobs.category, updatedAt: notificationJobs.updatedAt }).from(notificationJobs).where(and(eq(notificationJobs.userId, job.userId), eq(notificationJobs.status, "sent"), gte(notificationJobs.updatedAt, now - 7 * DAY))).limit(200)));
      }
      const sent = sentCache.get(job.userId)!;
      const today = sent.filter((r) => r.updatedAt >= now - DAY);
      const count = (cats: string[]) => today.filter((r) => cats.includes(r.category)).length;
      const capHit =
        today.length >= settings.combinedDailyCap ? "frequency_cap" :
        job.category === "lifecycle" && count(["lifecycle"]) >= settings.lifecycleDailyCap ? "lifecycle_cap" :
        job.category === "daily" && count(["daily"]) >= settings.dailyReminderCap ? "daily_cap" :
        ["marketing", "campaign"].includes(job.category) && count(["marketing", "campaign"]) >= settings.marketingDailyCap ? "marketing_cap" :
        TRANSACTIONAL.includes(job.category) && count(TRANSACTIONAL) >= settings.transactionalDailyCap ? "transactional_cap" :
        job.category === "campaign" && sent.filter((r) => r.category === "campaign").length >= settings.campaignsPerWeek ? "campaign_weekly_cap" :
        job.category === "campaign" && sent.some((r) => r.category === "campaign" && r.updatedAt >= now - settings.campaignMinGapHours * HOUR) ? "campaign_gap" : null;
      if (capHit) { await finish(job.id, "skipped", capHit); continue; }
    }

    // 6. send to each device, with the wording that is allowed on that platform
    const devices = await db.select().from(pushDevices).where(and(eq(pushDevices.userId, job.userId), eq(pushDevices.active, true))).limit(20);
    const channels = job.channels.split(",");
    const targets = devices.filter((d) => channels.includes(d.platform));
    if (!targets.length) { await finish(job.id, "skipped", devices.length ? "no_device_for_channel" : "no_device"); continue; }
    session ??= await firebaseSession(env);
    if (!session) return { processed: 0, disabled: "firebase_not_configured" };
    let sent = false, temporary = false, blocked = 0;
    for (const device of targets) {
      const body = device.platform === "web" || (settings.webAccessMentionsAndroid && job.bodyWebMention) ? job.bodyWebMention ?? job.body : job.body;
      const problems = policyApplies(job.kind, job.category) ? policyProblems(`${job.title} ${body}`) : [];
      if (job.category === "campaign" && device.platform === "android" && !settings.androidOfferCampaignsEnabled && /offer|last chance|founder|gift|thank you offer/i.test(job.title)) problems.push("Offer campaigns are not sent to the Android app");
      if (problems.length) {
        blocked++;
        await db.insert(notificationAttempts).values({ id: newId(), jobId: job.id, userId: job.userId, deviceId: device.id, status: "blocked_policy", errorCode: "blocked_policy", errorMessage: problems.join("; "), createdAt: Date.now() });
        continue;
      }
      const response = await sendFcm(session.account, session.token, device, { title: job.title, body, route: job.route, jobId: job.id, templateKey: job.templateKey, category: job.category, ttlSeconds: job.ttlSeconds, collapseKey: job.collapseKey });
      const payload = (await response.json().catch(() => ({}))) as { name?: string; error?: { status?: string; message?: string } };
      const status = response.ok ? "sent" : response.status >= 500 || response.status === 429 ? "temporary_failure" : "failed";
      sent ||= response.ok;
      temporary ||= status === "temporary_failure";
      await db.insert(notificationAttempts).values({ id: newId(), jobId: job.id, userId: job.userId, deviceId: device.id, status, providerMessageId: payload.name ?? null, errorCode: payload.error?.status ?? null, errorMessage: payload.error?.message ?? null, createdAt: Date.now() });
      if (["UNREGISTERED", "NOT_FOUND"].includes(payload.error?.status ?? "")) await db.update(pushDevices).set({ active: false, updatedAt: Date.now() }).where(eq(pushDevices.id, device.id));
    }
    const attempts = job.attempts + 1;
    if (!sent && blocked === targets.length) { await finish(job.id, "skipped", "blocked_policy", { attempts }); continue; }
    if (!sent && temporary && attempts < 3) { await finish(job.id, "queued", "temporary_provider_failure", { attempts, scheduledFor: now + attempts * 5 * 60_000 }); continue; }
    await finish(job.id, sent ? "sent" : "failed", sent ? null : "delivery_failed", { attempts });
    if (sent) sentCache.get(job.userId)?.push({ category: job.category, updatedAt: Date.now() });
  }
  return { processed: jobs.length };
}

/** One cron tick: create what is due, then send what is ready. */
export async function runNotificationCycle(env: Env) {
  const minute = new Date().getUTCMinutes();
  const planned = minute % 15 === 0 ? await planNotifications(env).catch((e) => { console.error("planning failed", e); return { created: 0, people: 0 }; }) : null;
  return { planned, sent: await dispatchPushQueue(env) };
}
