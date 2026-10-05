import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { accounts, profile, transactions } from "../db/schema";
import { runBatch, type Stmt } from "../lib/batch";
import { getRuntimeConfig } from "../lib/config";
import { ApiError } from "../lib/errors";
import { parseBody, workspaceParam } from "../lib/http";
import { newId, resolveScope } from "../lib/scope";
import {
  assertCanCreateTransaction,
  assertCanEditTransaction,
  assertCanExportCsv,
  computeSubscriptionState,
} from "../lib/subscription";
import { requireUser } from "../middleware/auth";
import type { AppEnv, AuthedUser, Db } from "../types";

const MAX_BULK_IMPORT = 500;

type TxnRow = typeof transactions.$inferSelect;

/** Same JSON shape the Convex `toClientShape` returned, so client screens keep working. */
function toClientShape(r: TxnRow) {
  return {
    id: r.id,
    workspace: r.workspace,
    amount: r.amount,
    type: r.type,
    category: r.category,
    merchant: r.merchant ?? null,
    date: r.date,
    description: r.description ?? null,
    payment_method: r.paymentMethod ?? null,
    accountId: r.accountId ?? null,
    tags: r.tags ?? null,
    is_recurring: r.isRecurring ?? null,
    receipt_url: r.receiptUrl ?? null,
    receipt_data: r.receiptData ?? null,
    created_at: new Date(r.createdAt).toISOString(),
    updated_at: new Date(r.updatedAt).toISOString(),
  };
}

function subscriptionOf(u: AuthedUser) {
  return computeSubscriptionState(
    {
      createdAt: u.createdAt,
      proSubscriptionActive: u.profile.proSubscriptionActive,
      trialStartedAt: u.profile.trialStartedAt,
      trialLifetimeAdds: u.profile.trialLifetimeAdds,
    },
    Date.now(),
  );
}

/** Effect of a transaction on its account balance: expenses subtract, income adds, others do nothing. */
function balanceDelta(type: string, amount: number): number {
  if (amount <= 0) return 0;
  return type === "expense" ? -amount : type === "income" ? amount : 0;
}

/** Atomic balance change (no read-modify-write race). */
function adjustBalance(db: Db, accountId: string, scope: string, delta: number) {
  return db
    .update(accounts)
    .set({ balance: sql`round(${accounts.balance} + ${delta}, 2)` })
    .where(and(eq(accounts.id, accountId), eq(accounts.scope, scope)));
}

function bumpTrialAdds(db: Db, userId: string, by: number) {
  return db
    .update(profile)
    .set({ trialLifetimeAdds: sql`coalesce(${profile.trialLifetimeAdds}, 0) + ${by}` })
    .where(and(eq(profile.userId, userId), eq(profile.proSubscriptionActive, false)));
}

const entrySource = z.enum(["camera", "upload", "manual"]);

const txnFields = {
  workspace: z.string().min(1),
  amount: z.number().finite(),
  type: z.string().min(1),
  category: z.string().min(1),
  merchant: z.string().nullish(),
  date: z.string().min(1),
  description: z.string().nullish(),
  payment_method: z.string().nullish(),
  accountId: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
  is_recurring: z.boolean().nullish(),
  receipt_data: z.unknown().optional(),
};

const createBody = z.object({
  ...txnFields,
  receipt_url: z.string().nullish(),
  entrySource: entrySource.optional(),
});
const updateBody = z.object(txnFields);
const bulkBody = z.object({
  workspace: z.string().min(1),
  rows: z.array(
    z.object({
      amount: z.number().finite(),
      type: z.string().min(1),
      category: z.string().min(1),
      date: z.string().min(1),
      merchant: z.string().nullish(),
      description: z.string().nullish(),
      payment_method: z.string().nullish(),
    }),
  ),
});

export const transactionRoutes = new Hono<AppEnv>();
transactionRoutes.use("*", requireUser);

transactionRoutes.get("/", async (c) => {
  const db = c.get("db");
  const u = c.get("user");
  const q = c.req.query();
  const conds = [eq(transactions.userId, u.id), eq(transactions.workspace, workspaceParam(c))];
  if (q.startDate) conds.push(gte(transactions.date, q.startDate));
  if (q.endDate) conds.push(lte(transactions.date, q.endDate));
  if (q.category) conds.push(eq(transactions.category, q.category));
  if (q.accountId) conds.push(eq(transactions.accountId, q.accountId));
  const rows = await db
    .select()
    .from(transactions)
    .where(and(...conds))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));
  return c.json(rows.map(toClientShape));
});

/** Full export for CSV / Drive backup (all workspaces). Pro only. */
transactionRoutes.get("/export", async (c) => {
  const u = c.get("user");
  assertCanExportCsv(subscriptionOf(u));
  const rows = await c
    .get("db")
    .select()
    .from(transactions)
    .where(eq(transactions.userId, u.id))
    .orderBy(desc(transactions.date));
  return c.json(rows.map(toClientShape));
});

transactionRoutes.get("/:id", async (c) => {
  const row = await c
    .get("db")
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, c.req.param("id")), eq(transactions.userId, c.get("user").id)))
    .get();
  if (!row) throw new ApiError(404, "Transaction not found");
  return c.json(toClientShape(row));
});

transactionRoutes.post("/", async (c) => {
  const db = c.get("db");
  const u = c.get("user");
  const body = await parseBody(c, createBody);

  const cfg = await getRuntimeConfig(db);
  if (cfg.maintenanceMode) throw new ApiError(503, "System is in maintenance mode. Please try again later.");
  const source = body.entrySource ?? "manual";
  if (source === "camera" && !cfg.scannerEnabled) throw new ApiError(403, "Camera scanner is currently disabled by admin.");
  if (source === "upload" && !cfg.uploadEnabled) throw new ApiError(403, "Upload flow is currently disabled by admin.");
  if (source === "manual" && !cfg.manualAddEnabled) throw new ApiError(403, "Manual add is currently disabled by admin.");
  assertCanCreateTransaction(subscriptionOf(u));

  const scope = await resolveScope(db, u.id, body.workspace);
  const id = newId();
  const now = Date.now();
  const stmts: Stmt[] = [
    db.insert(transactions).values({
      id,
      userId: u.id,
      workspace: body.workspace,
      amount: body.amount,
      type: body.type,
      category: body.category,
      merchant: body.merchant ?? null,
      date: body.date,
      description: body.description ?? null,
      paymentMethod: body.payment_method ?? null,
      accountId: body.accountId ?? null,
      tags: body.tags ?? null,
      isRecurring: body.is_recurring ?? null,
      receiptUrl: body.receipt_url ?? null,
      receiptData: body.receipt_data ?? null,
      entrySource: source,
      createdAt: now,
      updatedAt: now,
    }),
    bumpTrialAdds(db, u.id, 1),
  ];
  const delta = balanceDelta(body.type, body.amount);
  if (body.accountId && delta !== 0) stmts.push(adjustBalance(db, body.accountId, scope, delta));
  await runBatch(db, stmts);
  return c.json({ id }, 201);
});

transactionRoutes.put("/:id", async (c) => {
  const db = c.get("db");
  const u = c.get("user");
  const body = await parseBody(c, updateBody);
  const old = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, c.req.param("id")), eq(transactions.userId, u.id)))
    .get();
  if (!old) throw new ApiError(404, "Transaction not found");
  if (old.workspace !== body.workspace) throw new ApiError(400, "Workspace mismatch");
  assertCanEditTransaction(subscriptionOf(u));

  const scope = await resolveScope(db, u.id, old.workspace);
  const stmts: Stmt[] = [];
  const reverse = balanceDelta(old.type, old.amount);
  if (old.accountId && reverse !== 0) stmts.push(adjustBalance(db, old.accountId, scope, -reverse));
  stmts.push(
    db
      .update(transactions)
      .set({
        amount: body.amount,
        type: body.type,
        category: body.category,
        merchant: body.merchant ?? null,
        date: body.date,
        description: body.description ?? null,
        paymentMethod: body.payment_method ?? null,
        accountId: body.accountId ?? null,
        tags: body.tags ?? null,
        isRecurring: body.is_recurring ?? null,
        receiptData: body.receipt_data ?? null,
        updatedAt: Date.now(),
      })
      .where(eq(transactions.id, old.id)),
  );
  const next = balanceDelta(body.type, body.amount);
  if (body.accountId && next !== 0) stmts.push(adjustBalance(db, body.accountId, scope, next));
  await runBatch(db, stmts);
  return c.json({ id: old.id });
});

transactionRoutes.delete("/:id", async (c) => {
  const db = c.get("db");
  const u = c.get("user");
  const row = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, c.req.param("id")), eq(transactions.userId, u.id)))
    .get();
  if (!row) throw new ApiError(404, "Transaction not found");
  assertCanEditTransaction(subscriptionOf(u));

  const scope = await resolveScope(db, u.id, row.workspace);
  const stmts: Stmt[] = [db.delete(transactions).where(eq(transactions.id, row.id))];
  const reverse = balanceDelta(row.type, row.amount);
  if (row.accountId && reverse !== 0) stmts.push(adjustBalance(db, row.accountId, scope, -reverse));
  await runBatch(db, stmts);
  return c.json({ ok: true });
});

/**
 * Bulk import (CSV / parsed statements). One INSERT ... SELECT over json_each keeps this at a
 * single D1 statement however many rows there are (D1 limits bound parameters and queries per call).
 */
transactionRoutes.post("/bulk-import", async (c) => {
  const db = c.get("db");
  const u = c.get("user");
  const body = await parseBody(c, bulkBody);

  const cfg = await getRuntimeConfig(db);
  if (cfg.maintenanceMode) throw new ApiError(503, "System is in maintenance mode. Please try again later.");
  if (!cfg.uploadEnabled) throw new ApiError(403, "Upload import is currently disabled by admin.");
  await resolveScope(db, u.id, body.workspace);

  const state = subscriptionOf(u);
  const slice = body.rows.slice(0, MAX_BULK_IMPORT);
  if (!state.pro && slice.length > state.trialAddsRemaining) {
    throw new ApiError(
      402,
      `This import has ${slice.length} rows but your trial has ${state.trialAddsRemaining} transaction slot(s) left. Upgrade to Pro for unlimited imports, or reduce the file.`,
    );
  }
  if (slice.length > 0) assertCanCreateTransaction(state);
  if (slice.length === 0) return c.json({ inserted: 0, truncated: false });

  const now = Date.now();
  const payload = JSON.stringify(
    slice.map((r) => ({
      id: newId(),
      amount: r.amount,
      type: r.type,
      category: r.category,
      date: r.date,
      merchant: r.merchant ?? null,
      description: r.description ?? null,
      payment_method: r.payment_method ?? "Import",
    })),
  );
  // Drizzle's batch only accepts query builders, so this one uses D1's prepared statements directly.
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO transactions
         (id, user_id, workspace, amount, type, category, merchant, date, description, payment_method,
          tags, is_recurring, entry_source, created_at, updated_at)
       SELECT json_extract(value, '$.id'), ?1, ?2,
              json_extract(value, '$.amount'), json_extract(value, '$.type'), json_extract(value, '$.category'),
              json_extract(value, '$.merchant'), json_extract(value, '$.date'), json_extract(value, '$.description'),
              json_extract(value, '$.payment_method'), '["import"]', 0, 'upload', ?3, ?3
       FROM json_each(?4)`,
    ).bind(u.id, body.workspace, now, payload),
    c.env.DB.prepare(
      `UPDATE profile SET trial_lifetime_adds = coalesce(trial_lifetime_adds, 0) + ?1
       WHERE user_id = ?2 AND pro_subscription_active = 0`,
    ).bind(slice.length, u.id),
  ]);
  return c.json({ inserted: slice.length, truncated: body.rows.length > MAX_BULK_IMPORT });
});
