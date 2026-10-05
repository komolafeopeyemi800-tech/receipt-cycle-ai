import { describe, expect, it } from "vitest";
import { api, makeUser } from "./helpers";

describe("accounts and categories are private per user", () => {
  it("seeds defaults once and keeps each user's rows separate", async () => {
    const a = await makeUser();
    const b = await makeUser();
    await api("POST", "/api/accounts/ensure-seed", { token: a.token, body: { workspace: "personal" } });
    await api("POST", "/api/accounts/ensure-seed", { token: a.token, body: { workspace: "personal" } });
    const aList = await api("GET", "/api/accounts?workspace=personal", { token: a.token });
    expect(aList.json.map((x: any) => x.name)).toEqual(["Card", "Cash", "Savings"]);
    expect((await api("GET", "/api/accounts?workspace=personal", { token: b.token })).json).toEqual([]);

    const patch = await api("PATCH", `/api/accounts/${aList.json[0].id}`, { token: b.token, body: { name: "hijack" } });
    expect(patch.status).toBe(404);
  });

  it("creates, edits and deletes categories and rejects duplicates", async () => {
    const { token } = await makeUser();
    await api("POST", "/api/categories/ensure-seed", { token, body: { workspace: "personal" } });
    expect((await api("GET", "/api/categories?workspace=personal", { token })).json).toHaveLength(10);

    const created = await api("POST", "/api/categories", { token, body: { workspace: "personal", name: "Pets", kind: "expense", color: "#fff" } });
    expect(created.status).toBe(201);
    const dup = await api("POST", "/api/categories", { token, body: { workspace: "personal", name: "pets", kind: "expense", color: "#fff" } });
    expect(dup.status).toBe(409);

    await api("PATCH", `/api/categories/${created.json.id}`, { token, body: { name: "Pet care" } });
    const names = (await api("GET", "/api/categories?workspace=personal", { token })).json.map((c: any) => c.name);
    expect(names).toContain("Pet care");
    expect((await api("DELETE", `/api/categories/${created.json.id}`, { token })).status).toBe(200);
  });
});

describe("budgets", () => {
  it("upserts one budget per category and month", async () => {
    const { token } = await makeUser();
    const body = { workspace: "personal", category: "Bills", month: "2026-10", limitAmount: 100 };
    const first = await api("PUT", "/api/budgets", { token, body });
    const second = await api("PUT", "/api/budgets", { token, body: { ...body, limitAmount: 250 } });
    expect(second.json.id).toBe(first.json.id);
    const list = await api("GET", "/api/budgets?workspace=personal&month=2026-10", { token });
    expect(list.json).toEqual([{ id: first.json.id, category: "Bills", month: "2026-10", limitAmount: 250 }]);
    expect((await api("GET", "/api/budgets?workspace=personal", { token })).status).toBe(400);
  });
});

describe("team workspaces", () => {
  it("lets invited members share accounts and blocks outsiders", async () => {
    const owner = await makeUser();
    const member = await makeUser({ email: "member@example.com" });
    const outsider = await makeUser();

    const ws = await api("POST", "/api/workspaces", { token: owner.token, body: { name: "Shop" } });
    const slug = ws.json.slug as string;
    expect(slug.startsWith("ws_")).toBe(true);

    await api("POST", "/api/accounts", { token: owner.token, body: { workspace: slug, name: "Till" } });
    expect((await api("GET", `/api/accounts?workspace=${slug}`, { token: outsider.token })).status).toBe(403);

    const invite = await api("POST", `/api/workspaces/${slug}/invites`, { token: owner.token, body: { email: "member@example.com" } });
    expect((await api("POST", `/api/workspaces/${slug}/invites`, { token: outsider.token, body: { email: "x@example.com" } })).status).toBe(403);
    const accepted = await api("POST", "/api/workspaces/accept-invite", { token: member.token, body: { token: invite.json.token } });
    expect(accepted.json).toEqual({ workspaceKey: slug });
    expect((await api("POST", "/api/workspaces/accept-invite", { token: member.token, body: { token: invite.json.token } })).status).toBe(400);

    const accounts = await api("GET", `/api/accounts?workspace=${slug}`, { token: member.token });
    expect(accounts.json.map((a: any) => a.name)).toEqual(["Till"]);
    expect((await api("GET", "/api/workspaces", { token: member.token })).json.map((w: any) => w.id)).toEqual(["personal", slug]);

    expect((await api("DELETE", `/api/workspaces/${slug}`, { token: member.token })).status).toBe(403);
    expect((await api("DELETE", `/api/workspaces/${slug}`, { token: owner.token })).status).toBe(200);
    expect((await api("GET", `/api/accounts?workspace=${slug}`, { token: member.token })).status).toBe(403);
  });
});

describe("preferences", () => {
  it("round-trips preferences", async () => {
    const { token } = await makeUser();
    expect((await api("GET", "/api/preferences", { token })).json).toBeNull();
    const prefs = {
      currency: "NGN",
      dateFormat: "eu",
      merchants: ["Shoprite"],
      locations: [{ id: "1", label: "Shop", address: "Lagos" }],
      reimbursements: true,
    };
    expect((await api("PUT", "/api/preferences", { token, body: prefs })).status).toBe(200);
    await api("PUT", "/api/preferences", { token, body: { ...prefs, currency: "USD" } });
    expect((await api("GET", "/api/preferences", { token })).json).toMatchObject({ currency: "USD", merchants: ["Shoprite"], reimbursements: true });
  });
});
