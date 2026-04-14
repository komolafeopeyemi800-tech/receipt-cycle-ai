import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import {
  assertCanCreateTransaction,
  assertCanEditTransaction,
  assertCanExportCsv,
  computeSubscriptionState,
  incrementTrialAddsIfNeeded,
  type UserSubDoc,
} from "./_subscriptionLogic";

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

async function loadUserSubscriptionState(ctx: { db: { get: (id: Id<"users">) => Promise<unknown> } }, userId: string) {
  let user: UserSubDoc | null = null;
  try {
    user = (await ctx.db.get(userId as Id<"users">)) as UserSubDoc | null;
  } catch {
    user = null;
  }
  if (!user) throw new Error("You must be signed in to continue.");
  const state = computeSubscriptionState(user, Date.now());
  return { user, state };
}

async function requireAuthorizedUserId(
  ctx: { runQuery: (ref: unknown, args: { token: string }) => Promise<unknown> },
  token: string,
  claimedUserId: string | undefined,
): Promise<string> {
  const normalized = token.trim();
  if (!normalized) throw new Error("Sign in required.");
  const me = (await ctx.runQuery(api.auth.me, { token: normalized })) as { id?: string } | null;
  const authedUserId = me?.id?.trim();
  if (!authedUserId) throw new Error("Sign in required.");
  if (claimedUserId?.trim() && claimedUserId.trim() !== authedUserId) {
    throw new Error("Forbidden");
  }
  return authedUserId;
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
  args: { userId: v.optional(v.string()), token: v.string() },
  handler: async (ctx, { userId, token }) => {
    const authedUserId = await requireAuthorizedUserId(ctx, token, userId);
    const { state } = await loadUserSubscriptionState(ctx, authedUserId);
    assertCanExportCsv(state);
    const all = await ctx.db.query("transactions").collect();
    const rows = all.filter((d) => (d as TransactionDoc).userId === authedUserId);
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
    token: v.string(),
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
    const authedUserId = await requireAuthorizedUserId(ctx, args.token, args.userId);
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
    const { state } = await loadUserSubscriptionState(ctx, authedUserId);
    assertCanCreateTransaction(state);
    const { workspace, userId: _claimedUserId, accountId, token: _token, ...rest } = args;
    const id = await ctx.db.insert("transactions", {
      workspace,
      userId: authedUserId,
      accountId,
      ...rest,
      entrySource,
    });
    if (accountId && args.amount > 0) {
      await applyAccountDelta(ctx, accountId, workspace, args.amount, args.type);
    }
    await incrementTrialAddsIfNeeded(ctx, authedUserId as Id<"users">);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("transactions"),
    workspace: workspaceKey,
    userId: v.optional(v.string()),
    token: v.string(),
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
    const authedUserId = await requireAuthorizedUserId(ctx, args.token, args.userId);
    if (old.userId !== authedUserId) throw new Error("Forbidden");

    const { state } = await loadUserSubscriptionState(ctx, authedUserId);
    assertCanEditTransaction(state);

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
  args: { id: v.id("transactions"), userId: v.optional(v.string()), token: v.string() },
  handler: async (ctx, { id, userId, token }) => {
    const row = (await ctx.db.get(id)) as TransactionDoc & { accountId?: Id<"accounts">; workspace?: string } | null;
    if (!row) throw new Error("Transaction not found");
    const authedUserId = await requireAuthorizedUserId(ctx, token, userId);
    if (row.userId !== authedUserId) throw new Error("Forbidden");
    const { state } = await loadUserSubscriptionState(ctx, authedUserId);
    assertCanEditTransaction(state);
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
    token: v.string(),
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
    const authedUserId = await requireAuthorizedUserId(ctx, args.token, args.userId);
    const cfg = await getRuntimeConfig(ctx);
    if (cfg.maintenanceMode) throw new Error("System is in maintenance mode. Please try again later.");
    if (!cfg.uploadEnabled) throw new Error("Upload import is currently disabled by admin.");
    const { state } = await loadUserSubscriptionState(ctx, authedUserId);
    const slice = args.rows.slice(0, MAX_BULK_IMPORT);
    if (!state.pro && slice.length > state.trialAddsRemaining) {
      throw new Error(
        `This import has ${slice.length} rows but your trial has ${state.trialAddsRemaining} transaction slot(s) left. Upgrade to Pro for unlimited imports, or reduce the file.`,
      );
    }
    if (slice.length > 0) assertCanCreateTransaction(state);
    let inserted = 0;
    for (const row of slice) {
      await ctx.db.insert("transactions", {
        workspace: args.workspace,
        userId: authedUserId,
        amount: row.amount,
        type: row.type,
        category: row.category,
        date: row.date,
        merchant: row.merchant,
        description: row.description,
        payment_method: row.payment_method ?? "Import",
        tags: ["import"],
        is_recurring: false,
        entrySource: "upload",
      });
      inserted++;
      await incrementTrialAddsIfNeeded(ctx, authedUserId as Id<"users">);
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
