/**
 * Convex export -> D1 SQL.
 *
 *   1. From the repo root:   npx convex export --path convex-export.zip
 *   2. From workers/api:     npx tsx scripts/migrate-convex-to-d1.ts --export ../../convex-export.zip --out migration
 *   3. Read migration/report.json (problems must be understood before importing).
 *   4. Rehearse locally:     npx wrangler d1 execute receipt-cycle-db --local  --file migration/import.sql
 *      Cutover (remote):     npx wrangler d1 execute receipt-cycle-db --remote --file migration/import.sql
 *   5. Compare:              npx wrangler d1 execute receipt-cycle-db --remote --file migration/verify.sql
 *      against report.json "written".
 *
 * The export contains password hashes: keep the zip and the generated files out of git and delete
 * them after the cutover. Re-running import.sql is safe (inserts are idempotent).
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { unzipSync } from "fflate";
import { type ConvexTables, transform } from "../src/migrate/transform";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function parseJsonl(text: string): any[] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

/** Convex exports one `<table>/documents.jsonl` per table, inside a zip or an unzipped folder. */
function readExport(path: string): ConvexTables {
  const tables: ConvexTables = {};
  const take = (file: string, text: string) => {
    const m = /(?:^|[\\/])([A-Za-z0-9_]+)[\\/]documents\.jsonl$/.exec(file);
    if (m && !m[1]!.startsWith("_")) tables[m[1]!] = parseJsonl(text);
  };
  if (statSync(path).isDirectory()) {
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else take(full, readFileSync(full, "utf8"));
      }
    };
    walk(path);
  } else {
    const files = unzipSync(new Uint8Array(readFileSync(path)));
    for (const [name, data] of Object.entries(files)) take(name, new TextDecoder().decode(data));
  }
  return tables;
}

const TABLES = [
  "user", "profile", "account", "user_preferences", "workspaces", "workspace_members", "workspace_invites",
  "accounts", "categories", "budgets", "transactions", "app_config", "admin_audit_logs", "whop_entitlements",
];

async function main() {
  const exportPath = arg("export");
  const outDir = arg("out") ?? "migration";
  if (!exportPath) {
    console.error("Usage: tsx scripts/migrate-convex-to-d1.ts --export <convex-export.zip|folder> [--out migration]");
    process.exit(1);
  }
  const tables = readExport(exportPath);
  if (Object.keys(tables).length === 0) throw new Error(`No table data found in ${exportPath}. Is it a Convex export?`);

  const { statements, report } = await transform(tables);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "import.sql"), `${statements.join("\n")}\n`);
  writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2));
  writeFileSync(
    join(outDir, "verify.sql"),
    // One statement per table: D1 caps the number of UNION ALL terms in a single query.
    `${TABLES.map((t) => `SELECT '${t}' AS table_name, count(*) AS rows FROM ${t};`).join("\n")}\n`,
  );

  console.log(`Read tables: ${Object.entries(report.source).map(([k, v]) => `${k}=${v}`).join(", ")}`);
  console.log(`Wrote ${statements.length} statements to ${join(outDir, "import.sql")}`);
  const p = report.problems;
  const problems = [
    ["users without an email (skipped)", p.usersWithoutEmail.length],
    ["duplicate emails (later one skipped)", p.duplicateEmails.length],
    ["transactions with no known owner (skipped)", p.transactionsWithoutKnownOwner.length],
    ["transactions whose account was not found", p.transactionsWithMissingAccount.length],
    ["workspace members with unknown user (skipped)", p.membersWithoutKnownUser.length],
    ["workspaces whose owner was not found", p.workspaceOwnersNotFound.length],
    ["shared accounts/categories/budgets with no user", Object.values(p.sharedRowsWithNoUsers).reduce((a, b) => a + b, 0)],
  ] as const;
  for (const [label, n] of problems) if (n > 0) console.warn(`  ! ${n} ${label}`);
  if (problems.every(([, n]) => n === 0)) console.log("No problems found.");
  console.log(`Details: ${join(outDir, "report.json")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
