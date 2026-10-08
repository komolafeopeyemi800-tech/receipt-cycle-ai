#!/usr/bin/env node
/**
 * One-time Polar setup: creates the "Receipt Cycle Pro" benefit (what a paying customer is entitled to) and attaches it to
 * the monthly and yearly products you created by hand in the Polar dashboard. Safe to run again: it reuses the benefit and
 * keeps any benefits already attached.
 *
 *   POLAR_ACCESS_TOKEN=polar_oat_... \
 *   POLAR_MONTHLY_PRODUCT_ID=... POLAR_YEARLY_PRODUCT_ID=... \
 *   node scripts/polar-setup.mjs [--sandbox] [--dry-run]
 *
 * The token needs the scopes: benefits:read, benefits:write, products:read, products:write.
 * It is only read from the environment and never written anywhere.
 */
const args = new Set(process.argv.slice(2));
const sandbox = args.has("--sandbox") || process.env.POLAR_SERVER === "sandbox";
const dryRun = args.has("--dry-run");
const base = sandbox ? "https://sandbox-api.polar.sh" : "https://api.polar.sh";
const token = process.env.POLAR_ACCESS_TOKEN;
const products = [process.env.POLAR_MONTHLY_PRODUCT_ID, process.env.POLAR_YEARLY_PRODUCT_ID].filter(Boolean);

if (!token || products.length === 0) {
  console.error("Set POLAR_ACCESS_TOKEN and POLAR_MONTHLY_PRODUCT_ID / POLAR_YEARLY_PRODUCT_ID first.");
  process.exit(1);
}

const BENEFIT_NAME = "Receipt Cycle Pro";
const BENEFIT_NOTE = [
  "Unlimited transactions",
  "Receipt scan, upload and manual entry",
  "Voice capture, AI coach and money-leak insights",
  "Budgets and full edit access",
  "CSV export",
  "One subscription for web and mobile",
].join(" · ");

async function polar(method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${path} failed (${res.status}): ${text.slice(0, 300)}`);
  return json;
}

console.log(`Polar ${sandbox ? "sandbox" : "production"}${dryRun ? " (dry run)" : ""}`);

const existing = await polar("GET", "/v1/benefits/?type=custom&limit=100");
let benefit = (existing.items ?? []).find((b) => b.description === BENEFIT_NAME);
if (benefit) {
  console.log(`Benefit already exists: ${benefit.id}`);
} else if (dryRun) {
  console.log(`Would create the benefit "${BENEFIT_NAME}"`);
} else {
  benefit = await polar("POST", "/v1/benefits/", { type: "custom", description: BENEFIT_NAME, properties: { note: BENEFIT_NOTE } });
  console.log(`Created benefit: ${benefit.id}`);
}

for (const productId of products) {
  const product = await polar("GET", `/v1/products/${productId}`);
  const have = (product.benefits ?? []).map((b) => b.id);
  console.log(`\n${product.name} (${productId}): ${product.is_recurring ? `recurring ${product.recurring_interval}` : "one-time"}, trial ${product.trial_interval ? `${product.trial_interval_count} ${product.trial_interval}(s)` : "none"}`);
  if (!benefit) continue;
  if (have.includes(benefit.id)) {
    console.log("  already has the Pro benefit");
    continue;
  }
  if (dryRun) {
    console.log("  would attach the Pro benefit");
    continue;
  }
  await polar("POST", `/v1/products/${productId}/benefits`, { benefits: [...have, benefit.id] });
  console.log("  attached the Pro benefit");
}
console.log("\nDone.");
