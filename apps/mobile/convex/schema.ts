import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** Workspace key: "personal" | "business" | custom slug e.g. ws_xxx */
const workspaceKey = v.string();

export default defineSchema({
  /** Email/password auth (Convex-only; no Supabase) */
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.optional(v.string()),
    /** Google account subject (OpenID); set when user signs in with Google */
    googleSub: v.optional(v.string()),
    /** Whop account subject (OIDC) when user signs in with Whop */
    whopSub: v.optional(v.string()),
    /** Billing / tier (optional; legacy rows may omit) */
    plan: v.optional(v.string()),
    /** Pro / paid subscriber (Whop or admin); full access + CSV export */
    proSubscriptionActive: v.optional(v.boolean()),
    /** Start of 7-day Pro trial window (defaults to account creation if unset) */
    trialStartedAt: v.optional(v.number()),
    /** Transactions counted toward trial cap while not Pro (max 25); migrated from existing rows on bootstrap */
    trialLifetimeAdds: v.optional(v.number()),
    /** App role, e.g. user vs admin */
    role: v.optional(v.string()),
    /** Account state */
    status: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_google_sub", ["googleSub"])
    .index("by_whop_sub", ["whopSub"]),

  /** One-time password reset tokens (hashed lookup by raw token string) */
  passwordResetTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  transactions: defineTable({
    workspace: v.optional(workspaceKey),
    userId: v.optional(v.string()),
    amount: v.number(),
    type: v.string(),
    category: v.string(),
    merchant: v.optional(v.string()),
    date: v.string(),
    description: v.optional(v.string()),
    payment_method: v.optional(v.string()),
    /** When set, create/delete adjusts this account's balance */
    accountId: v.optional(v.id("accounts")),
    tags: v.optional(v.array(v.string())),
    is_recurring: v.optional(v.boolean()),
    receipt_url: v.optional(v.string()),
    receipt_data: v.optional(v.any()),
    entrySource: v.optional(v.union(v.literal("camera"), v.literal("upload"), v.literal("manual"))),
  })
    .index("by_date", ["date"])
    .index("by_user_workspace", ["userId", "workspace"]),

  accounts: defineTable({
    workspace: workspaceKey,
    name: v.string(),
    balance: v.number(),
    iconKey: v.optional(v.string()),
  }).index("by_workspace", ["workspace"]),

  categories: defineTable({
    workspace: workspaceKey,
    name: v.string(),
    kind: v.union(v.literal("expense"), v.literal("income")),
    color: v.string(),
  }).index("by_workspace", ["workspace"]),

  budgets: defineTable({
    workspace: workspaceKey,
    category: v.string(),
    month: v.string(),
    limitAmount: v.number(),
  }).index("by_workspace_month", ["workspace", "month"]),

  /** User-created workspaces (team) */
  workspaces: defineTable({
    name: v.string(),
    slug: v.string(),
    kind: v.union(v.literal("team")),
    ownerUserId: v.optional(v.string()),
  })
    .index("by_owner", ["ownerUserId"])
    .index("by_slug", ["slug"]),

  workspaceInvites: defineTable({
    workspaceKey: workspaceKey,
    email: v.string(),
    token: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted")),
    invitedBy: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_token", ["token"]),

  /** Users with access to a workspace (owner on create, member via invite). */
  workspaceMembers: defineTable({
    workspaceKey: workspaceKey,
    userId: v.string(),
    role: v.union(v.literal("owner"), v.literal("member")),
  })
    .index("by_workspace", ["workspaceKey"])
    .index("by_user", ["userId"])
    .index("by_user_workspace", ["userId", "workspaceKey"]),

  /** Per-user UI preferences (synced across devices when signed in) */
  userPreferences: defineTable({
    userId: v.string(),
    currency: v.string(),
    dateFormat: v.union(v.literal("iso"), v.literal("us"), v.literal("eu")),
    merchants: v.array(v.string()),
    locations: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        address: v.string(),
      }),
    ),
    reimbursements: v.optional(v.boolean()),
    txnNumber: v.optional(v.boolean()),
    scanPayment: v.optional(v.boolean()),
    requirePay: v.optional(v.boolean()),
    requireNotes: v.optional(v.boolean()),
    /** ISO-style code for Whisper, or "auto" — synced web + mobile */
    voiceInputLanguage: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  /** Global runtime controls for web + mobile */
  appConfig: defineTable({
    key: v.string(),
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
    updatedAt: v.optional(v.number()),
    updatedBy: v.optional(v.string()),
  }).index("by_key", ["key"]),

  adminAuditLogs: defineTable({
    action: v.string(),
    actor: v.string(),
    details: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),

  /** Latest known Whop entitlement snapshot (allows granting access when user account appears later). */
  whopEntitlements: defineTable({
    whopUserId: v.optional(v.string()),
    email: v.optional(v.string()),
    membershipId: v.optional(v.string()),
    /** free | pro_monthly | pro_yearly | cancelling */
    subscriptionStatus: v.string(),
    proActive: v.boolean(),
    /** Optional metadata from payments / events */
    paymentStatus: v.optional(v.string()),
    source: v.optional(v.string()),
    lastEventType: v.string(),
    lastEventAt: v.number(),
  })
    .index("by_whop_user", ["whopUserId"])
    .index("by_email", ["email"]),
});
