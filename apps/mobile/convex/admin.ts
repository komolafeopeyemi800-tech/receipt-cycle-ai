import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getLifetimeProEmails } from "./_subscriptionLogic";

type AppConfigDoc = {
  _id: string;
  _creationTime: number;
  key: string;
  maintenanceMode?: boolean;
  scannerEnabled?: boolean;
  uploadEnabled?: boolean;
  manualAddEnabled?: boolean;
  exportEnabled?: boolean;
  webDashboardEnabled?: boolean;
  webTransactionsEnabled?: boolean;
  webUploadEnabled?: boolean;
  webSettingsEnabled?: boolean;
  mobileScanPageEnabled?: boolean;
  mobileUploadPageEnabled?: boolean;
  mobileAddPageEnabled?: boolean;
  adminManagedPreferences?: boolean;
  prefReimbursements?: boolean;
  prefTxnNumber?: boolean;
  prefScanPayment?: boolean;
  prefRequirePay?: boolean;
  prefRequireNotes?: boolean;
  freeCameraLimit?: number;
  freeUploadLimit?: number;
  freeManualLimit?: number;
  updatedAt?: number;
  updatedBy?: string;
};

function getAdminSecret() {
  return process.env.ADMIN_DASHBOARD_SECRET?.trim() ?? "";
}

function getAllowedAdminEmails() {
  const fromEnv = process.env.ADMIN_DASHBOARD_ADMIN_EMAILS?.trim() ?? "";
  const list = fromEnv
    ? fromEnv
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)
    : [];
  for (const e of getLifetimeProEmails()) {
    const n = e.trim().toLowerCase();
    if (!list.includes(n)) list.push(n);
  }
  return list;
}

function requireAdmin(secret: string, adminEmail: string) {
  const expected = getAdminSecret();
  if (!expected) throw new Error("ADMIN_DASHBOARD_SECRET is not configured on this deployment.");
  if (secret !== expected) throw new Error("Unauthorized admin access.");
  const email = adminEmail.trim().toLowerCase();
  if (!getAllowedAdminEmails().includes(email)) {
    throw new Error("This account is not allowed to access admin dashboard.");
  }
}

function sanitizeLimit(n: number | undefined, fallback: number) {
  if (!Number.isFinite(n ?? NaN)) return fallback;
  const rounded = Math.floor(n as number);
  return Math.max(0, Math.min(5000, rounded));
}

function toPublicConfig(row: AppConfigDoc | null) {
  return {
    maintenanceMode: row?.maintenanceMode ?? false,
    scannerEnabled: row?.scannerEnabled ?? true,
    uploadEnabled: row?.uploadEnabled ?? true,
    manualAddEnabled: row?.manualAddEnabled ?? true,
    exportEnabled: row?.exportEnabled ?? true,
    webDashboardEnabled: row?.webDashboardEnabled ?? true,
    webTransactionsEnabled: row?.webTransactionsEnabled ?? true,
    webUploadEnabled: row?.webUploadEnabled ?? true,
    webSettingsEnabled: row?.webSettingsEnabled ?? true,
    mobileScanPageEnabled: row?.mobileScanPageEnabled ?? true,
    mobileUploadPageEnabled: row?.mobileUploadPageEnabled ?? true,
    mobileAddPageEnabled: row?.mobileAddPageEnabled ?? true,
    adminManagedPreferences: row?.adminManagedPreferences ?? false,
    prefReimbursements: row?.prefReimbursements ?? null,
    prefTxnNumber: row?.prefTxnNumber ?? null,
    prefScanPayment: row?.prefScanPayment ?? null,
    prefRequirePay: row?.prefRequirePay ?? null,
    prefRequireNotes: row?.prefRequireNotes ?? null,
    freeCameraLimit: sanitizeLimit(row?.freeCameraLimit, 20),
    freeUploadLimit: sanitizeLimit(row?.freeUploadLimit, 20),
    freeManualLimit: sanitizeLimit(row?.freeManualLimit, 60),
    updatedAt: row?.updatedAt ?? null,
    updatedBy: row?.updatedBy ?? null,
  };
}

async function getConfigRow(ctx: { db: { query: (table: "appConfig") => { withIndex: Function } } }) {
  return (await ctx.db
    .query("appConfig")
    .withIndex("by_key", (q: { eq: Function }) => q.eq("key", "global"))
    .unique()) as AppConfigDoc | null;
}

export const publicConfig = query({
  args: {},
  handler: async (ctx) => {
    const row = await getConfigRow(ctx);
    return toPublicConfig(row);
  },
});

export const isCurrentUserAdmin = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    if (!token?.trim()) return false;
    const me = (await ctx.runQuery(internal.auth.getUserForPasswordChange, { token: token.trim() })) as
      | { user?: { email?: string } }
      | null;
    const email = me?.user?.email?.trim().toLowerCase();
    if (!email) return false;
    return getAllowedAdminEmails().includes(email);
  },
});

export const adminConfig = query({
  args: { secret: v.string(), adminEmail: v.string() },
  handler: async (ctx, { secret, adminEmail }) => {
    requireAdmin(secret, adminEmail);
    const row = await getConfigRow(ctx);
    return toPublicConfig(row);
  },
});

export const dashboardStats = query({
  args: { secret: v.string(), adminEmail: v.string() },
  handler: async (ctx, { secret, adminEmail }) => {
    requireAdmin(secret, adminEmail);

    const users = await ctx.db.query("users").collect();
    const txs = await ctx.db.query("transactions").collect();
    const sessions = await ctx.db.query("sessions").collect();
    const now = Date.now();
    const d30 = now - 30 * 24 * 60 * 60 * 1000;
    const d60 = now - 60 * 24 * 60 * 60 * 1000;

    const users30 = users.filter((u) => u._creationTime >= d30).length;
    const usersPrev30 = users.filter((u) => u._creationTime >= d60 && u._creationTime < d30).length;
    const tx30 = txs.filter((t) => t._creationTime >= d30).length;
    const txPrev30 = txs.filter((t) => t._creationTime >= d60 && t._creationTime < d30).length;

    const userGrowthPct =
      usersPrev30 === 0 ? (users30 > 0 ? 100 : 0) : Math.round(((users30 - usersPrev30) / usersPrev30) * 100);
    const txGrowthPct = txPrev30 === 0 ? (tx30 > 0 ? 100 : 0) : Math.round(((tx30 - txPrev30) / txPrev30) * 100);

    const activeUsers30Set = new Set(
      sessions.filter((s) => s.expiresAt >= d30).map((s) => String(s.userId)),
    );
    const activeUsersPrev30Set = new Set(
      sessions.filter((s) => s.expiresAt >= d60 && s.expiresAt < d30).map((s) => String(s.userId)),
    );
    const activeUsers30 = activeUsers30Set.size;
    const activeUsersPrev30 = activeUsersPrev30Set.size;
    const activeGrowthPct =
      activeUsersPrev30 === 0
        ? activeUsers30 > 0
          ? 100
          : 0
        : Math.round(((activeUsers30 - activeUsersPrev30) / activeUsersPrev30) * 100);

    const monthly: Array<{ month: string; users: number; transactions: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setUTCMonth(d.getUTCMonth() - i, 1);
      d.setUTCHours(0, 0, 0, 0);
      const start = d.getTime();
      const endDate = new Date(d);
      endDate.setUTCMonth(endDate.getUTCMonth() + 1, 1);
      const end = endDate.getTime();
      const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      monthly.push({
        month,
        users: users.filter((u) => u._creationTime >= start && u._creationTime < end).length,
        transactions: txs.filter((t) => t._creationTime >= start && t._creationTime < end).length,
      });
    }

    return {
      totals: {
        users: users.length,
        transactions: txs.length,
      },
      growth: {
        users30,
        usersPrev30,
        userGrowthPct,
        activeUsers30,
        activeUsersPrev30,
        activeGrowthPct,
        tx30,
        txPrev30,
        txGrowthPct,
      },
      monthly,
    };
  },
});

export const recentUsers = query({
  args: { secret: v.string(), adminEmail: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { secret, adminEmail, limit }) => {
    requireAdmin(secret, adminEmail);
    const lim = Math.max(1, Math.min(200, Math.floor(limit ?? 50)));
    const users = await ctx.db.query("users").collect();
    users.sort((a, b) => b._creationTime - a._creationTime);
    return users.slice(0, lim).map((u) => ({
      id: u._id,
      email: u.email,
      name: u.name ?? null,
      createdAt: u._creationTime,
      googleLinked: Boolean(u.googleSub),
    }));
  },
});

export const recentAuditLogs = query({
  args: { secret: v.string(), adminEmail: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { secret, adminEmail, limit }) => {
    requireAdmin(secret, adminEmail);
    const lim = Math.max(1, Math.min(200, Math.floor(limit ?? 80)));
    const logs = await ctx.db.query("adminAuditLogs").collect();
    logs.sort((a, b) => b.createdAt - a.createdAt);
    return logs.slice(0, lim);
  },
});

export const updateConfig = mutation({
  args: {
    secret: v.string(),
    adminEmail: v.string(),
    actor: v.optional(v.string()),
    maintenanceMode: v.optional(v.boolean()),
    scannerEnabled: v.optional(v.boolean()),
    uploadEnabled: v.optional(v.boolean()),
    manualAddEnabled: v.optional(v.boolean()),
    exportEnabled: v.optional(v.boolean()),
    webDashboardEnabled: v.optional(v.boolean()),
    webTransactionsEnabled: v.optional(v.boolean()),
    webUploadEnabled: v.optional(v.boolean()),
    webSettingsEnabled: v.optional(v.boolean()),
    mobileScanPageEnabled: v.optional(v.boolean()),
    mobileUploadPageEnabled: v.optional(v.boolean()),
    mobileAddPageEnabled: v.optional(v.boolean()),
    adminManagedPreferences: v.optional(v.boolean()),
    prefReimbursements: v.optional(v.boolean()),
    prefTxnNumber: v.optional(v.boolean()),
    prefScanPayment: v.optional(v.boolean()),
    prefRequirePay: v.optional(v.boolean()),
    prefRequireNotes: v.optional(v.boolean()),
    freeCameraLimit: v.optional(v.number()),
    freeUploadLimit: v.optional(v.number()),
    freeManualLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    requireAdmin(args.secret, args.adminEmail);
    const row = await getConfigRow(ctx);
    const patch = {
      ...(args.maintenanceMode !== undefined ? { maintenanceMode: args.maintenanceMode } : {}),
      ...(args.scannerEnabled !== undefined ? { scannerEnabled: args.scannerEnabled } : {}),
      ...(args.uploadEnabled !== undefined ? { uploadEnabled: args.uploadEnabled } : {}),
      ...(args.manualAddEnabled !== undefined ? { manualAddEnabled: args.manualAddEnabled } : {}),
      ...(args.exportEnabled !== undefined ? { exportEnabled: args.exportEnabled } : {}),
      ...(args.webDashboardEnabled !== undefined ? { webDashboardEnabled: args.webDashboardEnabled } : {}),
      ...(args.webTransactionsEnabled !== undefined ? { webTransactionsEnabled: args.webTransactionsEnabled } : {}),
      ...(args.webUploadEnabled !== undefined ? { webUploadEnabled: args.webUploadEnabled } : {}),
      ...(args.webSettingsEnabled !== undefined ? { webSettingsEnabled: args.webSettingsEnabled } : {}),
      ...(args.mobileScanPageEnabled !== undefined ? { mobileScanPageEnabled: args.mobileScanPageEnabled } : {}),
      ...(args.mobileUploadPageEnabled !== undefined ? { mobileUploadPageEnabled: args.mobileUploadPageEnabled } : {}),
      ...(args.mobileAddPageEnabled !== undefined ? { mobileAddPageEnabled: args.mobileAddPageEnabled } : {}),
      ...(args.adminManagedPreferences !== undefined ? { adminManagedPreferences: args.adminManagedPreferences } : {}),
      ...(args.prefReimbursements !== undefined ? { prefReimbursements: args.prefReimbursements } : {}),
      ...(args.prefTxnNumber !== undefined ? { prefTxnNumber: args.prefTxnNumber } : {}),
      ...(args.prefScanPayment !== undefined ? { prefScanPayment: args.prefScanPayment } : {}),
      ...(args.prefRequirePay !== undefined ? { prefRequirePay: args.prefRequirePay } : {}),
      ...(args.prefRequireNotes !== undefined ? { prefRequireNotes: args.prefRequireNotes } : {}),
      ...(args.freeCameraLimit !== undefined
        ? { freeCameraLimit: sanitizeLimit(args.freeCameraLimit, 20) }
        : {}),
      ...(args.freeUploadLimit !== undefined
        ? { freeUploadLimit: sanitizeLimit(args.freeUploadLimit, 20) }
        : {}),
      ...(args.freeManualLimit !== undefined
        ? { freeManualLimit: sanitizeLimit(args.freeManualLimit, 60) }
        : {}),
      updatedAt: Date.now(),
      updatedBy: args.actor ?? "admin-web",
    };

    if (!row) {
      await ctx.db.insert("appConfig", {
        key: "global",
        maintenanceMode: patch.maintenanceMode ?? false,
        scannerEnabled: patch.scannerEnabled ?? true,
        uploadEnabled: patch.uploadEnabled ?? true,
        manualAddEnabled: patch.manualAddEnabled ?? true,
        exportEnabled: patch.exportEnabled ?? true,
        webDashboardEnabled: patch.webDashboardEnabled ?? true,
        webTransactionsEnabled: patch.webTransactionsEnabled ?? true,
        webUploadEnabled: patch.webUploadEnabled ?? true,
        webSettingsEnabled: patch.webSettingsEnabled ?? true,
        mobileScanPageEnabled: patch.mobileScanPageEnabled ?? true,
        mobileUploadPageEnabled: patch.mobileUploadPageEnabled ?? true,
        mobileAddPageEnabled: patch.mobileAddPageEnabled ?? true,
        adminManagedPreferences: patch.adminManagedPreferences ?? false,
        prefReimbursements: patch.prefReimbursements,
        prefTxnNumber: patch.prefTxnNumber,
        prefScanPayment: patch.prefScanPayment,
        prefRequirePay: patch.prefRequirePay,
        prefRequireNotes: patch.prefRequireNotes,
        freeCameraLimit: patch.freeCameraLimit ?? 20,
        freeUploadLimit: patch.freeUploadLimit ?? 20,
        freeManualLimit: patch.freeManualLimit ?? 60,
        updatedAt: patch.updatedAt,
        updatedBy: patch.updatedBy,
      });
    } else {
      await ctx.db.patch(row._id as never, patch);
    }

    await ctx.db.insert("adminAuditLogs", {
      action: "config.update",
      actor: args.actor ?? "admin-web",
      details: JSON.stringify(patch),
      createdAt: Date.now(),
    });

    return { ok: true as const };
  },
});

/** Grant or revoke Pro (e.g. after Whop webhook, or testing). */
export const setUserProSubscription = mutation({
  args: {
    secret: v.string(),
    adminEmail: v.string(),
    userId: v.id("users"),
    proSubscriptionActive: v.boolean(),
    actor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireAdmin(args.secret, args.adminEmail);
    await ctx.db.patch(args.userId, { proSubscriptionActive: args.proSubscriptionActive });
    await ctx.db.insert("adminAuditLogs", {
      action: "subscription.set_pro",
      actor: args.actor ?? args.adminEmail,
      details: JSON.stringify({
        userId: args.userId,
        proSubscriptionActive: args.proSubscriptionActive,
      }),
      createdAt: Date.now(),
    });
    return { ok: true as const };
  },
});

export const systemHealth = action({
  args: { secret: v.string(), adminEmail: v.string() },
  handler: async (
    ctx,
    { secret, adminEmail },
  ): Promise<{ timestamp: number; ocr: unknown; runtime: Record<string, never> }> => {
    requireAdmin(secret, adminEmail);
    const ocr: unknown = await ctx.runAction(internal.ocrHealth.checkProviders, {});
    return {
      timestamp: Date.now(),
      ocr,
      runtime: {},
    };
  },
});

export const validateAccess = action({
  args: { secret: v.string(), adminEmail: v.string() },
  handler: async (_ctx, { secret, adminEmail }) => {
    requireAdmin(secret, adminEmail);
    return { ok: true as const };
  },
});
