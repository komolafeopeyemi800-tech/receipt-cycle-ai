import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { fcmMessage, queueDailyReminders } from "../src/lib/pushDispatch";
import { api, makeUser } from "./helpers";

const device = (token: string) => ({ token, platform: "android" as const, deviceId: `dev-${token}-12345`, permissionStatus: "granted" });
const msg = { title: "Hello", body: "World", route: "Records", jobId: "j1", templateKey: "t", category: "daily" };

describe("push messages", () => {
  it("android messages open the app normally and never use an undeclared click action", () => {
    const m = fcmMessage({ token: "a".repeat(30), platform: "android" }, msg).message as any;
    expect(m.notification).toEqual({ title: "Hello", body: "World" });
    expect(m.android.notification.channel_id).toBe("reminders");
    expect(JSON.stringify(m)).not.toContain("click_action");
    expect(m.data).toMatchObject({ route: "Records", jobId: "j1" });
  });

  it("web messages carry a link back to the site", () => {
    const m = fcmMessage({ token: "w".repeat(30), platform: "web" }, { ...msg, route: "/transactions" }).message as any;
    expect(m.webpush.fcm_options.link).toBe("https://receiptcycle.com/transactions");
    expect(m.webpush.notification.title).toBe("Hello");
  });
});

describe("devices and the test notification", () => {
  it("registers a device once per phone and replaces its token", async () => {
    const { token, id } = await makeUser();
    expect((await api("PUT", "/api/notifications/device", { token, body: device("token-one-aaaaaaaaaaaaaaaaaaaa") })).status).toBe(200);
    await api("PUT", "/api/notifications/device", { token, body: { ...device("token-two-bbbbbbbbbbbbbbbbbbbb"), deviceId: device("token-one-aaaaaaaaaaaaaaaaaaaa").deviceId } });
    const rows = await env.DB.prepare("SELECT token FROM push_devices WHERE user_id = ? AND active = 1").bind(id).all<{ token: string }>();
    expect(rows.results.map((r) => r.token)).toEqual(["token-two-bbbbbbbbbbbbbbbbbbbb"]);
  });

  it("explains what is missing instead of failing silently", async () => {
    const { token } = await makeUser();
    const none = await api("POST", "/api/notifications/test", { token, body: {} });
    expect(none.status).toBe(404);
    await api("PUT", "/api/notifications/device", { token, body: device("token-three-cccccccccccccccccccc") });
    const noKey = await api("POST", "/api/notifications/test", { token, body: {} });
    expect(noKey.status).toBe(503);
    expect(noKey.json.error).toMatch(/Firebase/);
    expect((await api("POST", "/api/notifications/test", { body: {} })).status).toBe(401);
  });
});

describe("daily reminder queue", () => {
  async function zoneAtHour(hour: number) {
    const h = new Date().getUTCHours();
    const offset = ((hour - h + 36) % 24) - 12 + 0; // -12..11 hours from UTC
    const o = offset > 11 ? offset - 24 : offset;
    return o === 0 ? "UTC" : o > 0 ? `Etc/GMT-${o}` : `Etc/GMT+${-o}`;
  }

  it("creates one reminder per person per local day, only at 7 pm local, only when switched on", async () => {
    const now = Date.now();
    await env.DB.prepare("INSERT OR REPLACE INTO notification_settings (key, global_enabled, lifecycle_enabled, reminders_enabled, transactional_enabled, marketing_enabled, android_offer_campaigns_enabled, quiet_hours_start, quiet_hours_end, combined_daily_cap, transactional_daily_cap, updated_at, updated_by) VALUES ('global', 0, 1, 1, 1, 1, 0, 21, 8, 8, 6, ?, 'test')").bind(now).run();
    const { token, id } = await makeUser();
    await api("PUT", "/api/notifications/device", { token, body: device("token-four-dddddddddddddddddddd") });
    const zone = await zoneAtHour(19);
    await api("PUT", "/api/notifications/preferences", { token, body: { dailyReminder: true, invoiceReminders: true, overdueReminders: true, paymentConfirmations: true, budgetAlerts: true, weeklyReports: false, marketingUpdates: true, timezone: zone } });

    expect(await queueDailyReminders(env as any)).toBe(0); // master switch is off

    await env.DB.prepare("UPDATE notification_settings SET global_enabled = 1 WHERE key = 'global'").run();
    expect(await queueDailyReminders(env as any)).toBeGreaterThanOrEqual(1);
    expect(await queueDailyReminders(env as any)).toBe(0); // already queued today
    const jobs = await env.DB.prepare("SELECT title, category, status FROM notification_jobs WHERE user_id = ?").bind(id).all<{ title: string; category: string; status: string }>();
    expect(jobs.results).toEqual([{ title: "Keep your records current", category: "daily", status: "queued" }]);

    // someone whose local time is not 7 pm gets nothing
    const other = await makeUser();
    await api("PUT", "/api/notifications/device", { token: other.token, body: device("token-five-eeeeeeeeeeeeeeeeeeee") });
    await api("PUT", "/api/notifications/preferences", { token: other.token, body: { dailyReminder: true, invoiceReminders: true, overdueReminders: true, paymentConfirmations: true, budgetAlerts: true, weeklyReports: false, marketingUpdates: true, timezone: await zoneAtHour(10) } });
    await queueDailyReminders(env as any);
    const none = await env.DB.prepare("SELECT count(*) AS n FROM notification_jobs WHERE user_id = ?").bind(other.id).first<{ n: number }>();
    expect(none?.n).toBe(0);
    await env.DB.prepare("UPDATE notification_settings SET global_enabled = 0 WHERE key = 'global'").run();
  });
});
