import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

const workspaceKey = v.string();

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

type TransactionDoc = {
  _id: string;
  _creationTime: number;
  workspace?: string;
  userId?: string;
  amount: number;
  type: string;
  category: string;
  merchant?: string;
  date: string;
  description?: string;
  payment_method?: string;
  accountId?: string;
  tags?: string[];
  is_recurring?: boolean;
  receipt_url?: string;
  receipt_data?: unknown;
  entrySource?: "camera" | "upload" | "manual";
};

function isQueryableTransactionDoc(doc: unknown): doc is TransactionDoc {
  if (!doc || typeof doc !== "object") return false;
  const row = doc as Record<string, unknown>;
  return (
    typeof row._id === "string" &&
    typeof row._creationTime === "number" &&
    typeof row.amount === "number" &&
    typeof row.type === "string" &&
    typeof row.category === "string" &&
    typeof row.date === "string"
  );
}

function resolveWorkspace(doc: TransactionDoc): string {
  return doc.workspace ?? "personal";
}

function toClientShape(doc: TransactionDoc) {
  return {
    id: doc._id as string,
    workspace: resolveWorkspace(doc),
    amount: doc.amount,
    type: doc.type,
    category: doc.category,
    merchant: doc.merchant ?? null,
    date: doc.date,
    description: doc.description ?? null,
    payment_method: doc.payment_method ?? null,
    accountId: doc.accountId ?? null,
    tags: doc.tags ?? null,
    is_recurring: doc.is_recurring ?? null,
    receipt_url: doc.receipt_url ?? null,
    receipt_data: doc.receipt_data ?? null,
    created_at: new Date(doc._creationTime).toISOString(),
    updated_at: new Date(doc._creationTime).toISOString(),
  };
}

function normKey(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

/** Match Convex user id or legacy rows where `userId` was stored as email (any casing). */
function rowVisibleForUser(doc: TransactionDoc, userId: string | undefined, email: string | undefined): boolean {
  if (!userId && !email) return false;
  const docKey = normKey(doc.userId);
  if (!docKey) return false;
  if (userId && docKey === normKey(userId)) return true;
  if (email && docKey === normKey(email)) return true;
  return false;
}

function monthRange(nowMs: number) {
  const d = new Date(nowMs);
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).getTime();
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).getTime();
  return { start, end };
}

async function enforceMonthlySourceCap(
  ctx: { db: { query: (table: "transactions") => { collect: () => Promise<unknown[]> } } },
  userId: string,
  entrySource: "camera" | "upload" | "manual",
  sourceCaps: Record<"camera" | "upload" | "manual", number>,
) {
  const cap = sourceCaps[entrySource];
  const { start, end } = monthRange(Date.now());
  const all = (await ctx.db.query("transactions").collect()) as TransactionDoc[];
  const used = all.filter((t) => {
    if (t.userId !== userId) return false;
    if (t.entrySource !== entrySource) return false;
    return t._creationTime >= start && t._creationTime < end;
  }).length;
  if (used >= cap) {
    throw new Error(`Monthly limit reached for ${entrySource} entries (${cap}). Please wait until next month.`);
  }
}

async function getRuntimeConfig(
  ctx: { db: { query: (table: "appConfig") => { withIndex: Function } } },
) {
  const row = (await ctx.db
    .query("appConfig")
    .withIndex("by_key", (q: { eq: Function }) => q.eq("key", "global"))
    .unique()) as
    | {
        maintenanceMode?: boolean;
        scannerEnabled?: boolean;
        uploadEnabled?: boolean;
        manualAddEnabled?: boolean;
        freeCameraLimit?: number;
        freeUploadLimit?: number;
        freeManualLimit?: number;
      }
    | null;
  return {
    maintenanceMode: row?.maintenanceMode ?? false,
    scannerEnabled: row?.scannerEnabled ?? true,
    uploadEnabled: row?.uploadEnabled ?? true,
    manualAddEnabled: row?.manualAddEnabled ?? true,
    freeCameraLimit: Number.isFinite(row?.freeCameraLimit ?? NaN) ? Math.max(0, Math.floor(row!.freeCameraLimit!)) : 20,
    freeUploadLimit: Number.isFinite(row?.freeUploadLimit ?? NaN) ? Math.max(0, Math.floor(row!.freeUploadLimit!)) : 20,
    freeManualLimit: Number.isFinite(row?.freeManualLimit ?? NaN) ? Math.max(0, Math.floor(row!.freeManualLimit!)) : 60,
  };
}

export const list = query({
  args: {
    workspace: workspaceKey,
    userId: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    /** Filter to one category (e.g. breakdown screen) */
    category: v.optional(v.string()),
    /** Filter to one account id string */
    accountId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.userId?.trim()) return [];

    let legacyEmail: string | undefined;
    try {
      legacyEmail = (await ctx.db.get(args.userId as Id<"users">))?.email as string | undefined;
    } catch {
      legacyEmail = undefined;
    }

    const uid = args.userId.trim();
    const mergedById = new Map<string, TransactionDoc>();

    const pushFromIndex = async (userKey: string) => {
      const rows = (await ctx.db
        .query("transactions")
        .withIndex("by_user_workspace", (q) => q.eq("userId", userKey))
        .collect()) as TransactionDoc[];
      for (const d of rows) {
        mergedById.set(d._id, d);
      }
    };

    await pushFromIndex(uid);
    if (legacyEmail?.trim()) {
      const em = legacyEmail.trim();
      if (normKey(em) !== normKey(uid)) {
        await pushFromIndex(em);
        if (normKey(em) !== em.toLowerCase()) await pushFromIndex(em.toLowerCase());
      }
    }

    let filtered = [...mergedById.values()].filter(isQueryableTransactionDoc).filter((d) => resolveWorkspace(d) === args.workspace);
    filtered = filtered.filter((d) => rowVisibleForUser(d, args.userId, legacyEmail));
    if (args.startDate) {
      filtered = filtered.filter((d) => d.date >= args.startDate!);
    }
    if (args.endDate) {
      filtered = filtered.filter((d) => d.date <= args.endDate!);
    }
    if (args.category) {
      filtered = filtered.filter((d) => d.category === args.category);
    }
    if (args.accountId) {
      filtered = filtered.filter((d) => d.accountId === args.accountId);
    }
    filtered.sort((a, b) => b.date.localeCompare(a.date));
    return filtered.map((d) => toClientShape(d));
  },
});

export const get = query({
  args: {
    id: v.id("transactions"),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, { id, userId }) => {
    const doc = (await ctx.db.get(id)) as TransactionDoc | null;
    if (!doc) return null;
    let legacyEmail: string | undefined;
    if (userId?.trim()) {
      try {
        legacyEmail = (await ctx.db.get(userId as Id<"users">))?.email as string | undefined;
      } catch {
        legacyEmail = undefined;
      }
    }
    if (!rowVisibleForUser(doc, userId, legacyEmail)) return null;
    return toClientShape(doc);
  },
});

export const exportForBackup = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, { userId }) => {
    if (!userId?.trim()) return [];
    const all = await ctx.db.query("transactions").collect();
    const rows = all.filter((d) => (d as TransactionDoc).userId === userId);
    return rows.map((d) => toClientShape(d as TransactionDoc));
  },
});

async function applyAccountDelta(
  ctx: { db: { get: (id: Id<"accounts">) => Promise<unknown>; patch: (id: Id<"accounts">, p: { balance: number }) => Promise<void> } },
  accountId: Id<"accounts">,
  workspace: string,
  amount: number,
  type: string,
) {
  const acc = (await ctx.db.get(accountId)) as { _id: Id<"accounts">; workspace: string; balance: number } | null;
  if (!acc || acc.workspace !== workspace) return;
  const delta = type === "expense" ? -amount : type === "income" ? amount : 0;
  if (delta === 0) return;
  await ctx.db.patch(accountId, { balance: roundMoney(acc.balance + delta) });
}

export const create = mutation({
  args: {
    workspace: workspaceKey,
    userId: v.optional(v.string()),
    amount: v.number(),
    type: v.string(),
    category: v.string(),
    merchant: v.optional(v.string()),
    date: v.string(),
    description: v.optional(v.string()),
    payment_method: v.optional(v.string()),
    accountId: v.optional(v.id("accounts")),
    tags: v.optional(v.array(v.string())),
    is_recurring: v.optional(v.boolean()),
    receipt_url: v.optional(v.string()),
    receipt_data: v.optional(v.any()),
    entrySource: v.optional(v.union(v.literal("camera"), v.literal("upload"), v.literal("manual"))),
  },
  handler: async (ctx, args) => {
    if (!args.userId?.trim()) {
      throw new Error("You must be signed in to save transactions.");
    }
    const cfg = await getRuntimeConfig(ctx);
    if (cfg.maintenanceMode) throw new Error("System is in maintenance mode. Please try again later.");
    const entrySource = args.entrySource ?? "manual";
    if (entrySource === "camera" && !cfg.scannerEnabled) {
      throw new Error("Camera scanner is currently disabled by admin.");
    }
    if (entrySource === "upload" && !cfg.uploadEnabled) {
      throw new Error("Upload flow is currently disabled by admin.");
    }
    if (entrySource === "manual" && !cfg.manualAddEnabled) {
      throw new Error("Manual add is currently disabled by admin.");
    }
    await enforceMonthlySourceCap(
      ctx,
      args.userId,
      entrySource,
      {
        camera: cfg.freeCameraLimit,
        upload: cfg.freeUploadLimit,
        manual: cfg.freeManualLimit,
      },
    );
    const { workspace, userId, accountId, ...rest } = args;
    const id = await ctx.db.insert("transactions", {
      workspace,
      userId,
      accountId,
      ...rest,
      entrySource,
    });
    if (accountId && args.amount > 0) {
      await applyAccountDelta(ctx, accountId, workspace, args.amount, args.type);
    }
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("transactions"),
    workspace: workspaceKey,
    userId: v.optional(v.string()),
    amount: v.number(),
    type: v.string(),
    category: v.string(),
    merchant: v.optional(v.string()),
    date: v.string(),
    description: v.optional(v.string()),
    payment_method: v.optional(v.string()),
    accountId: v.optional(v.id("accounts")),
    tags: v.optional(v.array(v.string())),
    is_recurring: v.optional(v.boolean()),
    receipt_data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const old = (await ctx.db.get(args.id)) as (TransactionDoc & { accountId?: Id<"accounts"> }) | null;
    if (!old) throw new Error("Transaction not found");
    if (resolveWorkspace(old) !== args.workspace) throw new Error("Workspace mismatch");
    if (!args.userId?.trim()) throw new Error("Sign in required.");
    if (old.userId !== args.userId) throw new Error("Forbidden");

    if (old.accountId && old.amount > 0) {
      const rev = old.type === "expense" ? old.amount : old.type === "income" ? -old.amount : 0;
      if (rev !== 0) {
        const acc = (await ctx.db.get(old.accountId)) as { workspace: string; balance: number } | null;
        const ws = resolveWorkspace(old);
        if (acc && acc.workspace === ws) {
          await ctx.db.patch(old.accountId, { balance: roundMoney(acc.balance + rev) });
        }
      }
    }

    await ctx.db.patch(args.id, {
      amount: args.amount,
      type: args.type,
      category: args.category,
      merchant: args.merchant,
      date: args.date,
      description: args.description,
      payment_method: args.payment_method,
      accountId: args.accountId,
      tags: args.tags,
      is_recurring: args.is_recurring,
      receipt_data: args.receipt_data,
    });

    if (args.accountId && args.amount > 0) {
      await applyAccountDelta(ctx, args.accountId, args.workspace, args.amount, args.type);
    }
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("transactions"), userId: v.optional(v.string()) },
  handler: async (ctx, { id, userId }) => {
    const row = (await ctx.db.get(id)) as TransactionDoc & { accountId?: Id<"accounts">; workspace?: string } | null;
    if (!row) throw new Error("Transaction not found");
    if (!userId?.trim()) throw new Error("Sign in required.");
    if (row.userId !== userId) throw new Error("Forbidden");
    if (row?.accountId && row.amount > 0) {
      const ws = resolveWorkspace(row as TransactionDoc);
      const rev = row.type === "expense" ? row.amount : row.type === "income" ? -row.amount : 0;
      if (rev !== 0) {
        const acc = (await ctx.db.get(row.accountId)) as { workspace: string; balance: number } | null;
        if (acc && acc.workspace === ws) {
          await ctx.db.patch(row.accountId, { balance: roundMoney(acc.balance + rev) });
        }
      }
    }
    await ctx.db.delete(id);
  },
});

const MAX_BULK_IMPORT = 500;

export const bulkImport = mutation({
  args: {
    workspace: workspaceKey,
    userId: v.optional(v.string()),
    rows: v.array(
      v.object({
        amount: v.number(),
        type: v.string(),
        category: v.string(),
        date: v.string(),
        merchant: v.optional(v.string()),
        description: v.optional(v.string()),
        payment_method: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    if (!args.userId?.trim()) {
      throw new Error("You must be signed in to import transactions.");
    }
    const cfg = await getRuntimeConfig(ctx);
    if (cfg.maintenanceMode) throw new Error("System is in maintenance mode. Please try again later.");
    if (!cfg.uploadEnabled) throw new Error("Upload import is currently disabled by admin.");
    const slice = args.rows.slice(0, MAX_BULK_IMPORT);
    let inserted = 0;
    for (const row of slice) {
      await ctx.db.insert("transactions", {
        workspace: args.workspace,
        userId: args.userId,
        amount: row.amount,
        type: row.type,
        category: row.category,
        date: row.date,
        merchant: row.merchant,
        description: row.description,
        payment_method: row.payment_method ?? "Import",
        tags: ["import"],
        is_recurring: false,
      });
      inserted++;
    }
    return { inserted, truncated: args.rows.length > MAX_BULK_IMPORT };
  },
});

export const seedDemo = mutation({
  args: { workspace: v.optional(workspaceKey), userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const ws = args.workspace ?? "personal";
    await ctx.db.insert("transactions", {
      workspace: ws,
      userId: args.userId,
      amount: 12.5,
      type: "expense",
      category: "Food & Dining",
      merchant: "Demo Cafe",
      date: new Date().toISOString().split("T")[0],
      description: "Demo transaction (seed)",
      payment_method: "Card",
      tags: ["demo"],
      is_recurring: false,
    });
  },
});
