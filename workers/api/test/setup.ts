import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach } from "vitest";

const TABLES = [
  "rate_limits",
  "upload_parses",
  "admin_audit_logs",
  "billing_entitlements",
  "app_config",
  "user_preferences",
  "workspace_members",
  "workspace_invites",
  "workspaces",
  "budgets",
  "categories",
  "accounts",
  "transactions",
  "profile",
  "verification",
  "account",
  "session",
  "user",
];

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  for (const t of TABLES) await env.DB.prepare(`DELETE FROM ${t}`).run();
});
