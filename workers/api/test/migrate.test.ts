import bcrypt from "bcryptjs";
import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { transform, type ConvexTables } from "../src/migrate/transform";
import { lit } from "../src/migrate/sql";
import { api } from "./helpers";

const T0 = 1_700_000_000_000;
const doc = (id: string, fields: Record<string, unknown>, n = 0) => ({ _id: id, _creationTime: T0 + n, ...fields });

const hash = bcrypt.hashSync("pa55word", 10);

/** A small but awkward Convex deployment: shared workspace, legacy email-keyed rows, team, orphans. */
const fixture = (): ConvexTables => ({
  users: [
    doc("u_ada", { email: "Ada@Example.com", passwordHash: hash, name: "Ada", proSubscriptionActive: true, plan: "pro_monthly", trialLifetimeAdds: 3 }, 1),
    doc("u_bob", { email: "bob@example.com", passwordHash: hash }, 2),
    doc("u_gus", { email: "gus@example.com", passwordHash: "placeholder", googleSub: "g-1", name: "Gus" }, 3),
    doc("u_dup", { email: "ADA@example.com", passwordHash: hash }, 4),
  ],
  sessions: [doc("s1", { userId: "u_ada", token: "x", expiresAt: 1 })],
  passwordResetTokens: [doc("r1", { userId: "u_bob", token: "x", expiresAt: 1 })],
  accounts: [
    doc("a_card", { workspace: "personal", name: "Card", balance: 999, iconKey: "credit-card" }),
    doc("a_cash", { workspace: "business", name: "Cash", balance: 50 }),
    doc("a_team", { workspace: "ws_team1", name: "Till", balance: 10 }),
    doc("a_orphan", { workspace: "ghost-ws", name: "Nobody", balance: 1 }),
  ],
  categories: [
    doc("c_food", { workspace: "personal", name: "Food", kind: "expense", color: "#f00" }),
    doc("c_team", { workspace: "ws_team1", name: "Stock", kind: "expense", color: "#0f0" }),
  ],
  budgets: [doc("b1", { workspace: "personal", category: "Food", month: "2026-10", limitAmount: 100 })],
  transactions: [
    doc("t1", { userId: "u_ada", workspace: "personal", amount: 40, type: "expense", category: "Food", date: "2026-10-01", accountId: "a_card", tags: ["x"], receipt_data: { total: 40, note: "it's; \"quoted\"\nnewline" }, entrySource: "camera", description: "line1\nline2" }, 10),
    doc("t2", { userId: "u_ada", workspace: "personal", amount: 100, type: "income", category: "Salary", date: "2026-10-02", accountId: "a_card" }, 11),
    doc("t3", { userId: "u_bob", workspace: "personal", amount: 25, type: "expense", category: "Food", date: "2026-10-03", accountId: "a_card" }, 12),
    doc("t4", { userId: "Bob@Example.com", workspace: "personal", amount: 5, type: "expense", category: "Food", date: "2026-10-04" }, 13), // legacy email key
    doc("t5", { workspace: "personal", amount: 12.5, type: "expense", category: "Food", date: "2026-10-05" }, 14), // demo row, no owner
    doc("t6", { userId: "u_ada", workspace: "business", amount: 7, type: "expense", category: "Other", date: "2026-10-06", accountId: "a_card" }, 15), // account from another workspace
    doc("t7", { userId: "u_gus", workspace: "ws_team1", amount: 9, type: "expense", category: "Stock", date: "2026-10-07", accountId: "a_team" }, 16),
  ],
  workspaces: [doc("w1", { name: "Team One", slug: "ws_team1", kind: "team", ownerUserId: "u_gus" })],
  workspaceMembers: [
    doc("m1", { workspaceKey: "ws_team1", userId: "u_gus", role: "owner" }),
    doc("m2", { workspaceKey: "ws_team1", userId: "u_ada", role: "member" }),
    doc("m3", { workspaceKey: "ws_team1", userId: "u_deleted", role: "member" }),
  ],
  workspaceInvites: [doc("i1", { workspaceKey: "ws_team1", email: "New@Example.com", token: "inv_1", status: "pending", createdAt: T0 })],
  userPreferences: [doc("p1", { userId: "u_ada", currency: "NGN", dateFormat: "eu", merchants: ["Shoprite"], locations: [{ id: "1", label: "Shop", address: "Lagos" }] })],
  appConfig: [doc("cfg", { key: "global", maintenanceMode: false, freeManualLimit: 80, updatedAt: T0 })],
  adminAuditLogs: [doc("l1", { action: "config.update", actor: "ada@example.com", details: "{}", createdAt: T0 })],
  whopEntitlements: [doc("e1", { email: "Ada@Example.com", whopUserId: "user_1", subscriptionStatus: "pro_monthly", proActive: true, lastEventType: "membership.activated", lastEventAt: T0 })],
});

async function load(tables = fixture()) {
  const result = await transform(tables);
  await env.DB.exec(result.statements.join("\n"));
  return result;
}

const count = async (sql: string, ...binds: unknown[]) => (await env.DB.prepare(sql).bind(...binds).first<{ n: number }>())!.n;

describe("SQL literals", () => {
  it("escapes quotes and keeps each statement on one line", () => {
    expect(lit("it's")).toBe("'it''s'");
    expect(lit("a\nb")).toBe("'a' || char(10) || 'b'");
    expect(lit(null)).toBe("NULL");
    expect(lit(Number.NaN)).toBe("NULL");
    expect(lit(true)).toBe("1");
  });
});

describe("Convex to D1 migration", () => {
  it("reports what it skipped instead of guessing", async () => {
    const { report } = await transform(fixture());
    expect(report.skippedByDesign).toEqual({ sessions: 1, passwordResetTokens: 1 });
    expect(report.problems.duplicateEmails).toEqual(["ada@example.com"]);
    expect(report.problems.transactionsWithoutKnownOwner).toEqual(["t5"]);
    expect(report.problems.transactionsWithMissingAccount).toEqual(["t6"]);
    expect(report.problems.membersWithoutKnownUser).toEqual(["ws_team1:u_deleted"]);
    expect(report.problems.sharedRowsWithNoUsers.accounts).toBe(1);
    expect(report.sharedWorkspaces.find((w) => w.workspace === "personal")).toMatchObject({ users: 2, balances: "recomputed" });
    expect(report.sharedWorkspaces.find((w) => w.workspace === "business")).toMatchObject({ users: 1, balances: "kept" });
  });

  it("imports users, profiles and credentials", async () => {
    await load();
    expect(await count("SELECT count(*) AS n FROM user")).toBe(3);
    expect(await count("SELECT count(*) AS n FROM session")).toBe(0);
    const ada = await env.DB.prepare("SELECT u.email, u.name, p.pro_subscription_active AS pro, p.plan, p.trial_lifetime_adds AS adds, p.legacy_convex_id AS legacy FROM user u JOIN profile p ON p.user_id = u.id WHERE u.email = 'ada@example.com'").first<any>();
    expect(ada).toMatchObject({ name: "Ada", pro: 1, plan: "pro_monthly", adds: 3, legacy: "u_ada" });
    const gus = await env.DB.prepare("SELECT u.email_verified AS v, p.google_sub AS g FROM user u JOIN profile p ON p.user_id = u.id WHERE u.email = 'gus@example.com'").first<any>();
    expect(gus).toEqual({ v: 1, g: "g-1" });
  });

  it("lets a migrated user sign in with the old password, then rehashes it", async () => {
    await load();
    const bad = await api("POST", "/api/auth/sign-in/email", { body: { email: "bob@example.com", password: "wrong" } });
    expect(bad.status).toBe(401);
    const ok = await api("POST", "/api/auth/sign-in/email", { body: { email: "BOB@example.com", password: "pa55word" } });
    expect(ok.status).toBe(200);
    const me = await api("GET", "/api/transactions?workspace=personal", { token: ok.json.token });
    expect(me.json.map((t: any) => t.amount).sort((a: number, b: number) => a - b)).toEqual([5, 25]); // t3 and the legacy email-keyed t4
    const row = await env.DB.prepare("SELECT password FROM account a JOIN user u ON u.id = a.user_id WHERE u.email = 'bob@example.com'").first<{ password: string }>();
    expect(row!.password.startsWith("$2")).toBe(false);
  });

  it("gives each user private accounts and recomputes shared balances", async () => {
    await load();
    const ada = await env.DB.prepare("SELECT id FROM user WHERE email = 'ada@example.com'").first<{ id: string }>();
    const bob = await env.DB.prepare("SELECT id FROM user WHERE email = 'bob@example.com'").first<{ id: string }>();
    const balance = (userId: string) =>
      env.DB.prepare("SELECT balance FROM accounts WHERE scope = ?").bind(`u:${userId}:personal`).first<{ balance: number }>();
    expect((await balance(ada!.id))!.balance).toBe(60); // -40 + 100, not the shared 999
    expect((await balance(bob!.id))!.balance).toBe(-25);
    // Single-user workspace keeps the stored balance.
    const cash = await env.DB.prepare("SELECT balance FROM accounts WHERE scope = ?").bind(`u:${ada!.id}:business`).first<{ balance: number }>();
    expect(cash!.balance).toBe(50);
    // Orphaned shared rows are not copied anywhere.
    expect(await count("SELECT count(*) AS n FROM accounts WHERE name = 'Nobody'")).toBe(0);
    // Transactions point at their owner's own copy of the account.
    const t1 = await env.DB.prepare("SELECT account_id FROM transactions WHERE category = 'Food' AND amount = 40").first<{ account_id: string }>();
    const own = await env.DB.prepare("SELECT scope FROM accounts WHERE id = ?").bind(t1!.account_id).first<{ scope: string }>();
    expect(own!.scope).toBe(`u:${ada!.id}:personal`);
  });

  it("keeps team workspaces shared and membership intact", async () => {
    await load();
    expect(await count("SELECT count(*) AS n FROM accounts WHERE scope = 'ws:ws_team1'")).toBe(1);
    expect(await count("SELECT count(*) AS n FROM categories WHERE scope = 'ws:ws_team1'")).toBe(1);
    expect(await count("SELECT count(*) AS n FROM workspace_members WHERE workspace_key = 'ws_team1'")).toBe(2);
    const w = await env.DB.prepare("SELECT w.owner_user_id AS o, u.email FROM workspaces w JOIN user u ON u.id = w.owner_user_id WHERE w.slug = 'ws_team1'").first<any>();
    expect(w.email).toBe("gus@example.com");
  });

  it("preserves tricky transaction fields", async () => {
    await load();
    const row = await env.DB.prepare("SELECT description, tags, receipt_data AS rd, entry_source AS src FROM transactions WHERE amount = 40").first<any>();
    expect(row.description).toBe("line1\nline2");
    expect(JSON.parse(row.tags)).toEqual(["x"]);
    expect(JSON.parse(row.rd)).toEqual({ total: 40, note: 'it\'s; "quoted"\nnewline' });
    expect(row.src).toBe("camera");
    expect(await count("SELECT count(*) AS n FROM transactions")).toBe(6); // 7 minus the demo row without an owner (t5)
    expect(await count("SELECT count(*) AS n FROM transactions WHERE amount = 7 AND account_id IS NULL")).toBe(1);
  });

  it("carries config, preferences, audit log and Whop entitlements", async () => {
    await load();
    expect(await count("SELECT count(*) AS n FROM app_config WHERE key = 'global' AND free_manual_limit = 80")).toBe(1);
    expect(await count("SELECT count(*) AS n FROM user_preferences WHERE currency = 'NGN'")).toBe(1);
    expect(await count("SELECT count(*) AS n FROM admin_audit_logs")).toBe(1);
    expect(await count("SELECT count(*) AS n FROM whop_entitlements WHERE email = 'ada@example.com' AND pro_active = 1")).toBe(1);
    expect(await count("SELECT count(*) AS n FROM workspace_invites WHERE email = 'new@example.com'")).toBe(1);
  });

  it("can be run twice without duplicating anything", async () => {
    const first = await load();
    await env.DB.exec(first.statements.join("\n"));
    expect(await count("SELECT count(*) AS n FROM user")).toBe(3);
    expect(await count("SELECT count(*) AS n FROM transactions")).toBe(6);
    expect(await count("SELECT count(*) AS n FROM accounts")).toBe(first.report.written.accounts);
  });
});
