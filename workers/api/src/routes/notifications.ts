import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { notificationAttempts, notificationEvents, notificationJobs, notificationPreferences, notificationSettings, notificationTemplates, pushDevices } from "../db/schema";
import { parseBody } from "../lib/http";
import { ApiError } from "../lib/errors";
import { firebaseSession, sendFcm } from "../lib/pushDispatch";
import { enforce } from "../lib/rateLimit";
import { androidPolicyErrors } from "../lib/notificationPolicy";
import { newId } from "../lib/scope";
import { requireUser } from "../middleware/auth";
import type { AppEnv } from "../types";
import { notificationAdminRoutes } from "./notificationAdmin";

const defaults = { dailyReminder: true, invoiceReminders: true, overdueReminders: true, paymentConfirmations: true, budgetAlerts: true, weeklyReports: false, marketingUpdates: true, timezone: "UTC" };
const prefsSchema = z.object({ dailyReminder: z.boolean(), invoiceReminders: z.boolean(), overdueReminders: z.boolean(), paymentConfirmations: z.boolean(), budgetAlerts: z.boolean(), weeklyReports: z.boolean(), marketingUpdates: z.boolean(), timezone: z.string().min(1).max(80) });

export const notificationRoutes = new Hono<AppEnv>();
notificationRoutes.use("*", requireUser);
notificationRoutes.get("/preferences", async (c) => {
  const row = await c.get("db").select().from(notificationPreferences).where(eq(notificationPreferences.userId, c.get("user").id)).get();
  return c.json(row ?? { userId: c.get("user").id, ...defaults, updatedAt: 0 });
});
notificationRoutes.put("/preferences", async (c) => {
  const body = await parseBody(c, prefsSchema); const values = { userId: c.get("user").id, ...body, updatedAt: Date.now() };
  await c.get("db").insert(notificationPreferences).values(values).onConflictDoUpdate({ target: notificationPreferences.userId, set: values });
  return c.json({ ok: true });
});
notificationRoutes.put("/device", async (c) => {
  const body = await parseBody(c, z.object({ token: z.string().min(20), platform: z.enum(["android", "ios", "web"]), deviceId: z.string().min(8), permissionStatus: z.string().min(1) }));
  const db = c.get("db"), userId = c.get("user").id, now = Date.now();
  const existing = await db.select().from(pushDevices).where(and(eq(pushDevices.userId, userId), eq(pushDevices.deviceId, body.deviceId))).get();
  if (existing && existing.token !== body.token) await db.delete(pushDevices).where(eq(pushDevices.id, existing.id));
  const values = { id: existing?.id ?? newId(), userId, ...body, active: true, lastSeenAt: now, createdAt: existing?.createdAt ?? now, updatedAt: now };
  await db.insert(pushDevices).values(values).onConflictDoUpdate({ target: pushDevices.token, set: { userId, deviceId: body.deviceId, platform: body.platform, permissionStatus: body.permissionStatus, active: true, lastSeenAt: now, updatedAt: now } });
  return c.json({ ok: true });
});
/** Sends a test notification right now to every device this account has enabled, and reports what Firebase answered. */
notificationRoutes.post("/test", async (c) => {
  const db = c.get("db"), userId = c.get("user").id;
  await enforce(db, `push-test:${userId}`, 10, 60 * 60_000, "You have sent several test notifications.");
  const devices = await db.select().from(pushDevices).where(and(eq(pushDevices.userId, userId), eq(pushDevices.active, true))).limit(10);
  if (devices.length === 0) throw new ApiError(404, "No device is registered for notifications yet. Turn notifications on first.");
  const session = await firebaseSession(c.env);
  if (!session) throw new ApiError(503, "Push notifications are not configured on the server yet (Firebase key missing).");
  const results = [] as { platform: string; ok: boolean; error?: string }[];
  for (const device of devices) {
    const response = await sendFcm(session.account, session.token, device, { title: "Receipt Cycle is connected", body: "Notifications are working on this device.", route: device.platform === "web" ? "/dashboard" : "Records", jobId: "test", templateKey: "test", category: "test" });
    const payload = (await response.json().catch(() => ({}))) as { error?: { status?: string; message?: string } };
    if (!response.ok && ["UNREGISTERED", "INVALID_ARGUMENT"].includes(payload.error?.status ?? "")) await db.update(pushDevices).set({ active: false, updatedAt: Date.now() }).where(eq(pushDevices.id, device.id));
    results.push({ platform: device.platform, ok: response.ok, ...(response.ok ? {} : { error: payload.error?.message ?? `Firebase answered ${response.status}` }) });
  }
  return c.json({ sent: results.filter((r) => r.ok).length, results });
});
notificationRoutes.post("/opened", async (c) => {
  const body = await parseBody(c, z.object({ jobId: z.string().optional(), kind: z.enum(["opened", "app_opened"]) }));
  await c.get("db").insert(notificationEvents).values({ id: newId(), userId: c.get("user").id, jobId: body.jobId ?? null, kind: body.kind, createdAt: Date.now() });
  return c.json({ ok: true });
});

notificationRoutes.route("/admin", notificationAdminRoutes);
