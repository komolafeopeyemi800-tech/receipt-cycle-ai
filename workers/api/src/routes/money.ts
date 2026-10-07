import { and, eq } from "drizzle-orm";
import { type Context, Hono } from "hono";
import { z } from "zod";
import { accounts, budgets, categories } from "../db/schema";
import { ApiError } from "../lib/errors";
import { parseBody, workspaceParam } from "../lib/http";
import { canAccessScope, newId, resolveScope } from "../lib/scope";
import { assertCanMutateBudget, computeSubscriptionState } from "../lib/subscription";
import { requireUser } from "../middleware/auth";
import type { AppEnv } from "../types";

const DEFAULT_ACCOUNTS = [
  { name: "Card", balance: 0, iconKey: "credit-card" },
  { name: "Cash", balance: 0, iconKey: "money-bill-wave" },
  { name: "Savings", balance: 0, iconKey: "piggy-bank" },
];

const DEFAULT_CATEGORIES: { name: string; kind: "expense" | "income"; color: string }[] = [
  { name: "Food & Dining", kind: "expense", color: "#ef4444" },
  { name: "Shopping", kind: "expense", color: "#2563eb" },
  { name: "Transportation", kind: "expense", color: "#7c3aed" },
  { name: "Bills", kind: "expense", color: "#16a34a" },
  { name: "Health", kind: "expense", color: "#f97316" },
  { name: "Entertainment", kind: "expense", color: "#db2777" },
  { name: "Education", kind: "expense", color: "#0ea5e9" },
  { name: "Home", kind: "expense", color: "#ea580c" },
  { name: "Salary", kind: "income", color: "#0f766e" },
  { name: "Other", kind: "expense", color: "#64748b" },
];

const accountShape = (r: typeof accounts.$inferSelect) => ({
  id: r.id,
  name: r.name,
  balance: r.balance,
  iconKey: r.iconKey ?? "wallet",
});

const categoryShape = (r: typeof categories.$inferSelect) => ({
  id: r.id,
  name: r.name,
  kind: r.kind,
  color: r.color,
});

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export const accountRoutes = new Hono<AppEnv>();
accountRoutes.use("*", requireUser);

accountRoutes.get("/", async (c) => {
  const db = c.get("db");
  const scope = await resolveScope(db, c.get("user").id, workspaceParam(c));
  const rows = await db.select().from(accounts).where(eq(accounts.scope, scope)).orderBy(accounts.createdAt);
  return c.json(rows.map(accountShape));
});

accountRoutes.post("/ensure-seed", async (c) => {
  const db = c.get("db");
  const { workspace } = await parseBody(c, z.object({ workspace: z.string().min(1) }));
  const scope = await resolveScope(db, c.get("user").id, workspace);
  const existing = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.scope, scope)).get();
  if (existing) return c.json({ seeded: false });
  const now = Date.now();
  await db.batch([
    db.insert(accounts).values(DEFAULT_ACCOUNTS.map((a, i) => ({ id: newId(), scope, ...a, createdAt: now + i }))),
  ]);
  return c.json({ seeded: true });
});

accountRoutes.get("/:id", async (c) => {
  const db = c.get("db");
  const scope = await resolveScope(db, c.get("user").id, workspaceParam(c));
  const row = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, c.req.param("id")), eq(accounts.scope, scope)))
    .get();
  if (!row) throw new ApiError(404, "Account not found");
  return c.json(accountShape(row));
});

accountRoutes.post("/", async (c) => {
  const db = c.get("db");
  const body = await parseBody(
    c,
    z.object({
      workspace: z.string().min(1),
      name: z.string().trim().min(1).max(80),
      balance: z.number().finite().optional(),
      iconKey: z.string().optional(),
    }),
  );
  const scope = await resolveScope(db, c.get("user").id, body.workspace);
  const id = newId();
  await db.insert(accounts).values({
    id,
    scope,
    name: body.name,
    balance: body.balance ?? 0,
    iconKey: body.iconKey ?? "wallet",
    createdAt: Date.now(),
  });
  return c.json({ id }, 201);
});

accountRoutes.patch("/:id", async (c) => {
  const db = c.get("db");
  const body = await parseBody(
    c,
    z.object({
      name: z.string().optional(),
      balance: z.number().finite().optional(),
      iconKey: z.string().optional(),
    }),
  );
  const row = await db.select().from(accounts).where(eq(accounts.id, c.req.param("id"))).get();
  if (!row || !(await canAccessScope(db, c.get("user").id, row.scope))) throw new ApiError(404, "Account not found");
  const patch: Partial<typeof accounts.$inferInsert> = {};
  if (body.name !== undefined) {
    const name = body.name.trim().slice(0, 80);
    if (name.length < 1) throw new ApiError(400, "Account name required");
    patch.name = name;
  }
  if (body.balance !== undefined) patch.balance = body.balance;
  if (body.iconKey !== undefined) patch.iconKey = body.iconKey;
  if (Object.keys(patch).length > 0) await db.update(accounts).set(patch).where(eq(accounts.id, row.id));
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const categoryRoutes = new Hono<AppEnv>();
categoryRoutes.use("*", requireUser);

categoryRoutes.get("/", async (c) => {
  const db = c.get("db");
  const scope = await resolveScope(db, c.get("user").id, workspaceParam(c));
  const rows = await db.select().from(categories).where(eq(categories.scope, scope)).orderBy(categories.createdAt);
  return c.json(rows.map(categoryShape));
});

categoryRoutes.post("/ensure-seed", async (c) => {
  const db = c.get("db");
  const { workspace } = await parseBody(c, z.object({ workspace: z.string().min(1) }));
  const scope = await resolveScope(db, c.get("user").id, workspace);
  const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.scope, scope)).get();
  if (existing) return c.json({ seeded: false });
  const now = Date.now();
  await db.batch([
    db.insert(categories).values(DEFAULT_CATEGORIES.map((cat, i) => ({ id: newId(), scope, ...cat, createdAt: now + i }))),
  ]);
  return c.json({ seeded: true });
});

categoryRoutes.post("/", async (c) => {
  const db = c.get("db");
  const body = await parseBody(
    c,
    z.object({
      workspace: z.string().min(1),
      name: z.string(),
      kind: z.enum(["expense", "income"]),
      color: z.string().min(1),
    }),
  );
  const name = body.name.trim();
  if (name.length < 1) throw new ApiError(400, "Category name required");
  const scope = await resolveScope(db, c.get("user").id, body.workspace);
  const all = await db.select({ name: categories.name }).from(categories).where(eq(categories.scope, scope));
  if (all.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
    throw new ApiError(409, "A category with this name already exists.");
  }
  const id = newId();
  await db.insert(categories).values({ id, scope, name, kind: body.kind, color: body.color, createdAt: Date.now() });
  return c.json({ id }, 201);
});

async function loadOwnedCategory(c: Context<AppEnv>) {
  const db = c.get("db");
  const row = await db.select().from(categories).where(eq(categories.id, c.req.param("id") ?? "")).get();
  if (!row || !(await canAccessScope(db, c.get("user").id, row.scope))) throw new ApiError(404, "Category not found");
  return row;
}

categoryRoutes.patch("/:id", async (c) => {
  const db = c.get("db");
  const body = await parseBody(
    c,
    z.object({
      name: z.string().optional(),
      color: z.string().optional(),
      kind: z.enum(["expense", "income"]).optional(),
    }),
  );
  const row = await loadOwnedCategory(c);
  const patch: Partial<typeof categories.$inferInsert> = {};
  if (body.name !== undefined) {
    const name = body.name.trim().slice(0, 80);
    if (name.length < 1) throw new ApiError(400, "Category name required");
    const siblings = await db.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.scope, row.scope));
    if (siblings.some((r) => r.id !== row.id && r.name.toLowerCase() === name.toLowerCase())) {
      throw new ApiError(409, "A category with this name already exists.");
    }
    patch.name = name;
  }
  if (body.color !== undefined) patch.color = body.color;
  if (body.kind !== undefined) patch.kind = body.kind;
  if (Object.keys(patch).length > 0) await db.update(categories).set(patch).where(eq(categories.id, row.id));
  return c.json({ ok: true });
});

categoryRoutes.delete("/:id", async (c) => {
  const row = await loadOwnedCategory(c);
  await c.get("db").delete(categories).where(eq(categories.id, row.id));
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Budgets
// ---------------------------------------------------------------------------

export const budgetRoutes = new Hono<AppEnv>();
budgetRoutes.use("*", requireUser);

budgetRoutes.get("/", async (c) => {
  const db = c.get("db");
  const month = c.req.query("month");
  if (!month) throw new ApiError(400, "month is required (YYYY-MM).");
  const scope = await resolveScope(db, c.get("user").id, workspaceParam(c));
  const rows = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.scope, scope), eq(budgets.month, month)));
  return c.json(rows.map((r) => ({ id: r.id, category: r.category, month: r.month, limitAmount: r.limitAmount })));
});

budgetRoutes.put("/", async (c) => {
  const db = c.get("db");
  const u = c.get("user");
  const body = await parseBody(
    c,
    z.object({
      workspace: z.string().min(1),
      category: z.string().min(1),
      month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month must be YYYY-MM"),
      limitAmount: z.number().finite().min(0),
    }),
  );
  assertCanMutateBudget(
    computeSubscriptionState(
      {
        createdAt: u.createdAt,
        proSubscriptionActive: u.profile.proSubscriptionActive,
        trialStartedAt: u.profile.trialStartedAt,
        trialLifetimeAdds: u.profile.trialLifetimeAdds,
      },
      Date.now(),
    ),
  );
  const scope = await resolveScope(db, u.id, body.workspace);
  const id = newId();
  // The unique index (scope, month, category) makes this a true upsert.
  await db
    .insert(budgets)
    .values({ id, scope, category: body.category, month: body.month, limitAmount: body.limitAmount, createdAt: Date.now() })
    .onConflictDoUpdate({
      target: [budgets.scope, budgets.month, budgets.category],
      set: { limitAmount: body.limitAmount },
    });
  const row = await db
    .select({ id: budgets.id })
    .from(budgets)
    .where(and(eq(budgets.scope, scope), eq(budgets.month, body.month), eq(budgets.category, body.category)))
    .get();
  return c.json({ id: row?.id ?? id });
});
