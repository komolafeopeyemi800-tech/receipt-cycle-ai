import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
    polarCustomerId: text("polar_customer_id"),
    /** Convex-era bcrypt hash; verified once at first login, then cleared (lazy rehash). */
    legacyPasswordHash: text("legacy_password_hash"),
    /** Original Convex user id, kept for the data migration and support lookups. */
    legacyConvexId: text("legacy_convex_id"),
  },
  (t) => [
    index("profile_google_sub_idx").on(t.googleSub),
    index("profile_polar_customer_idx").on(t.polarCustomerId),
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

export const notificationPreferences = sqliteTable("notification_preferences", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  dailyReminder: integer("daily_reminder", { mode: "boolean" }).notNull().default(true),
  invoiceReminders: integer("invoice_reminders", { mode: "boolean" }).notNull().default(true),
  overdueReminders: integer("overdue_reminders", { mode: "boolean" }).notNull().default(true),
  paymentConfirmations: integer("payment_confirmations", { mode: "boolean" }).notNull().default(true),
  budgetAlerts: integer("budget_alerts", { mode: "boolean" }).notNull().default(true),
  weeklyReports: integer("weekly_reports", { mode: "boolean" }).notNull().default(false),
  marketingUpdates: integer("marketing_updates", { mode: "boolean" }).notNull().default(true),
  timezone: text("timezone").notNull().default("UTC"),
  updatedAt: integer("updated_at").notNull(),
});

export const pushDevices = sqliteTable("push_devices", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  platform: text("platform", { enum: ["android", "ios", "web"] }).notNull(),
  deviceId: text("device_id").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  permissionStatus: text("permission_status").notNull(),
  lastSeenAt: integer("last_seen_at").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (t) => [uniqueIndex("push_device_user_device_idx").on(t.userId, t.deviceId), index("push_device_user_active_idx").on(t.userId, t.active)]);

export const notificationTemplates = sqliteTable("notification_templates", {
  key: text("key").primaryKey(), name: text("name").notNull(), category: text("category").notNull(),
  title: text("title").notNull(), body: text("body").notNull(), route: text("route").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  androidEnabled: integer("android_enabled", { mode: "boolean" }).notNull().default(true),
  webEnabled: integer("web_enabled", { mode: "boolean" }).notNull().default(true),
  webAccessMentions: integer("web_access_mentions", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at").notNull(), updatedBy: text("updated_by").notNull(),
  /** sequence | pool | event | quota | campaign */
  kind: text("kind").notNull().default("event"),
  /** Which preference switch controls it: dailyReminder, invoiceReminders, ..., marketingUpdates, or none (service notices). */
  toggle: text("toggle").notNull().default("marketingUpdates"),
  /** Who may receive it: all, paid, trial, expired_free, has_overdue, voice_unused. */
  audience: text("audience").notNull().default("all"),
  weight: integer("weight").notNull().default(1),
  cooldownDays: integer("cooldown_days").notNull().default(10),
  /** Wording used for web push / email, or on Android when the admin allows web-access mentions. */
  bodyWebMention: text("body_web_mention"),
  sequenceDay: integer("sequence_day"),
  windowStart: integer("window_start"),
  windowEnd: integer("window_end"),
  delayMinutes: integer("delay_minutes"),
  /** Comma separated: android, web. */
  channels: text("channels").notNull().default("android,web"),
  version: integer("version").notNull().default(1),
});

export const notificationTemplateHistory = sqliteTable("notification_template_history", {
  id: text("id").primaryKey(), templateKey: text("template_key").notNull(), version: integer("version").notNull(),
  snapshot: text("snapshot").notNull(), updatedAt: integer("updated_at").notNull(), updatedBy: text("updated_by").notNull(),
}, (t) => [index("notification_template_history_key_idx").on(t.templateKey, t.version)]);

export const notificationCampaigns = sqliteTable("notification_campaigns", {
  id: text("id").primaryKey(), name: text("name").notNull(), templateKey: text("template_key").notNull(),
  fields: text("fields").notNull().default("{}"), audience: text("audience").notNull().default("{}"),
  sendMode: text("send_mode").notNull().default("now"), sendAt: integer("send_at"),
  status: text("status").notNull().default("draft"), createdBy: text("created_by").notNull(),
  queued: integer("queued").notNull().default(0), createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(),
}, (t) => [index("notification_campaign_status_idx").on(t.status, t.sendAt)]);

export const notificationSettings = sqliteTable("notification_settings", {
  key: text("key").primaryKey(), globalEnabled: integer("global_enabled", { mode: "boolean" }).notNull().default(false),
  lifecycleEnabled: integer("lifecycle_enabled", { mode: "boolean" }).notNull().default(true),
  remindersEnabled: integer("reminders_enabled", { mode: "boolean" }).notNull().default(true),
  transactionalEnabled: integer("transactional_enabled", { mode: "boolean" }).notNull().default(true),
  marketingEnabled: integer("marketing_enabled", { mode: "boolean" }).notNull().default(true),
  androidOfferCampaignsEnabled: integer("android_offer_campaigns_enabled", { mode: "boolean" }).notNull().default(false),
  quietHoursStart: integer("quiet_hours_start").notNull().default(21), quietHoursEnd: integer("quiet_hours_end").notNull().default(8),
  combinedDailyCap: integer("combined_daily_cap").notNull().default(8), transactionalDailyCap: integer("transactional_daily_cap").notNull().default(6),
  updatedAt: integer("updated_at").notNull(), updatedBy: text("updated_by").notNull(),
  lifecycleDailyCap: integer("lifecycle_daily_cap").notNull().default(1),
  dailyReminderCap: integer("daily_reminder_cap").notNull().default(1),
  marketingDailyCap: integer("marketing_daily_cap").notNull().default(1),
  campaignsPerWeek: integer("campaigns_per_week").notNull().default(2),
  campaignMinGapHours: integer("campaign_min_gap_hours").notNull().default(48),
  jobExpiryHours: integer("job_expiry_hours").notNull().default(12),
  backoffEnabled: integer("backoff_enabled", { mode: "boolean" }).notNull().default(true),
  /** Lets Android pushes use the "web version" wording. Off until Google Play rules are confirmed for your account. */
  webAccessMentionsAndroid: integer("web_access_mentions_android", { mode: "boolean" }).notNull().default(false),
});

export const notificationJobs = sqliteTable("notification_jobs", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  templateKey: text("template_key").notNull(), category: text("category").notNull(), route: text("route").notNull(),
  title: text("title").notNull(), body: text("body").notNull(), scheduledFor: integer("scheduled_for").notNull(), expiresAt: integer("expires_at").notNull(),
  status: text("status").notNull(), priority: integer("priority").notNull(), dedupeKey: text("dedupe_key").notNull().unique(), attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"), createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(),
  toggle: text("toggle").notNull().default("marketingUpdates"),
  kind: text("kind").notNull().default("event"),
  bodyWebMention: text("body_web_mention"),
  /** JSON: facts the sender re-checks just before sending (invoice id, budget key, ...). */
  payload: text("payload").notNull().default("{}"),
  collapseKey: text("collapse_key"),
  ttlSeconds: integer("ttl_seconds").notNull().default(43200),
  channels: text("channels").notNull().default("android,web"),
  campaignId: text("campaign_id"),
}, (t) => [index("notification_job_status_due_idx").on(t.status, t.scheduledFor), index("notification_job_user_created_idx").on(t.userId, t.createdAt)]);

export const notificationAttempts = sqliteTable("notification_attempts", {
  id: text("id").primaryKey(), jobId: text("job_id").notNull().references(() => notificationJobs.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(), deviceId: text("device_id"), status: text("status").notNull(), providerMessageId: text("provider_message_id"),
  errorCode: text("error_code"), errorMessage: text("error_message"), createdAt: integer("created_at").notNull(),
}, (t) => [index("notification_attempt_job_idx").on(t.jobId), index("notification_attempt_user_created_idx").on(t.userId, t.createdAt)]);

export const notificationEvents = sqliteTable("notification_events", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), jobId: text("job_id"), kind: text("kind").notNull(), createdAt: integer("created_at").notNull(),
}, (t) => [index("notification_event_user_created_idx").on(t.userId, t.createdAt)]);

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
  /** Per person, per rolling 24 hours, for every plan. Admin only: never sent to the apps. */
  dailyScanLimit: integer("daily_scan_limit"),
  dailyVoiceLimit: integer("daily_voice_limit"),
  dailyUploadLimit: integer("daily_upload_limit"),
  dailyAssistantLimit: integer("daily_assistant_limit"),
  /** AI cost guard (see lib/aiBudget.ts). Empty means the default: 60 cents a day, 400 cents a month, 20 calls per 10 minutes, on. */
  aiDailyBudgetCents: integer("ai_daily_budget_cents"),
  aiMonthlyBudgetCents: integer("ai_monthly_budget_cents"),
  aiBurstCalls: integer("ai_burst_calls"),
  aiGuardEnabled: integer("ai_guard_enabled", { mode: "boolean" }),
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

/** Latest known billing (Polar) entitlement snapshot (lets access be granted before the user account exists). */
export const billingEntitlements = sqliteTable(
  "billing_entitlements",
  {
    id: text("id").primaryKey(),
    polarCustomerId: text("polar_customer_id"),
    email: text("email"),
    membershipId: text("membership_id"),
    /** free | pro_monthly | pro_yearly | pro_lifetime | cancelling */
    subscriptionStatus: text("subscription_status").notNull(),
    proActive: integer("pro_active", { mode: "boolean" }).notNull(),
    paymentStatus: text("payment_status"),
    source: text("source"),
    lastEventType: text("last_event_type").notNull(),
    lastEventAt: integer("last_event_at").notNull(),
  },
  (t) => [index("billing_ent_customer_idx").on(t.polarCustomerId), index("billing_ent_email_idx").on(t.email)],
);

/**
 * One row per file a user has uploaded for import, keyed by the file's SHA-256. Uploading the same
 * file again returns this result instead of reading (and possibly paying to read) it twice.
 */
export const uploadParses = sqliteTable(
  "upload_parses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    fileHash: text("file_hash").notNull(),
    fileName: text("file_name").notNull(),
    fileType: text("file_type"),
    /** "heuristic" (no AI) or "ai" */
    source: text("source", { enum: ["heuristic", "ai"] }).notNull(),
    rowCount: integer("row_count").notNull(),
    /** JSON of the ParseResult returned to the client */
    result: text("result").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("upload_parses_user_hash_idx").on(t.userId, t.fileHash), index("upload_parses_user_created_idx").on(t.userId, t.createdAt)],
);

/** Fixed-window counters: per-user AI budget, and brute-force limits on sign-in and email sending. */
export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: integer("window_start").notNull(),
  count: integer("count").notNull(),
});

/**
 * Invoices, estimates, payments, customers, catalog items and business settings. One row per record, stored as JSON,
 * so the web app and the mobile app read and write exactly the same data. Deleted rows stay as tombstones so a delete
 * on one device reaches the others.
 */
export const salesRecords = sqliteTable(
  "sales_records",
  {
    scope: text("scope").notNull(),
    kind: text("kind").notNull(),
    id: text("id").notNull(),
    data: text("data").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deleted: integer("deleted").notNull().default(0),
    updatedBy: text("updated_by"),
  },
  (t) => [primaryKey({ columns: [t.scope, t.kind, t.id] }), index("sales_records_scope_updated_idx").on(t.scope, t.updatedAt)],
);

/** Opaque bearer links for customer-facing invoice and estimate snapshots. */
export const publicDocumentLinks = sqliteTable(
  "public_document_links",
  {
    token: text("token").primaryKey(),
    scope: text("scope").notNull(),
    kind: text("kind", { enum: ["invoice", "estimate"] }).notNull(),
    documentId: text("document_id").notNull(),
    snapshot: text("snapshot").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [uniqueIndex("public_document_scope_kind_id_idx").on(t.scope, t.kind, t.documentId)],
);

/** Original uploaded files (statements, receipts, invoices) with the details read from them (JSON `meta`). The file is in R2. */
export const documents = sqliteTable(
  "documents",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["bank_statement", "card_statement", "receipt", "invoice", "spreadsheet", "other"] }).notNull(),
    fileName: text("file_name").notNull(),
    r2Key: text("r2_key").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    meta: text("meta").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("documents_user_created_idx").on(t.userId, t.createdAt), uniqueIndex("documents_r2_key_idx").on(t.r2Key)],
);

/** Paid-AI spend per person per UTC day, in micro-dollars (1 USD = 1,000,000). */
export const aiSpend = sqliteTable(
  "ai_spend",
  {
    userId: text("user_id").notNull(),
    day: text("day").notNull(),
    micros: integer("micros").notNull().default(0),
    calls: integer("calls").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] }), index("ai_spend_day_idx").on(t.day)],
);

/** Recent paid-AI calls, for the burst rule. Rows older than an hour are removed as people keep using the app. */
export const aiCallLog = sqliteTable(
  "ai_call_log",
  { userId: text("user_id").notNull(), at: integer("at").notNull() },
  (t) => [index("ai_call_log_user_at_idx").on(t.userId, t.at)],
);

/** Automatic 24 h / 72 h / 7 day pauses of the paid AI features. One row per person. */
export const aiLockouts = sqliteTable("ai_lockouts", {
  userId: text("user_id").primaryKey(),
  lockedUntil: integer("locked_until").notNull(),
  reason: text("reason").notNull(),
  strikes: integer("strikes").notNull().default(1),
  lastStrikeAt: integer("last_strike_at").notNull(),
  createdAt: integer("created_at").notNull(),
});
