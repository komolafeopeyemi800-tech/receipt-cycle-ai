import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { salesRecords } from "../db/schema";
import { ApiError } from "../lib/errors";
import { parseBody, workspaceParam } from "../lib/http";
import { resolveScope } from "../lib/scope";
import { requireUser } from "../middleware/auth";
import type { AppEnv } from "../types";

/** Everything the web and mobile apps share besides transactions/accounts/budgets (which have their own routes). */
export const SALES_KINDS = ["customer", "item", "invoice", "estimate", "payment", "business_profile", "invoice_settings", "reminders"] as const;
const MAX_RECORD_BYTES = 256 * 1024;
const MAX_OPS = 200;

const op = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("put"),
    kind: z.enum(SALES_KINDS),
    id: z.string().min(1).max(200),
    data: z.record(z.string(), z.unknown()),
  }),
  z.object({ op: z.literal("delete"), kind: z.enum(SALES_KINDS), id: z.string().min(1).max(200) }),
]);

export const salesRoutes = new Hono<AppEnv>();
salesRoutes.use("*", requireUser);

/**
 * GET /api/sales?workspace=personal[&since=<ms>]
 * Without `since`: every live record. With `since`: only what changed after it, including deletions.
 */
salesRoutes.get("/", async (c) => {
  const db = c.get("db");
  const scope = await resolveScope(db, c.get("user").id, workspaceParam(c));
  const since = Number(c.req.query("since") ?? 0);
  const rows = await db
    .select()
    .from(salesRecords)
    .where(
      Number.isFinite(since) && since > 0
        ? and(eq(salesRecords.scope, scope), gt(salesRecords.updatedAt, since))
        : and(eq(salesRecords.scope, scope), eq(salesRecords.deleted, 0)),
    );
  return c.json({
    serverTime: Date.now(),
    records: rows.map((r) => ({
      kind: r.kind,
      id: r.id,
      data: r.deleted ? null : JSON.parse(r.data),
      updatedAt: r.updatedAt,
      deleted: r.deleted === 1,
    })),
  });
});

/** POST /api/sales/batch  { workspace, ops: [{op:"put",kind,id,data} | {op:"delete",kind,id}] } */
salesRoutes.post("/batch", async (c) => {
  const db = c.get("db");
  const body = await parseBody(c, z.object({ workspace: z.string().min(1), ops: z.array(op).max(MAX_OPS) }));
  const user = c.get("user");
  const scope = await resolveScope(db, user.id, body.workspace);
  if (body.ops.length === 0) return c.json({ serverTime: Date.now(), applied: [] });

  const prepared = body.ops.map((o) => {
    if (o.op === "put") {
      const json = JSON.stringify(o.data);
      if (json.length > MAX_RECORD_BYTES) throw new ApiError(413, "That record is too large to sync.");
      return { ...o, json };
    }
    return { ...o, json: "{}" };
  });

  // updated_at must grow strictly so "changed since" never misses a write made in the same millisecond.
  const last = await db
    .select({ max: sql<number>`coalesce(max(${salesRecords.updatedAt}), 0)` })
    .from(salesRecords)
    .where(eq(salesRecords.scope, scope))
    .get();
  let stamp = Math.max(Date.now(), (last?.max ?? 0) + 1);
  const applied: { kind: string; id: string; updatedAt: number }[] = [];
  const statements = prepared.map((o) => {
    const updatedAt = stamp++;
    applied.push({ kind: o.kind, id: o.id, updatedAt });
    return db
      .insert(salesRecords)
      .values({ scope, kind: o.kind, id: o.id, data: o.json, updatedAt, deleted: o.op === "delete" ? 1 : 0, updatedBy: user.id })
      .onConflictDoUpdate({
        target: [salesRecords.scope, salesRecords.kind, salesRecords.id],
        set: { data: o.json, updatedAt, deleted: o.op === "delete" ? 1 : 0, updatedBy: user.id },
      });
  });
  await db.batch(statements as [(typeof statements)[number], ...(typeof statements)[number][]]);
  return c.json({ serverTime: Date.now(), applied });
});

/** Used by account reset/delete. */
export async function deleteSalesForScopes(db: import("../types").Db, scopes: string[]) {
  if (scopes.length === 0) return;
  await db.delete(salesRecords).where(inArray(salesRecords.scope, scopes));
}
