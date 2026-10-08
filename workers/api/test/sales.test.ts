import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { ApiClient } from "../../../apps/mobile/src/lib/api/client";
import {
  applyToCollection,
  diffCollection,
  SalesSyncEngine,
  type KeyValueStore,
  type SalesChange,
  type SalesData,
} from "../../../apps/mobile/src/lib/salesSyncCore";
import app from "../src/index";
import { api, makeUser } from "./helpers";

const invoice = (n: number, over: Record<string, unknown> = {}) => ({
  invoiceNumber: `INV-2026-${String(n).padStart(3, "0")}`,
  total: 100 * n,
  status: "sent",
  ...over,
});

describe("sales records API", () => {
  it("stores, lists, updates and deletes records, and reports deletions to clients that ask for changes", async () => {
    const { token } = await makeUser();
    const put = await api("POST", "/api/sales/batch", {
      token,
      body: {
        workspace: "personal",
        ops: [
          { op: "put", kind: "customer", id: "c1", data: { id: "c1", name: "Acme" } },
          { op: "put", kind: "invoice", id: "inv:INV-1", data: invoice(1) },
        ],
      },
    });
    expect(put.status).toBe(200);
    const stamps = put.json.applied.map((a: any) => a.updatedAt);
    expect(stamps[1]).toBeGreaterThan(stamps[0]);

    const all = await api("GET", "/api/sales?workspace=personal", { token });
    expect(all.json.records.map((r: any) => `${r.kind}:${r.id}`).sort()).toEqual(["customer:c1", "invoice:inv:INV-1"]);

    await api("POST", "/api/sales/batch", { token, body: { workspace: "personal", ops: [{ op: "put", kind: "customer", id: "c1", data: { id: "c1", name: "Acme Ltd" } }] } });
    const since = put.json.serverTime - 1;
    const changed = await api("GET", `/api/sales?workspace=personal&since=${since}`, { token });
    expect(changed.json.records.find((r: any) => r.id === "c1").data.name).toBe("Acme Ltd");

    await api("POST", "/api/sales/batch", { token, body: { workspace: "personal", ops: [{ op: "delete", kind: "invoice", id: "inv:INV-1" }] } });
    expect((await api("GET", "/api/sales?workspace=personal", { token })).json.records.map((r: any) => r.id)).toEqual(["c1"]);
    const tomb = (await api("GET", `/api/sales?workspace=personal&since=${since}`, { token })).json.records.find((r: any) => r.id === "inv:INV-1");
    expect(tomb).toMatchObject({ deleted: true, data: null });
  });

  it("keeps each user's and each workspace's records private", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const op = { op: "put", kind: "customer", id: "x", data: { id: "x", name: "Secret" } };
    await api("POST", "/api/sales/batch", { token: a.token, body: { workspace: "personal", ops: [op] } });
    expect((await api("GET", "/api/sales?workspace=personal", { token: b.token })).json.records).toEqual([]);
    expect((await api("GET", "/api/sales?workspace=business", { token: a.token })).json.records).toEqual([]);
    expect((await api("GET", "/api/sales?workspace=ws_nope", { token: b.token })).status).toBe(403);
    expect((await api("GET", "/api/sales?workspace=personal")).status).toBe(401);
  });

  it("lets team members share records and rejects bad input", async () => {
    const owner = await makeUser();
    const member = await makeUser({ email: "m@example.com" });
    const ws = await api("POST", "/api/workspaces", { token: owner.token, body: { name: "Shop" } });
    const invite = await api("POST", `/api/workspaces/${ws.json.slug}/invites`, { token: owner.token, body: { email: "m@example.com" } });
    await api("POST", "/api/workspaces/accept-invite", { token: member.token, body: { token: invite.json.token } });
    await api("POST", "/api/sales/batch", { token: owner.token, body: { workspace: ws.json.slug, ops: [{ op: "put", kind: "customer", id: "t", data: { id: "t" } }] } });
    expect((await api("GET", `/api/sales?workspace=${ws.json.slug}`, { token: member.token })).json.records).toHaveLength(1);

    const bad = await api("POST", "/api/sales/batch", { token: owner.token, body: { workspace: "personal", ops: [{ op: "put", kind: "nonsense", id: "1", data: {} }] } });
    expect(bad.status).toBe(400);
    const huge = await api("POST", "/api/sales/batch", {
      token: owner.token,
      body: { workspace: "personal", ops: [{ op: "put", kind: "invoice", id: "big", data: { blob: "x".repeat(300_000) } }] },
    });
    expect(huge.status).toBe(413);
  });

  it("removes a user's records when the account is deleted", async () => {
    const { token, id } = await makeUser();
    await api("POST", "/api/sales/batch", { token, body: { workspace: "personal", ops: [{ op: "put", kind: "customer", id: "c", data: { id: "c" } }] } });
    expect((await api("DELETE", "/api/me", { token })).status).toBe(200);
    const left = await env.DB.prepare("SELECT COUNT(*) AS n FROM sales_records WHERE scope LIKE ?").bind(`u:${id}:%`).first<{ n: number }>();
    expect(left?.n).toBe(0);
  });
});

describe("sync helpers", () => {
  it("diffs collections into puts and deletes", () => {
    const ops = diffCollection("item", [{ id: "a", v: 1 }, { id: "b", v: 1 }], [{ id: "a", v: 2 }, { id: "c", v: 1 }], (r) => r.id);
    expect(ops).toEqual([
      { op: "put", kind: "item", id: "a", data: { id: "a", v: 2 } },
      { op: "put", kind: "item", id: "c", data: { id: "c", v: 1 } },
      { op: "delete", kind: "item", id: "b" },
    ]);
    expect(diffCollection("item", [{ id: "a" }], [{ id: "a" }], (r) => r.id)).toEqual([]);
  });

  it("applies remote changes to a collection", () => {
    const changes: SalesChange[] = [
      { kind: "item", id: "a", data: { id: "a", v: 9 } },
      { kind: "item", id: "b", data: null },
      { kind: "item", id: "d", data: { id: "d", v: 4 } },
      { kind: "customer", id: "ignored", data: { id: "ignored" } },
    ];
    const next = applyToCollection("item", [{ id: "a", v: 1 }, { id: "b", v: 1 }], changes, (r: any) => r.id, (d) => d as any);
    expect(next).toEqual([{ id: "d", v: 4 }, { id: "a", v: 9 }]);
  });
});

/** Two engines with separate storage = the web app and the phone talking to the same account. */
function device(token: string, workspace = "personal") {
  const store = new Map<string, string>();
  const kv: KeyValueStore = { get: async (k) => store.get(k) ?? null, set: async (k, v) => void store.set(k, v) };
  const client = new ApiClient({
    baseUrl: "https://api.test",
    fetch: ((input: any, init: any) => app.request(String(input).replace("https://api.test", ""), init, env)) as typeof fetch,
  });
  client.setToken(token);
  const engine = new SalesSyncEngine(client, workspace, kv, "meta");
  const local = new Map<string, SalesData>();
  engine.register({
    kinds: ["customer", "invoice", "payment", "business_profile"],
    getLocal: () => [...local.entries()].map(([key, data]) => ({ kind: key.split("|")[0] as any, id: key.split("|")[1], data })),
    apply: (changes) => {
      for (const c of changes) {
        const key = `${c.kind}|${c.id}`;
        if (c.data === null) local.delete(key);
        else local.set(key, c.data);
      }
    },
  });
  const save = (kind: any, id: string, data: SalesData) => {
    local.set(`${kind}|${id}`, data);
    engine.push([{ op: "put", kind, id, data }]);
  };
  const remove = (kind: any, id: string) => {
    local.delete(`${kind}|${id}`);
    engine.push([{ op: "delete", kind, id }]);
  };
  return { engine, local, save, remove, store };
}

describe("web and phone stay identical", () => {
  it("shows an invoice, payment, customer and settings created on one device on the other, including edits and deletes", async () => {
    const { token } = await makeUser({ pro: true });
    const web = device(token);
    const phone = device(token);

    web.save("customer", "c1", { id: "c1", name: "Acme" });
    web.save("invoice", "inv:INV-1", invoice(1));
    await web.engine.syncNow();
    await phone.engine.syncNow();
    expect([...phone.local.keys()].sort()).toEqual(["customer|c1", "invoice|inv:INV-1"]);

    // the phone records a payment and edits the invoice; the web sees both
    phone.save("payment", "p1", { id: "p1", amount: 40, invoiceNumber: "INV-2026-001" });
    phone.save("invoice", "inv:INV-1", invoice(1, { amountPaid: 40, status: "partially_paid" }));
    phone.save("business_profile", "singleton", { businessName: "Receipt Cycle Ltd" });
    await phone.engine.syncNow();
    await web.engine.syncNow();
    expect(web.local.get("payment|p1")).toMatchObject({ amount: 40 });
    expect(web.local.get("invoice|inv:INV-1")).toMatchObject({ amountPaid: 40, status: "partially_paid" });
    expect(web.local.get("business_profile|singleton")).toMatchObject({ businessName: "Receipt Cycle Ltd" });

    // a delete on the web disappears from the phone
    web.remove("invoice", "inv:INV-1");
    await web.engine.syncNow();
    await phone.engine.syncNow();
    expect(phone.local.has("invoice|inv:INV-1")).toBe(false);
    expect(phone.local.has("customer|c1")).toBe(true);
  });

  it("uploads data a device already had before syncing existed, and a brand-new device downloads everything", async () => {
    const { token } = await makeUser({ pro: true });
    const old = device(token);
    old.local.set("customer|legacy", { id: "legacy", name: "Old customer" });
    old.local.set("invoice|inv:INV-7", invoice(7));
    await old.engine.adopt({ kinds: ["customer", "invoice"], getLocal: () => [...old.local.entries()].map(([k, data]) => ({ kind: k.split("|")[0] as any, id: k.split("|")[1], data })), apply: () => undefined });
    await old.engine.syncNow();

    const fresh = device(token);
    await fresh.engine.syncNow();
    expect([...fresh.local.keys()].sort()).toEqual(["customer|legacy", "invoice|inv:INV-7"]);
  });

  it("keeps a local change that has not been uploaded yet when the server copy is older", async () => {
    const { token } = await makeUser({ pro: true });
    const a = device(token);
    const b = device(token);
    a.save("customer", "c", { id: "c", name: "v1" });
    await a.engine.syncNow();
    await b.engine.syncNow();
    b.save("customer", "c", { id: "c", name: "v2 from b" }); // queued, not uploaded yet
    a.save("customer", "c", { id: "c", name: "v3 from a" });
    await a.engine.syncNow();
    await b.engine.syncNow(); // b uploads its queued edit (last write wins), then pulls
    await a.engine.syncNow();
    expect(a.local.get("customer|c")).toEqual(b.local.get("customer|c"));
  });

  it("retries uploads after the network fails", async () => {
    const { token } = await makeUser({ pro: true });
    const web = device(token);
    const other = device(token);
    web.save("customer", "c1", { id: "c1", name: "Offline made" });
    // simulate offline: the client has no token, so nothing is sent yet
    (web.engine as any).client.setToken(null);
    await web.engine.syncNow();
    await other.engine.syncNow();
    expect(other.local.size).toBe(0);
    (web.engine as any).client.setToken(token);
    await web.engine.syncNow();
    await other.engine.syncNow();
    expect(other.local.get("customer|c1")).toMatchObject({ name: "Offline made" });
  });
});
