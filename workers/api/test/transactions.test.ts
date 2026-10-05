import { describe, expect, it } from "vitest";
import { api, makeUser } from "./helpers";

const txn = (over: Record<string, unknown> = {}) => ({
  workspace: "personal",
  amount: 12.5,
  type: "expense",
  category: "Food & Dining",
  date: "2026-10-01",
  ...over,
});

async function seededAccount(token: string, workspace = "personal") {
  await api("POST", "/api/accounts/ensure-seed", { token, body: { workspace } });
  const list = await api("GET", `/api/accounts?workspace=${workspace}`, { token });
  return list.json as { id: string; name: string; balance: number }[];
}

describe("auth", () => {
  it("rejects requests without a valid session", async () => {
    expect((await api("GET", "/api/transactions")).status).toBe(401);
    expect((await api("GET", "/api/transactions", { token: "nope" })).status).toBe(401);
  });
});

describe("transactions", () => {
  it("creates, lists, reads, updates and deletes a transaction", async () => {
    const { token } = await makeUser({ pro: true });
    const created = await api("POST", "/api/transactions", { token, body: txn({ merchant: "Cafe", tags: ["a"] }) });
    expect(created.status).toBe(201);
    const id = created.json.id as string;

    const list = await api("GET", "/api/transactions?workspace=personal", { token });
    expect(list.json).toHaveLength(1);
    expect(list.json[0]).toMatchObject({ id, amount: 12.5, merchant: "Cafe", tags: ["a"], description: null });

    const updated = await api("PUT", `/api/transactions/${id}`, { token, body: txn({ amount: 20, category: "Bills" }) });
    expect(updated.status).toBe(200);
    expect((await api("GET", `/api/transactions/${id}`, { token })).json).toMatchObject({ amount: 20, category: "Bills" });

    expect((await api("DELETE", `/api/transactions/${id}`, { token })).status).toBe(200);
    expect((await api("GET", `/api/transactions/${id}`, { token })).status).toBe(404);
  });

  it("filters by date range and sorts newest first", async () => {
    const { token } = await makeUser({ pro: true });
    for (const date of ["2026-09-01", "2026-10-05", "2026-10-01"]) {
      await api("POST", "/api/transactions", { token, body: txn({ date }) });
    }
    const all = await api("GET", "/api/transactions", { token });
    expect(all.json.map((t: any) => t.date)).toEqual(["2026-10-05", "2026-10-01", "2026-09-01"]);
    const ranged = await api("GET", "/api/transactions?startDate=2026-10-01&endDate=2026-10-31", { token });
    expect(ranged.json).toHaveLength(2);
  });

  it("adjusts the account balance on create, update and delete", async () => {
    const { token } = await makeUser({ pro: true });
    const [card] = await seededAccount(token);
    const balance = async () => ((await seededAccount(token)).find((a) => a.id === card.id)!).balance;

    const created = await api("POST", "/api/transactions", { token, body: txn({ amount: 40, accountId: card.id }) });
    expect(await balance()).toBe(-40);

    await api("PUT", `/api/transactions/${created.json.id}`, { token, body: txn({ amount: 15, type: "income", accountId: card.id }) });
    expect(await balance()).toBe(15);

    await api("DELETE", `/api/transactions/${created.json.id}`, { token });
    expect(await balance()).toBe(0);
  });

  it("never shows one user's data to another", async () => {
    const a = await makeUser({ pro: true });
    const b = await makeUser({ pro: true });
    const created = await api("POST", "/api/transactions", { token: a.token, body: txn() });
    expect((await api("GET", "/api/transactions", { token: b.token })).json).toEqual([]);
    expect((await api("GET", `/api/transactions/${created.json.id}`, { token: b.token })).status).toBe(404);
    expect((await api("DELETE", `/api/transactions/${created.json.id}`, { token: b.token })).status).toBe(404);
  });

  it("validates input", async () => {
    const { token } = await makeUser({ pro: true });
    const bad = await api("POST", "/api/transactions", { token, body: { workspace: "personal" } });
    expect(bad.status).toBe(400);
  });

  it("blocks creation after the trial transaction cap and counts adds", async () => {
    const { token } = await makeUser({ trialAdds: 24 });
    expect((await api("POST", "/api/transactions", { token, body: txn() })).status).toBe(201);
    const blocked = await api("POST", "/api/transactions", { token, body: txn() });
    expect(blocked.status).toBe(402);
    expect(blocked.json.error).toMatch(/used all 25 trial transactions/);
    const sub = await api("GET", "/api/subscription", { token });
    expect(sub.json).toMatchObject({ phase: "trial_exhausted", trialAddsUsed: 25 });
  });

  it("makes an expired trial view-only", async () => {
    const { token } = await makeUser({ createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000 });
    expect((await api("POST", "/api/transactions", { token, body: txn() })).status).toBe(402);
    expect((await api("GET", "/api/transactions", { token })).status).toBe(200);
  });

  it("limits CSV export to Pro", async () => {
    const free = await makeUser();
    expect((await api("GET", "/api/transactions/export", { token: free.token })).status).toBe(402);
    const pro = await makeUser({ pro: true });
    await api("POST", "/api/transactions", { token: pro.token, body: txn() });
    const exp = await api("GET", "/api/transactions/export", { token: pro.token });
    expect(exp.status).toBe(200);
    expect(exp.json).toHaveLength(1);
  });

  it("respects admin maintenance mode", async () => {
    const { token } = await makeUser({ pro: true });
    const admin = await makeUser({ email: "boss@example.com" });
    const put = await api("PUT", "/api/admin/config", {
      token: admin.token,
      headers: { "x-admin-secret": "admin-secret" },
      body: { maintenanceMode: true },
    });
    expect(put.status).toBe(200);
    const res = await api("POST", "/api/transactions", { token, body: txn() });
    expect(res.status).toBe(503);
  });
});

describe("bulk import", () => {
  const rows = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ amount: i + 1, type: "expense", category: "Other", date: "2026-10-01", merchant: `M${i}` }));

  it("inserts all rows in one go and tags them as imports", async () => {
    const { token } = await makeUser({ pro: true });
    const res = await api("POST", "/api/transactions/bulk-import", { token, body: { workspace: "personal", rows: rows(120) } });
    expect(res.json).toEqual({ inserted: 120, truncated: false });
    const list = await api("GET", "/api/transactions", { token });
    expect(list.json).toHaveLength(120);
    expect(list.json[0].tags).toEqual(["import"]);
    expect(list.json[0].payment_method).toBe("Import");
  });

  it("truncates at 500 rows", async () => {
    const { token } = await makeUser({ pro: true });
    const res = await api("POST", "/api/transactions/bulk-import", { token, body: { workspace: "personal", rows: rows(520) } });
    expect(res.json).toEqual({ inserted: 500, truncated: true });
  });

  it("refuses imports bigger than the remaining trial slots", async () => {
    const { token } = await makeUser({ trialAdds: 20 });
    const res = await api("POST", "/api/transactions/bulk-import", { token, body: { workspace: "personal", rows: rows(10) } });
    expect(res.status).toBe(402);
    expect(res.json.error).toMatch(/5 transaction slot/);
  });
});
