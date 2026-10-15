import { SignJWT, importPKCS8 } from "jose";
import { drizzle } from "drizzle-orm/d1";
import { and, eq, lte, sql } from "drizzle-orm";
import * as schema from "../db/schema";
import { notificationAttempts, notificationJobs, notificationPreferences, notificationSettings, pushDevices } from "../db/schema";
import { androidPolicyErrors } from "./notificationPolicy";
import { newId } from "./scope";
import type { Env } from "../types";

type ServiceAccount = { client_email: string; private_key: string; project_id: string; token_uri?: string };

async function accessToken(account: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(account.private_key, "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/firebase.messaging" }).setProtectedHeader({ alg: "RS256", typ: "JWT" }).setIssuer(account.client_email).setSubject(account.client_email).setAudience(account.token_uri ?? "https://oauth2.googleapis.com/token").setIssuedAt(now).setExpirationTime(now + 3600).sign(key);
  const response = await fetch(account.token_uri ?? "https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  const payload = await response.json() as { access_token?: string; error_description?: string };
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description ?? "Firebase authorization failed.");
  return payload.access_token;
}

function preferenceAllows(category: string, prefs: typeof notificationPreferences.$inferSelect | undefined) {
  if (category === "daily") return prefs?.dailyReminder ?? true;
  if (category === "invoice") return prefs?.invoiceReminders ?? true;
  if (category === "overdue") return prefs?.overdueReminders ?? true;
  if (category === "payment") return prefs?.paymentConfirmations ?? true;
  if (category === "budget") return prefs?.budgetAlerts ?? true;
  if (category === "weekly") return prefs?.weeklyReports ?? false;
  if (["lifecycle", "marketing", "campaign"].includes(category)) return prefs?.marketingUpdates ?? true;
  return true;
}

export async function dispatchPushQueue(env: Env) {
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) return { processed: 0, disabled: "firebase_not_configured" };
  const account = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as ServiceAccount;
  const db = drizzle(env.DB, { schema }); const now = Date.now();
  const settings = await db.select().from(notificationSettings).where(eq(notificationSettings.key, "global")).get();
  if (!settings?.globalEnabled) return { processed: 0, disabled: "global_kill_switch" };
  const token = await accessToken(account);
  const jobs = await db.select().from(notificationJobs).where(and(eq(notificationJobs.status, "queued"), lte(notificationJobs.scheduledFor, now))).limit(50);
  for (const job of jobs) {
    if (job.expiresAt <= now) { await db.update(notificationJobs).set({ status: "skipped", lastError: "expired", updatedAt: now }).where(eq(notificationJobs.id, job.id)); continue; }
    const prefs = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, job.userId)).get();
    if (!preferenceAllows(job.category, prefs)) { await db.update(notificationJobs).set({ status: "skipped", lastError: "preference_disabled", updatedAt: now }).where(eq(notificationJobs.id, job.id)); continue; }
    const channelEnabled =
      (["invoice", "overdue", "payment", "budget"].includes(job.category) && settings.transactionalEnabled) ||
      (["daily", "weekly"].includes(job.category) && settings.remindersEnabled) ||
      (job.category === "lifecycle" && settings.lifecycleEnabled) ||
      (["marketing", "campaign"].includes(job.category) && settings.marketingEnabled);
    if (!channelEnabled) { await db.update(notificationJobs).set({ status: "skipped", lastError: "channel_kill_switch", updatedAt: now }).where(eq(notificationJobs.id, job.id)); continue; }
    const localHour = Number(new Intl.DateTimeFormat("en-US", { timeZone: prefs?.timezone ?? "UTC", hour: "2-digit", hourCycle: "h23" }).format(new Date(now)));
    const isQuiet = settings.quietHoursStart > settings.quietHoursEnd
      ? localHour >= settings.quietHoursStart || localHour < settings.quietHoursEnd
      : localHour >= settings.quietHoursStart && localHour < settings.quietHoursEnd;
    if (isQuiet && job.category !== "payment") { await db.update(notificationJobs).set({ scheduledFor: now + 60 * 60_000, lastError: "quiet_hours_deferred", updatedAt: now }).where(eq(notificationJobs.id, job.id)); continue; }
    const start = now - 24 * 60 * 60 * 1000;
    const sentToday = await db.select({ count: sql<number>`count(*)` }).from(notificationAttempts).where(and(eq(notificationAttempts.userId, job.userId), eq(notificationAttempts.status, "sent"), sql`${notificationAttempts.createdAt} >= ${start}`)).get();
    if ((sentToday?.count ?? 0) >= settings.combinedDailyCap) { await db.update(notificationJobs).set({ status: "skipped", lastError: "frequency_cap", updatedAt: now }).where(eq(notificationJobs.id, job.id)); continue; }
    const devices = await db.select().from(pushDevices).where(and(eq(pushDevices.userId, job.userId), eq(pushDevices.active, true))).limit(20);
    let sent = false; let temporary = false;
    for (const device of devices) {
      const policy = device.platform === "android" ? androidPolicyErrors({ ...job, androidOfferCampaignsEnabled: settings.androidOfferCampaignsEnabled }) : [];
      if (policy.length) { await db.insert(notificationAttempts).values({ id: newId(), jobId: job.id, userId: job.userId, deviceId: device.id, status: "blocked_policy", errorCode: "blocked_policy", errorMessage: policy.join(" "), createdAt: Date.now() }); continue; }
      if (device.platform !== "android" && device.platform !== "web") continue;
      const response = await sendFcm(account, token, device, { title: job.title, body: job.body, route: job.route, jobId: job.id, templateKey: job.templateKey, category: job.category });
      const payload = await response.json().catch(() => ({})) as { name?: string; error?: { status?: string; message?: string } }; const status = response.ok ? "sent" : response.status >= 500 || response.status === 429 ? "temporary_failure" : "failed";
      sent ||= response.ok; temporary ||= status === "temporary_failure";
      await db.insert(notificationAttempts).values({ id: newId(), jobId: job.id, userId: job.userId, deviceId: device.id, status, providerMessageId: payload.name ?? null, errorCode: payload.error?.status ?? null, errorMessage: payload.error?.message ?? null, createdAt: Date.now() });
      if (["UNREGISTERED", "INVALID_ARGUMENT"].includes(payload.error?.status ?? "")) await db.update(pushDevices).set({ active: false, updatedAt: Date.now() }).where(eq(pushDevices.id, device.id));
    }
    const attempts = job.attempts + 1; const retry = temporary && attempts < 3;
    await db.update(notificationJobs).set(retry ? { status: "queued", attempts, scheduledFor: now + attempts * 5 * 60_000, lastError: "temporary_provider_failure", updatedAt: now } : { status: sent ? "sent" : "failed", attempts, lastError: sent ? null : "delivery_failed", updatedAt: now }).where(eq(notificationJobs.id, job.id));
  }
  return { processed: jobs.length };
}

/** Builds the Firebase message for one device. Android shows a normal notification; web shows a browser notification that opens the site. */
export function fcmMessage(device: { token: string; platform: string }, msg: { title: string; body: string; route: string; jobId: string; templateKey: string; category: string }, webBase = "https://receiptcycle.com") {
  const data = { route: msg.route, jobId: msg.jobId, templateKey: msg.templateKey, category: msg.category };
  if (device.platform === "web") {
    return {
      message: {
        token: device.token,
        data,
        webpush: {
          notification: { title: msg.title, body: msg.body, icon: `${webBase}/icon-192.png`, badge: `${webBase}/favicon-32.png` },
          fcm_options: { link: `${webBase}${msg.route.startsWith("/") ? msg.route : "/dashboard"}` },
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
      android: { ttl: "43200s", priority: "HIGH", notification: { channel_id: "reminders" } },
    },
  };
}

export async function sendFcm(account: ServiceAccount, accessTokenValue: string, device: { token: string; platform: string }, msg: Parameters<typeof fcmMessage>[1]) {
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

/**
 * Creates the "keep your records current" reminder once per local day, around 7 pm in each person's own time zone.
 * Safe to run often: a unique key per user and day stops duplicates.
 */
export async function queueDailyReminders(env: Env) {
  const db = drizzle(env.DB, { schema });
  const now = Date.now();
  const settings = await db.select().from(notificationSettings).where(eq(notificationSettings.key, "global")).get();
  if (!settings?.globalEnabled || !settings.remindersEnabled) return 0;
  const rows = await db
    .select({ userId: pushDevices.userId, timezone: notificationPreferences.timezone, daily: notificationPreferences.dailyReminder })
    .from(pushDevices)
    .leftJoin(notificationPreferences, eq(notificationPreferences.userId, pushDevices.userId))
    .where(eq(pushDevices.active, true))
    .groupBy(pushDevices.userId)
    .limit(1000);
  let created = 0;
  for (const row of rows) {
    if (row.daily === false) continue;
    const zone = row.timezone || "UTC";
    let parts: Intl.DateTimeFormatPart[];
    try {
      parts = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date(now));
    } catch {
      continue; // unknown time zone name
    }
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    if (Number(get("hour")) !== 19) continue;
    const day = `${get("year")}-${get("month")}-${get("day")}`;
    const inserted = await db
      .insert(notificationJobs)
      .values({
        id: newId(), userId: row.userId, templateKey: "daily_reminder", category: "daily", route: "Records",
        title: "Keep your records current", body: "Take a minute to add today's receipts and expenses.",
        scheduledFor: now, expiresAt: now + 6 * 60 * 60_000, status: "queued", priority: 5, dedupeKey: `daily:${row.userId}:${day}`,
        attempts: 0, lastError: null, createdAt: now, updatedAt: now,
      })
      .onConflictDoNothing()
      .returning({ id: notificationJobs.id });
    if (inserted.length) created++;
  }
  return created;
}
