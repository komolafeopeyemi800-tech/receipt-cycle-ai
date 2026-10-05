/**
 * Every backend call the apps make, as a typed reference. `api.transactions.list` and friends keep
 * the names the Convex code used, so screens only changed their imports. Each entry says which
 * Worker route it hits and how to reshape the answer.
 */
import type { ApiClient } from "./client";
import type {
  Account,
  AdminArgs,
  AdminStats,
  AdminUser,
  AuditLog,
  AuthResult,
  Budget,
  Category,
  ConfigPatch,
  EntrySource,
  Finding,
  LedgerRow,
  Preferences,
  PublicConfig,
  ScanResult,
  SessionArgs,
  SubscriptionState,
  Transaction,
  TransactionFields,
  TxDraft,
  VoiceHints,
  WorkspaceSummary,
  BulkRow,
  DateFormat,
} from "./types";

export type FnKind = "query" | "mutation" | "action";
export type FnRef<A, R> = {
  readonly kind: FnKind;
  readonly name: string;
  readonly run: (client: ApiClient, args: A) => Promise<R>;
};

function fn<A, R>(kind: FnKind, name: string, run: (c: ApiClient, a: A) => Promise<R>): FnRef<A, R> {
  return { kind, name, run };
}

const tok = (a: SessionArgs) => a.token ?? a.sessionToken;
const enc = encodeURIComponent;
type NoArgs = Record<string, never>;
type Ok = { ok: boolean; error?: string };

type BetterAuthSession = { token: string; user: { id: string; email: string; name?: string | null } };
const toAuthResult = (r: BetterAuthSession, isNewRegistration: boolean): AuthResult => ({
  token: r.token,
  user: { id: r.user.id, email: r.user.email, name: r.user.name?.trim() || null },
  isNewRegistration,
});

const DEFAULT_WORKSPACES: WorkspaceSummary[] = [{ id: "personal", name: "Personal", sub: "INDIVIDUAL" }];

type PrefsArgs = Omit<Preferences, "userId"> & { userId?: string };
type AdminListArgs = AdminArgs & { limit?: number };
type UserPatch = AdminArgs & {
  userId: string;
  name?: string;
  role?: string;
  status?: string;
  plan?: string;
  proSubscriptionActive?: boolean;
};

export const api = {
  // ---- sign-in, sessions ----------------------------------------------------
  authNode: {
    signIn: fn<{ email: string; password: string }, AuthResult>("action", "authNode.signIn", async (c, a) =>
      toAuthResult(
        await c.request<BetterAuthSession>("POST", "/api/auth/sign-in/email", {
          body: { email: a.email, password: a.password },
          anonymous: true,
        }),
        false,
      ),
    ),
    signUp: fn<{ email: string; password: string; name?: string }, AuthResult>("action", "authNode.signUp", async (c, a) =>
      toAuthResult(
        await c.request<BetterAuthSession>("POST", "/api/auth/sign-up/email", {
          body: { email: a.email, password: a.password, name: a.name ?? "" },
          anonymous: true,
        }),
        true,
      ),
    ),
    signInWithGoogle: fn<{ idToken: string }, AuthResult>("action", "authNode.signInWithGoogle", (c, a) =>
      c.request<AuthResult>("POST", "/api/social/google", { body: { idToken: a.idToken }, anonymous: true }),
    ),
    changePassword: fn<SessionArgs & { currentPassword: string; newPassword: string }, { ok: true }>(
      "action",
      "authNode.changePassword",
      async (c, a) => {
        await c.request("POST", "/api/auth/change-password", {
          token: tok(a),
          body: { currentPassword: a.currentPassword, newPassword: a.newPassword, revokeOtherSessions: false },
        });
        return { ok: true };
      },
    ),
    requestPasswordReset: fn<{ email: string }, { ok: true; emailSent: boolean; devToken?: string }>(
      "action",
      "authNode.requestPasswordReset",
      async (c, a) => {
        await c.request("POST", "/api/auth/request-password-reset", {
          body: { email: a.email, redirectTo: `${c.webAppUrl}/reset-password` },
          anonymous: true,
        });
        // The server answers the same way whether or not the address exists.
        return { ok: true, emailSent: true };
      },
    ),
    resetPasswordWithToken: fn<{ token: string; newPassword: string }, { ok: true }>(
      "action",
      "authNode.resetPasswordWithToken",
      async (c, a) => {
        await c.request("POST", "/api/auth/reset-password", {
          body: { token: a.token, newPassword: a.newPassword },
          anonymous: true,
        });
        return { ok: true };
      },
    ),
  },

  auth: {
    me: fn<SessionArgs, { id: string; email: string; name: string | null } | null>("query", "auth.me", async (c, a) =>
      c.request("GET", "/api/me", { token: tok(a), onUnauthorized: "null" }),
    ),
    signOut: fn<SessionArgs, void>("mutation", "auth.signOut", async (c, a) => {
      await c.request("POST", "/api/auth/sign-out", { token: tok(a), body: {} });
    }),
    resetMyData: fn<SessionArgs, { ok: true }>("mutation", "auth.resetMyData", async (c, a) => {
      await c.request("POST", "/api/me/reset-data", { token: tok(a) });
      return { ok: true };
    }),
    deleteMyAccount: fn<SessionArgs, { ok: true }>("mutation", "auth.deleteMyAccount", async (c, a) => {
      await c.request("DELETE", "/api/me", { token: tok(a) });
      return { ok: true };
    }),
  },

  subscription: {
    getSubscriptionState: fn<SessionArgs, SubscriptionState | null>("query", "subscription.getSubscriptionState", (c, a) =>
      c.request("GET", "/api/subscription", { token: tok(a), onUnauthorized: "null" }),
    ),
    bootstrapSubscription: fn<SessionArgs, { ok: boolean }>("mutation", "subscription.bootstrapSubscription", (c, a) =>
      c.request("POST", "/api/subscription/bootstrap", { token: tok(a) }),
    ),
  },

  userPreferences: {
    get: fn<SessionArgs, Preferences | null>("query", "userPreferences.get", (c, a) =>
      c.request("GET", "/api/preferences", { token: tok(a), onUnauthorized: "null" }),
    ),
    upsert: fn<SessionArgs & PrefsArgs, void>("mutation", "userPreferences.upsert", async (c, a) => {
      const { token: _t, sessionToken: _s, userId: _u, ...prefs } = a;
      await c.request("PUT", "/api/preferences", { token: tok(a), body: prefs });
    }),
  },

  // ---- money data -----------------------------------------------------------
  transactions: {
    list: fn<
      SessionArgs & { workspace: string; startDate?: string; endDate?: string; category?: string; accountId?: string },
      Transaction[]
    >("query", "transactions.list", async (c, a) => {
      const rows = await c.request<Transaction[] | null>("GET", "/api/transactions", {
        token: tok(a),
        query: { workspace: a.workspace, startDate: a.startDate, endDate: a.endDate, category: a.category, accountId: a.accountId },
        onUnauthorized: "null",
      });
      return rows ?? [];
    }),
    get: fn<SessionArgs & { id: string }, Transaction | null>("query", "transactions.get", (c, a) =>
      c.request("GET", `/api/transactions/${enc(a.id)}`, { token: tok(a), onUnauthorized: "null", nullOn404: true }),
    ),
    exportForBackup: fn<SessionArgs, Transaction[]>("query", "transactions.exportForBackup", (c, a) =>
      c.request("GET", "/api/transactions/export", { token: tok(a) }),
    ),
    create: fn<
      SessionArgs & TransactionFields & { receipt_url?: string | null; entrySource?: EntrySource },
      string
    >("mutation", "transactions.create", async (c, a) => {
      const { token: _t, sessionToken: _s, userId: _u, ...body } = a;
      return (await c.request<{ id: string }>("POST", "/api/transactions", { token: tok(a), body })).id;
    }),
    update: fn<SessionArgs & TransactionFields & { id: string }, string>("mutation", "transactions.update", async (c, a) => {
      const { token: _t, sessionToken: _s, userId: _u, id, ...body } = a;
      return (await c.request<{ id: string }>("PUT", `/api/transactions/${enc(id)}`, { token: tok(a), body })).id;
    }),
    remove: fn<SessionArgs & { id: string }, void>("mutation", "transactions.remove", async (c, a) => {
      await c.request("DELETE", `/api/transactions/${enc(a.id)}`, { token: tok(a) });
    }),
    bulkImport: fn<SessionArgs & { workspace: string; rows: BulkRow[] }, { inserted: number; truncated: boolean }>(
      "mutation",
      "transactions.bulkImport",
      (c, a) =>
        c.request("POST", "/api/transactions/bulk-import", { token: tok(a), body: { workspace: a.workspace, rows: a.rows } }),
    ),
    /** Adds one sample row (the old version inserted an ownerless row nobody could see). */
    seedDemo: fn<SessionArgs & { workspace?: string }, void>("mutation", "transactions.seedDemo", async (c, a) => {
      await c.request("POST", "/api/transactions", {
        token: tok(a),
        body: {
          workspace: a.workspace ?? "personal",
          amount: 12.5,
          type: "expense",
          category: "Food & Dining",
          merchant: "Demo Cafe",
          date: new Date().toISOString().split("T")[0],
          description: "Demo transaction (seed)",
          payment_method: "Card",
          tags: ["demo"],
          is_recurring: false,
        },
      });
    }),
  },

  accounts: {
    list: fn<{ workspace: string }, Account[]>("query", "accounts.list", async (c, a) =>
      (await c.request<Account[] | null>("GET", "/api/accounts", { query: { workspace: a.workspace }, onUnauthorized: "null" })) ?? [],
    ),
    get: fn<{ id: string; workspace: string }, Account | null>("query", "accounts.get", (c, a) =>
      c.request("GET", `/api/accounts/${enc(a.id)}`, { query: { workspace: a.workspace }, onUnauthorized: "null", nullOn404: true }),
    ),
    ensureSeed: fn<{ workspace: string }, void>("mutation", "accounts.ensureSeed", async (c, a) => {
      await c.request("POST", "/api/accounts/ensure-seed", { body: { workspace: a.workspace } });
    }),
    create: fn<{ workspace: string; name: string; balance?: number; iconKey?: string }, string>(
      "mutation",
      "accounts.create",
      async (c, a) => (await c.request<{ id: string }>("POST", "/api/accounts", { body: a })).id,
    ),
    update: fn<{ id: string; name?: string; balance?: number; iconKey?: string }, void>(
      "mutation",
      "accounts.update",
      async (c, a) => {
        const { id, ...body } = a;
        await c.request("PATCH", `/api/accounts/${enc(id)}`, { body });
      },
    ),
  },

  categories: {
    list: fn<{ workspace: string }, Category[]>("query", "categories.list", async (c, a) =>
      (await c.request<Category[] | null>("GET", "/api/categories", { query: { workspace: a.workspace }, onUnauthorized: "null" })) ?? [],
    ),
    ensureSeed: fn<{ workspace: string }, void>("mutation", "categories.ensureSeed", async (c, a) => {
      await c.request("POST", "/api/categories/ensure-seed", { body: { workspace: a.workspace } });
    }),
    create: fn<{ workspace: string; name: string; kind: "expense" | "income"; color: string }, string>(
      "mutation",
      "categories.create",
      async (c, a) => (await c.request<{ id: string }>("POST", "/api/categories", { body: a })).id,
    ),
    update: fn<{ id: string; name?: string; color?: string; kind?: "expense" | "income" }, void>(
      "mutation",
      "categories.update",
      async (c, a) => {
        const { id, ...body } = a;
        await c.request("PATCH", `/api/categories/${enc(id)}`, { body });
      },
    ),
    remove: fn<{ id: string }, void>("mutation", "categories.remove", async (c, a) => {
      await c.request("DELETE", `/api/categories/${enc(a.id)}`);
    }),
  },

  budgets: {
    listForMonth: fn<{ workspace: string; month: string }, Budget[]>("query", "budgets.listForMonth", async (c, a) =>
      (await c.request<Budget[] | null>("GET", "/api/budgets", {
        query: { workspace: a.workspace, month: a.month },
        onUnauthorized: "null",
      })) ?? [],
    ),
    upsert: fn<SessionArgs & { workspace: string; category: string; month: string; limitAmount: number }, string>(
      "mutation",
      "budgets.upsert",
      async (c, a) =>
        (
          await c.request<{ id: string }>("PUT", "/api/budgets", {
            token: tok(a),
            body: { workspace: a.workspace, category: a.category, month: a.month, limitAmount: a.limitAmount },
          })
        ).id,
    ),
  },

  workspaces: {
    listAll: fn<{ ownerUserId?: string }, WorkspaceSummary[]>("query", "workspaces.listAll", async (c) =>
      (await c.request<WorkspaceSummary[] | null>("GET", "/api/workspaces", { onUnauthorized: "null" })) ?? DEFAULT_WORKSPACES,
    ),
    create: fn<{ name: string; ownerUserId?: string }, string>(
      "mutation",
      "workspaces.create",
      async (c, a) => (await c.request<{ slug: string }>("POST", "/api/workspaces", { body: { name: a.name } })).slug,
    ),
    createInvite: fn<{ workspaceKey: string; email: string; invitedBy?: string }, string>(
      "mutation",
      "workspaces.createInvite",
      async (c, a) =>
        (await c.request<{ token: string }>("POST", `/api/workspaces/${enc(a.workspaceKey)}/invites`, { body: { email: a.email } }))
          .token,
    ),
    acceptInvite: fn<{ token: string; userId?: string }, { workspaceKey: string }>("mutation", "workspaces.acceptInvite", (c, a) =>
      c.request("POST", "/api/workspaces/accept-invite", { body: { token: a.token } }),
    ),
    removeTeamWorkspace: fn<{ slug: string; userId?: string }, void>("mutation", "workspaces.removeTeamWorkspace", async (c, a) => {
      await c.request("DELETE", `/api/workspaces/${enc(a.slug)}`);
    }),
  },

  // ---- AI -------------------------------------------------------------------
  scanReceipt: {
    scanFromBase64: fn<SessionArgs & { imageBase64: string; mimeType?: string }, ScanResult>(
      "action",
      "scanReceipt.scanFromBase64",
      (c, a) => c.request("POST", "/api/ai/scan", { token: tok(a), body: { imageBase64: a.imageBase64, mimeType: a.mimeType } }),
    ),
    scanFromDocumentText: fn<SessionArgs & { text: string }, ScanResult>("action", "scanReceipt.scanFromDocumentText", (c, a) =>
      c.request("POST", "/api/ai/scan-text", { token: tok(a), body: { text: a.text } }),
    ),
  },
  moneyLeak: {
    analyzeMoneyLeaks: fn<
      SessionArgs & { periodLabel: string; rows: LedgerRow[] },
      Ok & { summary: string; findings: Finding[]; tips: string[] }
    >("action", "moneyLeak.analyzeMoneyLeaks", (c, a) =>
      c.request("POST", "/api/ai/money-leaks", { token: tok(a), body: { periodLabel: a.periodLabel, rows: a.rows } }),
    ),
  },
  voiceFinance: {
    transcribeUserAudio: fn<
      SessionArgs & { audioBase64: string; mimeType?: string; language?: string },
      Ok & { text: string }
    >("action", "voiceFinance.transcribeUserAudio", (c, a) =>
      c.request("POST", "/api/ai/voice/transcribe", {
        token: tok(a),
        body: { audioBase64: a.audioBase64, mimeType: a.mimeType, language: a.language },
      }),
    ),
    parseTransactionFromSpeech: fn<SessionArgs & { text: string; hints?: VoiceHints }, Ok & { draft: TxDraft | null }>(
      "action",
      "voiceFinance.parseTransactionFromSpeech",
      (c, a) => c.request("POST", "/api/ai/voice/parse", { token: tok(a), body: { text: a.text, hints: a.hints } }),
    ),
    voiceTransactionFromAudio: fn<
      SessionArgs & { audioBase64: string; mimeType?: string; language?: string; hints?: VoiceHints },
      Ok & { transcript: string; draft: TxDraft | null }
    >("action", "voiceFinance.voiceTransactionFromAudio", (c, a) =>
      c.request("POST", "/api/ai/voice/transaction", {
        token: tok(a),
        body: { audioBase64: a.audioBase64, mimeType: a.mimeType, language: a.language, hints: a.hints },
      }),
    ),
    financeCoachChat: fn<
      SessionArgs & { periodLabel: string; rows: LedgerRow[]; messages: { role: "user" | "assistant"; content: string }[] },
      Ok & { reply: string }
    >("action", "voiceFinance.financeCoachChat", (c, a) =>
      c.request("POST", "/api/ai/coach", {
        token: tok(a),
        body: { periodLabel: a.periodLabel, rows: a.rows, messages: a.messages },
      }),
    ),
  },
  email: {
    sendContactMessage: fn<
      { name: string; email: string; subject?: string; message: string; website?: string },
      { ok: true; delivered: boolean }
    >("action", "email.sendContactMessage", (c, a) => c.request("POST", "/api/contact", { body: a, anonymous: true })),
  },

  // ---- admin ----------------------------------------------------------------
  admin: {
    publicConfig: fn<NoArgs, PublicConfig>("query", "admin.publicConfig", (c) =>
      c.request("GET", "/api/config", { anonymous: true }),
    ),
    isCurrentUserAdmin: fn<{ token?: string }, boolean>("query", "admin.isCurrentUserAdmin", async (c, a) => {
      if (!a.token?.trim() && !c.getToken()) return false;
      return (await c.request<boolean | null>("GET", "/api/config/is-admin", { token: a.token, onUnauthorized: "null" })) === true;
    }),
    adminConfig: fn<AdminArgs, PublicConfig>("query", "admin.adminConfig", (c, a) =>
      c.request("GET", "/api/admin/config", { adminSecret: a.secret }),
    ),
    dashboardStats: fn<AdminArgs, AdminStats>("query", "admin.dashboardStats", (c, a) =>
      c.request("GET", "/api/admin/stats", { adminSecret: a.secret }),
    ),
    recentUsers: fn<AdminListArgs, AdminUser[]>("query", "admin.recentUsers", (c, a) =>
      c.request("GET", "/api/admin/users", { adminSecret: a.secret, query: { limit: a.limit } }),
    ),
    recentAuditLogs: fn<AdminListArgs, AuditLog[]>("query", "admin.recentAuditLogs", (c, a) =>
      c.request("GET", "/api/admin/audit-logs", { adminSecret: a.secret, query: { limit: a.limit } }),
    ),
    updateUserManagement: fn<UserPatch, { ok: true }>("mutation", "admin.updateUserManagement", async (c, a) => {
      const { secret, adminEmail: _e, actor: _a, userId, ...body } = a;
      await c.request("PATCH", `/api/admin/users/${enc(userId)}`, { adminSecret: secret, body });
      return { ok: true };
    }),
    setUserProSubscription: fn<AdminArgs & { userId: string; proSubscriptionActive: boolean }, { ok: true }>(
      "mutation",
      "admin.setUserProSubscription",
      async (c, a) => {
        await c.request("PATCH", `/api/admin/users/${enc(a.userId)}`, {
          adminSecret: a.secret,
          body: { proSubscriptionActive: a.proSubscriptionActive },
        });
        return { ok: true };
      },
    ),
    deleteUser: fn<AdminArgs & { userId: string }, { ok: true }>("mutation", "admin.deleteUser", async (c, a) => {
      await c.request("DELETE", `/api/admin/users/${enc(a.userId)}`, { adminSecret: a.secret });
      return { ok: true };
    }),
    updateConfig: fn<AdminArgs & ConfigPatch, { ok: true }>("mutation", "admin.updateConfig", async (c, a) => {
      const { secret, adminEmail: _e, actor: _a, ...patch } = a;
      await c.request("PUT", "/api/admin/config", { adminSecret: secret, body: patch });
      return { ok: true };
    }),
    systemHealth: fn<AdminArgs, { timestamp: number; ocr: unknown; runtime: Record<string, never> }>(
      "action",
      "admin.systemHealth",
      (c, a) => c.request("GET", "/api/admin/system-health", { adminSecret: a.secret }),
    ),
    validateAccess: fn<AdminArgs, { ok: true }>("action", "admin.validateAccess", (c, a) =>
      c.request("GET", "/api/admin/validate", { adminSecret: a.secret }),
    ),
  },
};

export type { DateFormat };
