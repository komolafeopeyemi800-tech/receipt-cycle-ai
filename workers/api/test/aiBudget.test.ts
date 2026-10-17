import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../src/index";
import * as schema from "../src/db/schema";
import { AI_COST_MICROS, azureCostMicros, chargeAi, guardAi, lockedMessage, spendThisMonth, spendToday } from "../src/lib/aiBudget";
import { api, makeUser } from "./helpers";

afterEach(() => vi.unstubAllGlobals());
const db = () => drizzle(env.DB, { schema });
const admin = { "x-admin-secret": "admin-secret" };
const T0 = Date.UTC(2026, 9, 15, 12, 0, 0);
const MIN = 60_000;
const HOUR = 3_600_000;
const u = (id: string) => ({ id });

async function setCfg(patch: Record<string, unknown>) {
  await env.DB.prepare("INSERT INTO app_config (key) VALUES ('global') ON CONFLICT(key) DO NOTHING").run();
  for (const [k, v] of Object.entries(patch)) await env.DB.prepare(`UPDATE app_config SET ${k} = ? WHERE key = 'global'`).bind(v).run();
}

/** Up to 25 cheap voice calls one second apart, so only the burst rule can trip. */
async function burstOnce(id: string, start: number) {
  let r: Awaited<ReturnType<typeof guardAi>> = { ok: true };
  for (let i = 0; i < 25 && r.ok; i++) r = await guardAi(db(), env, u(id), "voice", 3000, start + i * 1000);
  return r;
}

const lockRow = (id: string) => db().select().from(schema.aiLockouts).all().then((rows) => rows.find((r) => r.userId === id)!);

describe("AI cost guard rules", () => {
  it("never touches a normal person, even a heavy business day", async () => {
    for (let i = 0; i < 15; i++) expect((await guardAi(db(), env, u("normal"), "scan", AI_COST_MICROS.scan, T0 + i * 2 * MIN)).ok).toBe(true);
    expect(await spendToday(db(), "normal", T0)).toBe(15 * AI_COST_MICROS.scan);
  });

  it("locks on a burst and escalates 24h, 72h, 7 days, then expires at the right time", async () => {
    const first = await burstOnce("bot", T0);
    expect(first.ok).toBe(false);
    const lock1 = await lockRow("bot");
    expect(lock1.lockedUntil - lock1.lastStrikeAt).toBe(24 * HOUR);
    if (!first.ok) expect(first.message).toBe(lockedMessage(24));
    const during = await guardAi(db(), env, u("bot"), "voice", 3000, lock1.lockedUntil - 30 * MIN);
    expect(during.ok).toBe(false);
    if (!during.ok) expect(during.message).toContain("about 1 hours");
    const t2 = lock1.lockedUntil + 1;
    expect((await guardAi(db(), env, u("bot"), "voice", 3000, t2)).ok).toBe(true);
    expect((await burstOnce("bot", t2 + 30 * MIN)).ok).toBe(false);
    const lock2 = await lockRow("bot");
    expect(lock2.strikes).toBe(2);
    expect(lock2.lockedUntil - lock2.lastStrikeAt).toBe(72 * HOUR);
    expect((await burstOnce("bot", lock2.lockedUntil + 1)).ok).toBe(false);
    const lock3 = await lockRow("bot");
    expect(lock3.strikes).toBe(3);
    expect(lock3.lockedUntil - lock3.lastStrikeAt).toBe(168 * HOUR);
    expect((await burstOnce("bot", lock3.lockedUntil + 31 * 24 * HOUR)).ok).toBe(false);
    expect((await lockRow("bot")).strikes).toBe(1);
  });

  it("locks when the daily budget is exceeded, and when the monthly budget is exceeded", async () => {
    await setCfg({ ai_burst_calls: 500 });
    let r: Awaited<ReturnType<typeof guardAi>> = { ok: true };
    let n = 0;
    while (r.ok && n < 100) {
      r = await guardAi(db(), env, u("spender"), "document", 100_000, T0 + n * 1000);
      n++;
    }
    expect(n).toBe(7); // six 10 cent document reads = 60 cents, the 7th is refused
    expect((await lockRow("spender")).reason).toMatch(/^daily/);
    // 55 cents a day is under the daily budget but the 400 cent month runs out on the 8th day
    let tripped = -1;
    for (let d = 0; d < 12 && tripped < 0; d++) {
      const day = T0 + (d + 3) * 24 * HOUR;
      for (let i = 0; i < 5; i++) {
        const x = await guardAi(db(), env, u("steady"), "document", 110_000, day + i * 1000);
        if (!x.ok) {
          tripped = d;
          break;
        }
      }
    }
    expect(tripped).toBe(7);
    expect((await lockRow("steady")).reason).toMatch(/^monthly/);
    expect(await spendThisMonth(db(), "steady", T0 + 10 * 24 * HOUR)).toBeLessThanOrEqual(400 * 10_000);
  });

  it("keeps people apart and honours the switch", async () => {
    await burstOnce("x1", T0);
    expect((await guardAi(db(), env, u("x1"), "voice", 3000, T0 + 40_000)).ok).toBe(false);
    expect((await guardAi(db(), env, u("x2"), "voice", 3000, T0 + 40_000)).ok).toBe(true);
    await setCfg({ ai_guard_enabled: 0 });
    expect((await guardAi(db(), env, u("x1"), "voice", 3000, T0 + 41_000)).ok).toBe(true);
    expect(await spendToday(db(), "x1", T0 + 41_000)).toBe(20 * 3000);
  });

  it("bills Azure per page, once, and twice when the second model runs", async () => {
    expect(azureCostMicros(3)).toBe(30_000);
    expect(azureCostMicros(3, 2)).toBe(60_000);
    const id = "azure";
    expect((await guardAi(db(), env, u(id), "document", azureCostMicros(2), T0)).ok).toBe(true);
    await chargeAi(db(), env, u(id), azureCostMicros(5, 1) - azureCostMicros(2), T0);
    expect(await spendToday(db(), id, T0)).toBe(50_000);
    await chargeAi(db(), env, u(id), -999_999_999, T0);
    expect(await spendToday(db(), id, T0)).toBe(0);
  });
});

async function lock(userId: string, hours = 24) {
  const now = Date.now();
  await env.DB.prepare("INSERT INTO ai_lockouts (user_id, locked_until, reason, strikes, last_strike_at, created_at) VALUES (?, ?, 'test', 1, ?, ?)")
    .bind(userId, now + hours * HOUR - 1000, now, now)
    .run();
}
const post = (token: string, path: string, body: unknown) =>
  app.request(path, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(body) }, { ...env, OPENAI_API_KEY: "sk-test" });
const MSG = /^You have reached the limit for smart features \(scanning, voice and document reading\) for now\. They will be available again in about 24 hours\. You can still add transactions manually\.$/;

describe("a locked person", () => {
  it("gets the friendly refusal from every AI route family in its own shape", async () => {
    const { id, token } = await makeUser({ pro: true });
    await lock(id);
    const scan = await api("POST", "/api/ai/scan", { token, body: { imageBase64: "AAAA" } });
    expect(scan.json.success).toBe(false);
    expect(scan.json.error).toMatch(MSG);
    expect((await api("POST", "/api/ai/scan-text", { token, body: { text: "Total 12.00 Coffee shop" } })).json.error).toMatch(MSG);
    expect((await api("POST", "/api/ai/voice/parse", { token, body: { text: "coffee 3" } })).json.error).toMatch(MSG);
    expect((await api("POST", "/api/ai/voice/transcribe", { token, body: { audioBase64: "AAAA" } })).json.error).toMatch(MSG);
    expect((await api("POST", "/api/ai/voice/transaction", { token, body: { audioBase64: "AAAA" } })).json.error).toMatch(MSG);
    expect((await api("POST", "/api/ai/coach", { token, body: { periodLabel: "x", rows: [], messages: [{ role: "user", content: "hi" }] } })).json.error).toMatch(MSG);
    expect((await api("POST", "/api/ai/money-leaks", { token, body: { periodLabel: "x", rows: [] } })).json.error).toMatch(MSG);
    const grid = [["a", "b"], ["1", "2"]];
    for (const [path, body] of [
      ["/api/uploads/ai/map-columns", { grid }],
      ["/api/uploads/ai/extract", { text: "01-10-2026 Shop 2000" }],
    ] as const) {
      const res = await post(token, path, body);
      expect(res.status).toBe(429);
      expect(((await res.json()) as { error: string }).error).toMatch(MSG);
    }
  });

  it("can still add transactions manually, read data, and see the status note", async () => {
    const { id, token } = await makeUser({ pro: true });
    await lock(id);
    await api("POST", "/api/accounts/ensure-seed", { token, body: { workspace: "personal" } });
    const created = await api("POST", "/api/transactions", { token, body: { workspace: "personal", amount: 9, type: "expense", category: "Food & Dining", date: "2026-10-01" } });
    expect(created.status).toBe(201);
    expect((await api("GET", "/api/transactions", { token })).status).toBe(200);
    expect((await api("GET", "/api/accounts?workspace=personal", { token })).status).toBe(200);
    const st = await api("GET", "/api/me/ai-status", { token });
    expect(st.json.locked).toBe(true);
    expect(st.json.until).toBeGreaterThan(Date.now());
    const other = await makeUser({ pro: true });
    expect((await api("GET", "/api/me/ai-status", { token: other.token })).json).toEqual({ locked: false, until: null });
  });

  it("is not refused when the guard switch is off", async () => {
    const { id, token } = await makeUser({ pro: true });
    await lock(id);
    await setCfg({ ai_guard_enabled: 0 });
    const r = await api("POST", "/api/ai/voice/parse", { token, body: { text: "coffee 3" } });
    expect(r.json.error ?? "").not.toMatch(/smart features/);
  });
});

describe("admin AI guard endpoints", () => {
  it("require sign-in, the allowlist and the secret", async () => {
    expect((await api("GET", "/api/admin/ai-guard")).status).toBe(401);
    const { token } = await makeUser({ pro: true });
    expect((await api("GET", "/api/admin/ai-guard", { token, headers: admin })).status).toBe(403);
    const boss = await makeUser({ email: "boss@example.com" });
    expect((await api("GET", "/api/admin/ai-guard", { token: boss.token })).status).toBe(403);
  });

  it("shows settings, locked people and top spenders; sanitises settings; unlocks with an audit row", async () => {
    const boss = await makeUser({ email: "boss@example.com" });
    const h = { token: boss.token, headers: admin };
    const victim = await makeUser({ email: "victim@example.com", pro: true });
    await guardAi(db(), env, u(victim.id), "scan", 10_000);
    await lock(victim.id);
    const view = await api("GET", "/api/admin/ai-guard", h);
    expect(view.status).toBe(200);
    expect(view.json.settings).toEqual({ dailyBudgetCents: 60, monthlyBudgetCents: 400, burstCalls: 20, enabled: true });
    expect(view.json.lockedUsers[0]).toMatchObject({ userId: victim.id, email: "victim@example.com", reason: "test", strikes: 1, spentTodayMicros: 10_000 });
    expect(view.json.topToday[0]).toMatchObject({ userId: victim.id, micros: 10_000 });
    expect(view.json.topMonth.length).toBe(1);

    const put = await api("PUT", "/api/admin/ai-guard/settings", { ...h, body: { dailyBudgetCents: -5, monthlyBudgetCents: 99999999, burstCalls: 12.7, enabled: false } });
    expect(put.json.settings).toEqual({ dailyBudgetCents: 1, monthlyBudgetCents: 100000, burstCalls: 12, enabled: false });
    expect((await api("PUT", "/api/admin/ai-guard/settings", { ...h, body: { burstCalls: "lots" } })).status).toBe(400);

    const un = await api("POST", "/api/admin/ai-guard/unlock", { ...h, body: { userId: victim.id } });
    expect(un.json).toEqual({ ok: true, unlocked: true });
    expect((await api("GET", "/api/me/ai-status", { token: victim.token })).json.locked).toBe(false);
    const logs = await api("GET", "/api/admin/audit-logs", h);
    const actions = (logs.json as { action: string }[]).map((l) => l.action);
    expect(actions).toContain("ai-guard.unlock");
    expect(actions).toContain("ai-guard.settings");
  });
});
