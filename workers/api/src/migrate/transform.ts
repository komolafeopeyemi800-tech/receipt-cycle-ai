/**
 * Convex export to D1 SQL. Pure: takes parsed Convex tables, returns SQL statements and a report.
 *
 * Rules worth knowing (each is also covered by test/migrate.test.ts):
 *  - Ids are deterministic (hash of the Convex id), so re-running yields the same rows.
 *  - Sessions and password-reset tokens are NOT migrated: everyone signs in once more.
 *  - Convex shared one set of accounts/categories/budgets per workspace key across ALL users.
 *    Each user now gets a private copy for the workspace keys they have transactions in. When more
 *    than one user shared a key, account balances are recomputed from that user's own transactions
 *    (the shared balance mixed everyone together).
 *  - Transactions whose owner cannot be found (including demo rows with no owner) are skipped and
 *    listed in the report instead of being guessed.
 */
import { insert } from "./sql";

type Doc = Record<string, any> & { _id: string; _creationTime: number };
export type ConvexTables = Record<string, Doc[]>;

export type MigrationReport = {
  source: Record<string, number>;
  written: Record<string, number>;
  skippedByDesign: { sessions: number; passwordResetTokens: number };
  problems: {
    duplicateEmails: string[];
    usersWithoutEmail: string[];
    transactionsWithoutKnownOwner: string[];
    transactionsWithMissingAccount: string[];
    membersWithoutKnownUser: string[];
    workspaceOwnersNotFound: string[];
    sharedRowsWithNoUsers: { accounts: number; categories: number; budgets: number };
  };
  sharedWorkspaces: { workspace: string; users: number; balances: "kept" | "recomputed" }[];
};

const isTeamKey = (k: string) => k.startsWith("ws_");
const ms = (n: unknown) => Math.floor(typeof n === "number" && Number.isFinite(n) ? n : Date.now());

/** Deterministic UUID-shaped id from a seed (SHA-256, first 16 bytes). */
export async function stableId(seed: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed)));
  const b = digest.slice(0, 16);
  b[6] = (b[6]! & 0x0f) | 0x50;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const balanceDelta = (type: string, amount: number) =>
  amount > 0 ? (type === "expense" ? -amount : type === "income" ? amount : 0) : 0;
const round2 = (n: number) => Math.round(n * 100) / 100;

export async function transform(input: ConvexTables): Promise<{ statements: string[]; report: MigrationReport }> {
  const t = (name: string) => input[name] ?? [];
  const out: string[] = [];
  const written: Record<string, number> = {};
  const seen = new Set<string>();
  const add = (table: string, row: Record<string, unknown>) => {
    // Shared team rows are produced once per member; keep exactly one so counts match the database.
    const key = `${table}:${String(row.id ?? row.user_id ?? row.key)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(insert(table, row));
    written[table] = (written[table] ?? 0) + 1;
  };
  const report: MigrationReport = {
    source: Object.fromEntries(Object.entries(input).map(([k, v]) => [k, v.length])),
    written,
    skippedByDesign: { sessions: t("sessions").length, passwordResetTokens: t("passwordResetTokens").length },
    problems: {
      duplicateEmails: [],
      usersWithoutEmail: [],
      transactionsWithoutKnownOwner: [],
      transactionsWithMissingAccount: [],
      membersWithoutKnownUser: [],
      workspaceOwnersNotFound: [],
      sharedRowsWithNoUsers: { accounts: 0, categories: 0, budgets: 0 },
    },
    sharedWorkspaces: [],
  };

  // ---- users -------------------------------------------------------------
  const userIdByConvexId = new Map<string, string>();
  const userIdByEmail = new Map<string, string>();
  const emailByUserId = new Map<string, string>();
  for (const u of t("users")) {
    const email = String(u.email ?? "").trim().toLowerCase();
    if (!email) {
      report.problems.usersWithoutEmail.push(u._id);
      continue;
    }
    if (userIdByEmail.has(email)) {
      report.problems.duplicateEmails.push(email);
      continue;
    }
    const id = await stableId(`user:${u._id}`);
    userIdByConvexId.set(u._id, id);
    userIdByEmail.set(email, id);
    emailByUserId.set(id, email);
    const created = ms(u._creationTime);
    add("user", {
      id,
      name: String(u.name ?? "").trim(),
      email,
      email_verified: Boolean(u.googleSub || u.whopSub),
      image: null,
      created_at: created,
      updated_at: created,
    });
    add("profile", {
      user_id: id,
      plan: u.plan ?? null,
      pro_subscription_active: u.proSubscriptionActive === true,
      trial_started_at: u.trialStartedAt ?? null,
      trial_lifetime_adds: u.trialLifetimeAdds ?? null,
      role: u.role ?? null,
      status: u.status ?? null,
      google_sub: u.googleSub ?? null,
      whop_sub: u.whopSub ?? null,
      legacy_password_hash: null,
      legacy_convex_id: u._id,
    });
    if (u.passwordHash) {
      // Better Auth's "credential" account; the bcrypt hash is verified once then rehashed at login.
      add("account", {
        id: await stableId(`credential:${u._id}`),
        user_id: id,
        account_id: id,
        provider_id: "credential",
        password: u.passwordHash,
        created_at: created,
        updated_at: created,
      });
    }
  }

  /** Convex stored the owner as an id, or (legacy) as an email in any casing. */
  const resolveUser = (ref: unknown): string | undefined => {
    const key = String(ref ?? "").trim();
    if (!key) return undefined;
    return userIdByConvexId.get(key) ?? userIdByEmail.get(key.toLowerCase());
  };

  // ---- preferences, workspaces, members, invites -------------------------
  for (const p of t("userPreferences")) {
    const userId = resolveUser(p.userId);
    if (!userId) continue;
    add("user_preferences", {
      user_id: userId,
      currency: p.currency,
      date_format: p.dateFormat,
      merchants: JSON.stringify(p.merchants ?? []),
      locations: JSON.stringify(p.locations ?? []),
      reimbursements: p.reimbursements ?? null,
      txn_number: p.txnNumber ?? null,
      scan_payment: p.scanPayment ?? null,
      require_pay: p.requirePay ?? null,
      require_notes: p.requireNotes ?? null,
      voice_input_language: p.voiceInputLanguage ?? null,
    });
  }

  const teamSlugs = new Set<string>();
  for (const w of t("workspaces")) {
    teamSlugs.add(w.slug);
    const owner = w.ownerUserId ? resolveUser(w.ownerUserId) : undefined;
    if (w.ownerUserId && !owner) report.problems.workspaceOwnersNotFound.push(w.slug);
    add("workspaces", {
      id: await stableId(`workspace:${w._id}`),
      name: w.name,
      slug: w.slug,
      kind: "team",
      owner_user_id: owner ?? null,
      created_at: ms(w._creationTime),
    });
  }
  const membersByTeam = new Map<string, Set<string>>();
  for (const m of t("workspaceMembers")) {
    const userId = resolveUser(m.userId);
    if (!userId) {
      report.problems.membersWithoutKnownUser.push(`${m.workspaceKey}:${m.userId}`);
      continue;
    }
    add("workspace_members", {
      id: await stableId(`member:${m._id}`),
      workspace_key: m.workspaceKey,
      user_id: userId,
      role: m.role,
    });
    if (!membersByTeam.has(m.workspaceKey)) membersByTeam.set(m.workspaceKey, new Set());
    membersByTeam.get(m.workspaceKey)!.add(userId);
  }
  for (const inv of t("workspaceInvites")) {
    add("workspace_invites", {
      id: await stableId(`invite:${inv._id}`),
      workspace_key: inv.workspaceKey,
      email: String(inv.email ?? "").toLowerCase(),
      token: inv.token,
      status: inv.status,
      invited_by: inv.invitedBy ? (resolveUser(inv.invitedBy) ?? null) : null,
      created_at: ms(inv.createdAt ?? inv._creationTime),
    });
  }

  // ---- who uses which workspace key --------------------------------------
  const txns = t("transactions");
  const usersByWorkspace = new Map<string, Set<string>>();
  const ownerOfTxn = new Map<string, string>();
  for (const tx of txns) {
    const userId = resolveUser(tx.userId);
    if (!userId) {
      report.problems.transactionsWithoutKnownOwner.push(tx._id);
      continue;
    }
    ownerOfTxn.set(tx._id, userId);
    const ws = tx.workspace ?? "personal";
    if (!usersByWorkspace.has(ws)) usersByWorkspace.set(ws, new Set());
    usersByWorkspace.get(ws)!.add(userId);
  }
  // Team workspaces are shared by their members; everything else is private per user.
  const usersOf = (ws: string): string[] =>
    isTeamKey(ws) ? [...(membersByTeam.get(ws) ?? [])] : [...(usersByWorkspace.get(ws) ?? [])];
  const scopeOf = (ws: string, userId: string) => (isTeamKey(ws) ? `ws:${ws}` : `u:${userId}:${ws}`);
  /** Id of the copy of a shared Convex row for a given user (one shared copy for team workspaces). */
  const copyId = (kind: string, convexId: string, ws: string, userId: string) =>
    stableId(isTeamKey(ws) ? `${kind}:${convexId}` : `${kind}:${convexId}:${userId}`);

  // ---- accounts / categories / budgets -----------------------------------
  const accountsDoc = new Map(t("accounts").map((a) => [a._id, a]));
  const deltaByUserAccount = new Map<string, number>(); // `${userId}|${convexAccountId}`
  for (const tx of txns) {
    const userId = ownerOfTxn.get(tx._id);
    if (!userId || !tx.accountId) continue;
    // Convex only adjusted an account when it belonged to the transaction's own workspace.
    if (accountsDoc.get(tx.accountId)?.workspace !== (tx.workspace ?? "personal")) continue;
    const key = `${userId}|${tx.accountId}`;
    deltaByUserAccount.set(key, (deltaByUserAccount.get(key) ?? 0) + balanceDelta(tx.type, tx.amount));
  }

  const workspaceKeys = new Set<string>([
    ...t("accounts").map((a) => a.workspace),
    ...t("categories").map((c) => c.workspace),
    ...t("budgets").map((b) => b.workspace),
  ]);
  for (const ws of workspaceKeys) {
    const users = usersOf(ws);
    const sharedBy = isTeamKey(ws) ? 1 : users.length;
    report.sharedWorkspaces.push({ workspace: ws, users: users.length, balances: sharedBy > 1 ? "recomputed" : "kept" });
  }

  for (const a of t("accounts")) {
    const users = usersOf(a.workspace);
    if (users.length === 0) report.problems.sharedRowsWithNoUsers.accounts++;
    for (const userId of users) {
      const recompute = !isTeamKey(a.workspace) && users.length > 1;
      add("accounts", {
        id: await copyId("account", a._id, a.workspace, userId),
        scope: scopeOf(a.workspace, userId),
        name: a.name,
        balance: recompute ? round2(deltaByUserAccount.get(`${userId}|${a._id}`) ?? 0) : a.balance,
        icon_key: a.iconKey ?? null,
        created_at: ms(a._creationTime),
      });
    }
  }
  for (const c of t("categories")) {
    const users = usersOf(c.workspace);
    if (users.length === 0) report.problems.sharedRowsWithNoUsers.categories++;
    for (const userId of users) {
      add("categories", {
        id: await copyId("category", c._id, c.workspace, userId),
        scope: scopeOf(c.workspace, userId),
        name: c.name,
        kind: c.kind,
        color: c.color,
        created_at: ms(c._creationTime),
      });
    }
  }
  for (const b of t("budgets")) {
    const users = usersOf(b.workspace);
    if (users.length === 0) report.problems.sharedRowsWithNoUsers.budgets++;
    for (const userId of users) {
      add("budgets", {
        id: await copyId("budget", b._id, b.workspace, userId),
        scope: scopeOf(b.workspace, userId),
        category: b.category,
        month: b.month,
        limit_amount: b.limitAmount,
        created_at: ms(b._creationTime),
      });
    }
  }

  // ---- transactions ------------------------------------------------------
  for (const tx of txns) {
    const userId = ownerOfTxn.get(tx._id);
    if (!userId) continue;
    const ws = tx.workspace ?? "personal";
    let accountId: string | null = null;
    if (tx.accountId) {
      const acc = accountsDoc.get(tx.accountId);
      if (acc && acc.workspace === ws) accountId = await copyId("account", acc._id, ws, userId);
      else report.problems.transactionsWithMissingAccount.push(tx._id);
    }
    const created = ms(tx._creationTime);
    add("transactions", {
      id: await stableId(`transaction:${tx._id}`),
      user_id: userId,
      workspace: ws,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      merchant: tx.merchant ?? null,
      date: tx.date,
      description: tx.description ?? null,
      payment_method: tx.payment_method ?? null,
      account_id: accountId,
      tags: tx.tags ? JSON.stringify(tx.tags) : null,
      is_recurring: tx.is_recurring ?? null,
      receipt_url: tx.receipt_url ?? null,
      receipt_data: tx.receipt_data === undefined || tx.receipt_data === null ? null : JSON.stringify(tx.receipt_data),
      entry_source: tx.entrySource ?? null,
      created_at: created,
      updated_at: created,
    });
  }

  // ---- config, audit log, entitlements -----------------------------------
  for (const c of t("appConfig")) {
    add("app_config", {
      key: c.key,
      maintenance_mode: c.maintenanceMode ?? null,
      scanner_enabled: c.scannerEnabled ?? null,
      upload_enabled: c.uploadEnabled ?? null,
      manual_add_enabled: c.manualAddEnabled ?? null,
      export_enabled: c.exportEnabled ?? null,
      web_dashboard_enabled: c.webDashboardEnabled ?? null,
      web_transactions_enabled: c.webTransactionsEnabled ?? null,
      web_upload_enabled: c.webUploadEnabled ?? null,
      web_settings_enabled: c.webSettingsEnabled ?? null,
      mobile_scan_page_enabled: c.mobileScanPageEnabled ?? null,
      mobile_upload_page_enabled: c.mobileUploadPageEnabled ?? null,
      mobile_add_page_enabled: c.mobileAddPageEnabled ?? null,
      admin_managed_preferences: c.adminManagedPreferences ?? null,
      pref_reimbursements: c.prefReimbursements ?? null,
      pref_txn_number: c.prefTxnNumber ?? null,
      pref_scan_payment: c.prefScanPayment ?? null,
      pref_require_pay: c.prefRequirePay ?? null,
      pref_require_notes: c.prefRequireNotes ?? null,
      free_camera_limit: c.freeCameraLimit ?? null,
      free_upload_limit: c.freeUploadLimit ?? null,
      free_manual_limit: c.freeManualLimit ?? null,
      updated_at: c.updatedAt ?? null,
      updated_by: c.updatedBy ?? null,
    });
  }
  for (const l of t("adminAuditLogs")) {
    add("admin_audit_logs", {
      id: await stableId(`audit:${l._id}`),
      action: l.action,
      actor: l.actor,
      details: l.details ?? null,
      created_at: ms(l.createdAt ?? l._creationTime),
    });
  }
  for (const e of t("whopEntitlements")) {
    add("whop_entitlements", {
      id: await stableId(`entitlement:${e._id}`),
      whop_user_id: e.whopUserId ?? null,
      email: e.email ? String(e.email).toLowerCase() : null,
      membership_id: e.membershipId ?? null,
      subscription_status: e.subscriptionStatus,
      pro_active: e.proActive === true,
      payment_status: e.paymentStatus ?? null,
      source: e.source ?? null,
      last_event_type: e.lastEventType,
      last_event_at: ms(e.lastEventAt),
    });
  }

  return { statements: out, report };
}
