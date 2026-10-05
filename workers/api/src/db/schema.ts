import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * D1 schema for Receipt Cycle (replaces apps/mobile/convex/schema.ts).
 *
 * Ids are UUID strings. Timestamps are unix milliseconds (integer), matching Convex `Date.now()`.
 * "Scope" columns solve a Convex-era bug: accounts/categories/budgets were keyed only by the
 * workspace string, so every user's "personal" workspace shared the same rows. A scope is
 * `u:<userId>:<workspaceKey>` for personal/business, or `ws:<slug>` for team workspaces.
 */

// ---------------------------------------------------------------------------
// Better Auth core tables (shape follows Better Auth's default Drizzle schema;
// regenerate with the Better Auth CLI in Phase 2 if the library version differs).
// ---------------------------------------------------------------------------

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const authAccount = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    /** Better Auth password hash for provider "credential" */
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("account_user_idx").on(t.userId), uniqueIndex("account_provider_idx").on(t.providerId, t.accountId)],
);

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// ---------------------------------------------------------------------------
// App tables
// ---------------------------------------------------------------------------

/** App-owned fields that used to live on the Convex `users` row. One row per user. */
export const profile = sqliteTable(
  "profile",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    plan: text("plan"),
    proSubscriptionActive: integer("pro_subscription_active", { mode: "boolean" }).notNull().default(false),
    trialStartedAt: integer("trial_started_at"),
    trialLifetimeAdds: integer("trial_lifetime_adds"),
    role: text("role"),
    status: text("status"),
    googleSub: text("google_sub"),
    whopSub: text("whop_sub"),
    /** Convex-era bcrypt hash; verified once at first login, then cleared (lazy rehash). */
    legacyPasswordHash: text("legacy_password_hash"),
    /** Original Convex user id, kept for the data migration and support lookups. */
    legacyConvexId: text("legacy_convex_id"),
  },
  (t) => [
    index("profile_google_sub_idx").on(t.googleSub),
    index("profile_whop_sub_idx").on(t.whopSub),
    index("profile_legacy_convex_idx").on(t.legacyConvexId),
  ],
);

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    workspace: text("workspace").notNull().default("personal"),
    amount: real("amount").notNull(),
    type: text("type").notNull(),
    category: text("category").notNull(),
    merchant: text("merchant"),
    date: text("date").notNull(),
    description: text("description"),
    paymentMethod: text("payment_method"),
    accountId: text("account_id"),
    /** JSON array of strings */
    tags: text("tags", { mode: "json" }).$type<string[]>(),
    isRecurring: integer("is_recurring", { mode: "boolean" }),
    /** R2 object key (or legacy URL) of the stored receipt image */
    receiptUrl: text("receipt_url"),
    /** JSON blob with the extracted OCR result */
    receiptData: text("receipt_data", { mode: "json" }).$type<unknown>(),
    entrySource: text("entry_source", { enum: ["camera", "upload", "manual"] }),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    index("txn_user_workspace_date_idx").on(t.userId, t.workspace, t.date),
    index("txn_account_idx").on(t.accountId),
  ],
);

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    name: text("name").notNull(),
    balance: real("balance").notNull().default(0),
    iconKey: text("icon_key"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("accounts_scope_idx").on(t.scope)],
);

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    name: text("name").notNull(),
    kind: text("kind", { enum: ["expense", "income"] }).notNull(),
    color: text("color").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("categories_scope_idx").on(t.scope)],
);

export const budgets = sqliteTable(
  "budgets",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    category: text("category").notNull(),
    month: text("month").notNull(),
    limitAmount: real("limit_amount").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("budgets_scope_month_category_idx").on(t.scope, t.month, t.category)],
);

export const workspaces = sqliteTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    /** Public key used by clients, e.g. ws_xxxx */
    slug: text("slug").notNull().unique(),
    kind: text("kind", { enum: ["team"] }).notNull().default("team"),
    ownerUserId: text("owner_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("workspaces_owner_idx").on(t.ownerUserId)],
);

export const workspaceInvites = sqliteTable(
  "workspace_invites",
  {
    id: text("id").primaryKey(),
    workspaceKey: text("workspace_key").notNull(),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    status: text("status", { enum: ["pending", "accepted"] }).notNull(),
    invitedBy: text("invited_by"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("invites_workspace_idx").on(t.workspaceKey)],
);

export const workspaceMembers = sqliteTable(
  "workspace_members",
  {
    id: text("id").primaryKey(),
    workspaceKey: text("workspace_key").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "member"] }).notNull(),
  },
  (t) => [
    uniqueIndex("members_user_workspace_idx").on(t.userId, t.workspaceKey),
    index("members_workspace_idx").on(t.workspaceKey),
  ],
);

export const userPreferences = sqliteTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  currency: text("currency").notNull(),
  dateFormat: text("date_format", { enum: ["iso", "us", "eu"] }).notNull(),
  merchants: text("merchants", { mode: "json" }).$type<string[]>().notNull(),
  locations: text("locations", { mode: "json" })
    .$type<{ id: string; label: string; address: string }[]>()
    .notNull(),
  reimbursements: integer("reimbursements", { mode: "boolean" }),
  txnNumber: integer("txn_number", { mode: "boolean" }),
  scanPayment: integer("scan_payment", { mode: "boolean" }),
  requirePay: integer("require_pay", { mode: "boolean" }),
  requireNotes: integer("require_notes", { mode: "boolean" }),
  voiceInputLanguage: text("voice_input_language"),
});

/** Single row, key = "global". Runtime switches and free-tier limits for web + mobile. */
export const appConfig = sqliteTable("app_config", {
  key: text("key").primaryKey(),
  maintenanceMode: integer("maintenance_mode", { mode: "boolean" }),
  scannerEnabled: integer("scanner_enabled", { mode: "boolean" }),
  uploadEnabled: integer("upload_enabled", { mode: "boolean" }),
  manualAddEnabled: integer("manual_add_enabled", { mode: "boolean" }),
  exportEnabled: integer("export_enabled", { mode: "boolean" }),
  webDashboardEnabled: integer("web_dashboard_enabled", { mode: "boolean" }),
  webTransactionsEnabled: integer("web_transactions_enabled", { mode: "boolean" }),
  webUploadEnabled: integer("web_upload_enabled", { mode: "boolean" }),
  webSettingsEnabled: integer("web_settings_enabled", { mode: "boolean" }),
  mobileScanPageEnabled: integer("mobile_scan_page_enabled", { mode: "boolean" }),
  mobileUploadPageEnabled: integer("mobile_upload_page_enabled", { mode: "boolean" }),
  mobileAddPageEnabled: integer("mobile_add_page_enabled", { mode: "boolean" }),
  adminManagedPreferences: integer("admin_managed_preferences", { mode: "boolean" }),
  prefReimbursements: integer("pref_reimbursements", { mode: "boolean" }),
  prefTxnNumber: integer("pref_txn_number", { mode: "boolean" }),
  prefScanPayment: integer("pref_scan_payment", { mode: "boolean" }),
  prefRequirePay: integer("pref_require_pay", { mode: "boolean" }),
  prefRequireNotes: integer("pref_require_notes", { mode: "boolean" }),
  freeCameraLimit: integer("free_camera_limit"),
  freeUploadLimit: integer("free_upload_limit"),
  freeManualLimit: integer("free_manual_limit"),
  updatedAt: integer("updated_at"),
  updatedBy: text("updated_by"),
});

export const adminAuditLogs = sqliteTable(
  "admin_audit_logs",
  {
    id: text("id").primaryKey(),
    action: text("action").notNull(),
    actor: text("actor").notNull(),
    details: text("details"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

/** Latest known Whop entitlement snapshot (lets access be granted before the user account exists). */
export const whopEntitlements = sqliteTable(
  "whop_entitlements",
  {
    id: text("id").primaryKey(),
    whopUserId: text("whop_user_id"),
    email: text("email"),
    membershipId: text("membership_id"),
    /** free | pro_monthly | pro_yearly | cancelling */
    subscriptionStatus: text("subscription_status").notNull(),
    proActive: integer("pro_active", { mode: "boolean" }).notNull(),
    paymentStatus: text("payment_status"),
    source: text("source"),
    lastEventType: text("last_event_type").notNull(),
    lastEventAt: integer("last_event_at").notNull(),
  },
  (t) => [index("whop_ent_user_idx").on(t.whopUserId), index("whop_ent_email_idx").on(t.email)],
);
