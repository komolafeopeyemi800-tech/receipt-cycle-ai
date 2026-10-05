/**
 * Contract test: the REAL client library used by the web and mobile apps, talking to the REAL Worker.
 * If a route, a field name or an error message changes on either side, this fails.
 */
import { env } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../src/index";
import { ApiClient, ApiRequestError } from "../../../apps/mobile/src/lib/api/client";
import { api } from "../../../apps/mobile/src/lib/api/registry";
import { describeParse, importInChunks } from "../../../apps/mobile/src/lib/statementUpload";
import { apiStatementTools } from "../../../apps/mobile/src/lib/statementParse/apiTools";
import { readStatement } from "../../../apps/mobile/src/lib/statementParse/pipeline";
import { testEngine } from "./anydocEngine";
import { makeImageOnlyPdf } from "./fixtures";

afterEach(() => vi.unstubAllGlobals());

function makeClient(e: typeof env = env) {
  return new ApiClient({
    baseUrl: "http://localhost",
    webAppUrl: "http://localhost",
    fetch: ((url: string, init?: RequestInit) => {
      const u = new URL(url);
      return app.request(`${u.pathname}${u.search}`, init, e);
    }) as typeof fetch,
  });
}

async function signedIn(email = "ada@example.com") {
  const client = makeClient();
  const res = await client.action(api.authNode.signUp, { email, password: "secret123", name: "Ada" });
  client.setToken(res.token);
  return { client, res };
}

describe("sign-in calls", () => {
  it("signUp / signIn return the shape the screens expect", async () => {
    const { res } = await signedIn();
    expect(res).toMatchObject({ user: { email: "ada@example.com", name: "Ada" }, isNewRegistration: true });
    const again = await makeClient().action(api.authNode.signIn, { email: "ada@example.com", password: "secret123" });
    expect(again).toMatchObject({ isNewRegistration: false, user: { id: res.user.id } });
  });

  it("keeps the old, friendly error messages", async () => {
    await signedIn();
    const c = makeClient();
    await expect(c.action(api.authNode.signIn, { email: "ada@example.com", password: "nope" })).rejects.toThrow("Invalid email or password.");
    await expect(c.action(api.authNode.signUp, { email: "ada@example.com", password: "secret123" })).rejects.toThrow("Email already registered.");
    await expect(c.action(api.authNode.signUp, { email: "new@example.com", password: "123" })).rejects.toThrow("Password must be at least 6 characters.");
  });

  it("me / subscription / signOut", async () => {
    const { client, res } = await signedIn();
    expect(await client.query(api.auth.me, {})).toEqual({ id: res.user.id, email: "ada@example.com", name: "Ada" });
    expect(await client.query(api.subscription.getSubscriptionState, {})).toMatchObject({ phase: "trial", pro: false });
    expect(await client.mutation(api.subscription.bootstrapSubscription, {})).toEqual({ ok: true });
    await client.mutation(api.auth.signOut, { token: res.token });
    expect(await client.query(api.auth.me, { token: res.token })).toBeNull();
  });

  it("returns null / empty instead of throwing when signed out", async () => {
    const c = makeClient();
    expect(await c.query(api.auth.me, {})).toBeNull();
    expect(await c.query(api.subscription.getSubscriptionState, {})).toBeNull();
    expect(await c.query(api.transactions.list, { workspace: "personal" })).toEqual([]);
    expect(await c.query(api.accounts.list, { workspace: "personal" })).toEqual([]);
    expect(await c.query(api.workspaces.listAll, {})).toEqual([{ id: "personal", name: "Personal", sub: "INDIVIDUAL" }]);
    expect(await c.query(api.userPreferences.get, {})).toBeNull();
    expect(await c.query(api.admin.isCurrentUserAdmin, {})).toBe(false);
    expect((await c.query(api.admin.publicConfig, {})).scannerEnabled).toBe(true);
  });

  it("password reset round trip", async () => {
    await signedIn("reset@example.com");
    let html = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_u: string, init: RequestInit) => {
        html = JSON.parse(String(init.body)).html;
        return new Response("{}", { status: 200 });
      }),
    );
    const c = makeClient();
    // The client's own fetch goes to the Worker; the Worker's outbound email call hits the stub.
    expect(await c.action(api.authNode.requestPasswordReset, { email: "reset@example.com" })).toMatchObject({ ok: true });
    const token = /font-family:monospace">([^<]+)</.exec(html)![1];
    await c.action(api.authNode.resetPasswordWithToken, { token, newPassword: "brand-new-1" });
    await expect(c.action(api.authNode.resetPasswordWithToken, { token, newPassword: "again-pass-2" })).rejects.toBeInstanceOf(ApiRequestError);
    expect(await c.action(api.authNode.signIn, { email: "reset@example.com", password: "brand-new-1" })).toMatchObject({ isNewRegistration: false });
  });

  it("changePassword", async () => {
    const { client, res } = await signedIn();
    await expect(client.action(api.authNode.changePassword, { token: res.token, currentPassword: "wrong!!", newPassword: "next-pass-1" })).rejects.toThrow("Current password is incorrect.");
    await client.action(api.authNode.changePassword, { token: res.token, currentPassword: "secret123", newPassword: "next-pass-1" });
    await client.action(api.authNode.signIn, { email: "ada@example.com", password: "next-pass-1" });
  });
});

describe("money data calls", () => {
  it("accounts, categories, transactions and budgets work end to end", async () => {
    const { client } = await signedIn();
    const ws = "personal";
    await client.mutation(api.accounts.ensureSeed, { workspace: ws });
    await client.mutation(api.categories.ensureSeed, { workspace: ws });
    const accounts = await client.query(api.accounts.list, { workspace: ws });
    expect(accounts.map((a) => a.name)).toEqual(["Card", "Cash", "Savings"]);
    expect(accounts[0]).toMatchObject({ balance: 0, iconKey: "credit-card" });
    expect((await client.query(api.categories.list, { workspace: ws })).length).toBe(10);

    const acc = accounts[0]!;
    expect(await client.query(api.accounts.get, { id: acc.id, workspace: ws })).toMatchObject({ name: "Card" });
    expect(await client.query(api.accounts.get, { id: "missing", workspace: ws })).toBeNull();
    await client.mutation(api.accounts.update, { id: acc.id, name: "Main card" });
    const newAcc = await client.mutation(api.accounts.create, { workspace: ws, name: "Petty cash" });
    expect(typeof newAcc).toBe("string");

    const id = await client.mutation(api.transactions.create, {
      workspace: ws, amount: 30, type: "expense", category: "Bills", date: "2026-10-01", accountId: acc.id, merchant: "Power Co", tags: ["x"],
    });
    expect(typeof id).toBe("string");
    const list = await client.query(api.transactions.list, { workspace: ws, startDate: "2026-10-01" });
    expect(list[0]).toMatchObject({ id, amount: 30, merchant: "Power Co", accountId: acc.id });
    expect((await client.query(api.accounts.get, { id: acc.id, workspace: ws }))!.balance).toBe(-30);
    expect(await client.query(api.transactions.get, { id })).toMatchObject({ category: "Bills" });
    expect(await client.query(api.transactions.get, { id: "nope" })).toBeNull();

    await client.mutation(api.transactions.update, { id, workspace: ws, amount: 10, type: "expense", category: "Bills", date: "2026-10-01", accountId: acc.id });
    expect((await client.query(api.accounts.get, { id: acc.id, workspace: ws }))!.balance).toBe(-10);

    const bulk = await client.mutation(api.transactions.bulkImport, {
      workspace: ws, rows: [{ amount: 1, type: "expense", category: "Other", date: "2026-10-02" }],
    });
    expect(bulk).toEqual({ inserted: 1, truncated: false });
    await client.mutation(api.transactions.seedDemo, { workspace: ws });
    await client.mutation(api.transactions.remove, { id });
    expect((await client.query(api.transactions.list, { workspace: ws })).length).toBe(2);

    const catId = await client.mutation(api.categories.create, { workspace: ws, name: "Pets", kind: "expense", color: "#abc" });
    await client.mutation(api.categories.update, { id: catId, name: "Pet care" });
    await client.mutation(api.categories.remove, { id: catId });

    const budgetId = await client.mutation(api.budgets.upsert, { workspace: ws, category: "Bills", month: "2026-10", limitAmount: 90 });
    expect(await client.query(api.budgets.listForMonth, { workspace: ws, month: "2026-10" })).toEqual([
      { id: budgetId, category: "Bills", month: "2026-10", limitAmount: 90 },
    ]);
  });

  it("export is Pro only and says so", async () => {
    const { client } = await signedIn();
    await expect(client.query(api.transactions.exportForBackup, {})).rejects.toThrow(/CSV export is available for Pro/);
  });

  it("preferences and workspaces", async () => {
    const { client } = await signedIn();
    await client.mutation(api.userPreferences.upsert, {
      userId: "ignored", currency: "NGN", dateFormat: "eu", merchants: ["Shoprite"], locations: [], voiceInputLanguage: "en",
    });
    expect(await client.query(api.userPreferences.get, {})).toMatchObject({ currency: "NGN", voiceInputLanguage: "en" });

    const slug = await client.mutation(api.workspaces.create, { name: "Team" });
    expect((await client.query(api.workspaces.listAll, {})).map((w) => w.id)).toEqual(["personal", slug]);
    const invite = await client.mutation(api.workspaces.createInvite, { workspaceKey: slug, email: "m@example.com" });
    const { client: member } = await signedIn("member@example.com");
    expect(await member.mutation(api.workspaces.acceptInvite, { token: invite })).toEqual({ workspaceKey: slug });
    await client.mutation(api.workspaces.removeTeamWorkspace, { slug });
  });

  it("reset data and delete account", async () => {
    const { client, res } = await signedIn();
    await client.mutation(api.transactions.seedDemo, {});
    await client.mutation(api.auth.resetMyData, { token: res.token });
    expect(await client.query(api.transactions.list, { workspace: "personal" })).toEqual([]);
    await client.mutation(api.auth.deleteMyAccount, { token: res.token });
    expect(await client.query(api.auth.me, {})).toBeNull();
  });
});

describe("AI + contact calls", () => {
  it("are gated for expired trials and the contact form works anonymously", async () => {
    const { client } = await signedIn();
    // Fresh trial with no keys configured: a clean "no keys" answer, not a crash.
    const scan = await client.action(api.scanReceipt.scanFromBase64, { imageBase64: "aGk=", mimeType: "image/jpeg" });
    expect(scan).toMatchObject({ success: true, extracted_data: null });
    const coach = await client.action(api.voiceFinance.financeCoachChat, { periodLabel: "x", rows: [], messages: [{ role: "user", content: "hi" }] });
    expect(coach).toMatchObject({ ok: false, reply: "" });

    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    const sent = await makeClient().action(api.email.sendContactMessage, { name: "A", email: "a@b.com", message: "hello there" });
    expect(sent).toEqual({ ok: true, delivered: true });
  });
});

describe("admin calls", () => {
  it("use the secret header and the signed-in admin email", async () => {
    const { client } = await signedIn("boss@example.com");
    const secret = "admin-secret";
    expect(await client.query(api.admin.isCurrentUserAdmin, {})).toBe(true);
    await expect(client.action(api.admin.validateAccess, { secret: "wrong" })).rejects.toThrow("Unauthorized admin access.");
    expect(await client.action(api.admin.validateAccess, { secret })).toEqual({ ok: true });
    await client.mutation(api.admin.updateConfig, { secret, adminEmail: "ignored", maintenanceMode: false, freeManualLimit: 75 });
    expect((await client.query(api.admin.adminConfig, { secret })).freeManualLimit).toBe(75);
    expect((await client.query(api.admin.dashboardStats, { secret })).totals.users).toBe(1);
    const users = await client.query(api.admin.recentUsers, { secret, limit: 10 });
    expect(users[0]).toMatchObject({ email: "boss@example.com", plan: "free" });
    await client.mutation(api.admin.setUserProSubscription, { secret, userId: users[0]!.id, proSubscriptionActive: true });
    await client.mutation(api.admin.updateUserManagement, { secret, userId: users[0]!.id, name: "Boss" });
    expect((await client.query(api.admin.recentAuditLogs, { secret })).length).toBeGreaterThan(0);
    expect(await client.query(api.admin.recentUsers, { secret })).toMatchObject([{ proSubscriptionActive: true, name: "Boss" }]);
  });
});

describe("uploads and receipts", () => {
  it("reads a big statement in the browser with no AI, then imports it in chunks", async () => {
    const { client } = await signedIn("pro@example.com");
    await env.DB.prepare("UPDATE profile SET pro_subscription_active = 1").run();
    const tools = apiStatementTools(client);
    const lines = ["Date,Description,Amount", ...Array.from({ length: 1200 }, (_, i) => `2026-10-01,Item ${i},-${(i % 9) + 1}.00`)];
    const bytes = new TextEncoder().encode(lines.join(String.fromCharCode(10)));

    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const first = await readStatement(bytes, { fileName: "big.csv", engine: testEngine, ai: tools.ai, cache: tools.cache });
    expect(first).toMatchObject({ status: "ok", source: "heuristic", cached: false, totalRows: 1200, aiCalls: 0 });
    expect(describeParse(first)).toBe("");
    expect(fetchSpy).not.toHaveBeenCalled(); // the server's AI was never involved

    const progress: number[] = [];
    const res = await importInChunks(
      first.rows,
      (rows) => client.mutation(api.transactions.bulkImport, { workspace: "personal", rows }),
      (done) => progress.push(done),
    );
    expect(res.inserted).toBe(1200);
    expect(progress).toEqual([500, 1000, 1200]);
    expect((await client.query(api.transactions.list, { workspace: "personal" })).length).toBe(1200);
  });

  it("pays for a scanned PDF once: the second read comes from the saved result", async () => {
    const withKey = { ...env, OPENAI_API_KEY: "sk-test" };
    const client = makeClient(withKey);
    const up = await client.action(api.authNode.signUp, { email: "scan@example.com", password: "secret123" });
    client.setToken(up.token);
    const tools = apiStatementTools(client);
    const spy = vi.fn(
      async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ transactions: [{ date: "2026-10-01", description: "Scanned", amount: 20, type: "expense" }] }) } }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", spy);
    const pdf = makeImageOnlyPdf();

    const first = await readStatement(pdf, { fileName: "scan.pdf", engine: testEngine, ai: tools.ai, cache: tools.cache });
    expect(first).toMatchObject({ status: "ok", source: "ai", aiCalls: 1, cached: false });
    expect(spy).toHaveBeenCalledTimes(1);

    const again = await readStatement(pdf, { fileName: "copy.pdf", engine: testEngine, ai: tools.ai, cache: tools.cache });
    expect(again).toMatchObject({ cached: true, fileName: "copy.pdf", status: "ok" });
    expect(again.rows).toEqual(first.rows);
    expect(spy).toHaveBeenCalledTimes(1); // no second AI call
    expect(describeParse(again)).toMatch(/earlier upload/);
  });

  it("explains an unsupported file instead of failing", async () => {
    const { client } = await signedIn();
    const tools = apiStatementTools(client);
    const r = await readStatement(new Uint8Array([1, 2, 3]), { fileName: "old.xls", engine: testEngine, ai: tools.ai, cache: tools.cache });
    expect(r.status).toBe("unsupported");
    expect(r.message).toMatch(/\.xlsx/);
  });

  it("stores, downloads and deletes a receipt", async () => {
    const { client } = await signedIn();
    const stored = await client.action(api.receipts.upload, { file: new File([new Uint8Array([9, 8, 7])], "r.jpg", { type: "image/jpeg" }) });
    expect(stored).toMatchObject({ size: 3, contentType: "image/jpeg" });
    const id = await client.mutation(api.transactions.create, {
      workspace: "personal", amount: 3, type: "expense", category: "Other", date: "2026-10-01", receipt_url: stored.key,
    });
    expect((await client.query(api.transactions.get, { id }))!.receipt_url).toBe(stored.key);
    const blob = await client.action(api.receipts.download, { key: stored.key });
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(new Uint8Array([9, 8, 7]));
    await client.mutation(api.receipts.remove, { key: stored.key });
    await expect(client.action(api.receipts.download, { key: stored.key })).rejects.toThrow("Receipt not found");
  });
});
