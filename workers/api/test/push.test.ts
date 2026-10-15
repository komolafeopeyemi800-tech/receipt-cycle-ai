import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { ALL_SEEDS, templateProblems } from "../src/lib/notificationCatalog";
import { DAY, planNotifications, queueQuotaNotice } from "../src/lib/notificationEngine";
import { fcmMessage } from "../src/lib/pushDispatch";
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
});

describe("message catalog", () => {
  it("every built-in message fits the length and Google Play rules", () => {
    expect(ALL_SEEDS.length).toBeGreaterThan(40);
    for (const t of ALL_SEEDS) expect({ key: t.key, problems: templateProblems(t) }).toEqual({ key: t.key, problems: [] });
  });

  it("blocks a trial message that mentions a price or a link", () => {
    const base = { title: "Hello", body: "Try it", kind: "sequence", category: "lifecycle" };
    expect(templateProblems({ ...base, body: "Only $5 today" }).length).toBeGreaterThan(0);
    expect(templateProblems({ ...base, body: "See https://x.com" }).length).toBeGreaterThan(0);
    expect(templateProblems({ ...base, title: "x".repeat(60) }).length).toBeGreaterThan(0);
  });
});

describe("planner", () => {
  const T0 = Date.UTC(2026, 5, 1, 0, 0, 0);
  async function enable() {
    await env.DB.prepare("INSERT OR REPLACE INTO notification_settings (key, global_enabled, updated_at, updated_by) VALUES ('global', 1, ?, 'test')").bind(Date.now()).run();
  }
  async function person(daysIn: number) {
    const { token, id } = await makeUser();
    await api("PUT", "/api/notifications/device", { token, body: device(`token-plan-${id}-aaaaaaaaaaaaaaaa`) });
    await api("PUT", "/api/notifications/preferences", { token, body: { dailyReminder: true, invoiceReminders: true, overdueReminders: true, paymentConfirmations: true, budgetAlerts: true, weeklyReports: false, marketingUpdates: true, timezone: "UTC" } });
    await env.DB.prepare("UPDATE profile SET trial_started_at = ? WHERE user_id = ?").bind(T0, id).run();
    return { id, now: T0 + daysIn * DAY + 9.5 * 3600_000 };
  }

  it("plans nothing while the master switch is off", async () => {
    await env.DB.prepare("INSERT OR REPLACE INTO notification_settings (key, global_enabled, updated_at, updated_by) VALUES ('global', 0, ?, 'test')").bind(Date.now()).run();
    const p = await person(1);
    expect((await planNotifications(env as any, p.now)).created).toBe(0);
  });

  it("sends the trial step for the day once, and a daily reminder only after day 7", async () => {
    await enable();
    const p = await person(1); // day 2
    await planNotifications(env as any, p.now);
    await planNotifications(env as any, p.now); // running again must not duplicate
    const day2 = await env.DB.prepare("SELECT kind, dedupe_key FROM notification_jobs WHERE user_id = ?").bind(p.id).all<{ kind: string; dedupe_key: string }>();
    expect(day2.results.map((r) => r.kind)).toEqual(["sequence"]);
    expect(day2.results[0].dedupe_key).toBe(`trial:${p.id}:2`);

    const q = await person(8); // day 9
    await planNotifications(env as any, q.now);
    const day9 = await env.DB.prepare("SELECT kind FROM notification_jobs WHERE user_id = ?").bind(q.id).all<{ kind: string }>();
    expect(day9.results.map((r) => r.kind)).toEqual(["pool"]);
  });

  it("warns once when a free person reaches 20 entries", async () => {
    await enable();
    const { id } = await makeUser();
    await queueQuotaNotice(env as any, id, 20, false);
    await queueQuotaNotice(env as any, id, 20, false);
    const rows = await env.DB.prepare("SELECT kind FROM notification_jobs WHERE user_id = ?").bind(id).all();
    expect(rows.results.length).toBeLessThanOrEqual(1);
  });
});

describe("admin notification center", () => {
  it("lists every built-in message, validates edits, keeps history and can restore", async () => {
    const admin = await makeUser({ email: "boss@example.com" });
    const h = { "x-admin-secret": "admin-secret" };
    const overview = await api("GET", "/api/notifications/admin", { token: admin.token, headers: h });
    expect(overview.status).toBe(200);
    expect(overview.json.templates.length).toBeGreaterThan(40);

    const t = overview.json.templates.find((x: any) => x.kind === "sequence");
    const ok = await api("PUT", `/api/notifications/admin/templates/${t.key}`, { token: admin.token, headers: h, body: { ...t, title: "New title" } });
    expect(ok.status).toBe(200);
    expect(ok.json.version).toBe(t.version + 1);
    const bad = await api("PUT", `/api/notifications/admin/templates/${t.key}`, { token: admin.token, headers: h, body: { ...t, body: "Pay $9 at https://x.com" } });
    expect(bad.status).toBe(422);

    const hist = await api("GET", `/api/notifications/admin/templates/${t.key}/history`, { token: admin.token, headers: h });
    expect(hist.json[0].version).toBe(t.version);
    const back = await api("POST", `/api/notifications/admin/templates/${t.key}/restore`, { token: admin.token, headers: h, body: { version: t.version } });
    expect(back.status).toBe(200);
  });

  it("refuses people who are not admins", async () => {
    const { token } = await makeUser();
    expect((await api("GET", "/api/notifications/admin", { token, headers: { "x-admin-secret": "admin-secret" } })).status).toBe(403);
  });
});
