/**
 * One-click Polar setup for the admin dashboard. It runs on the Worker with the Worker's own Polar token, so the token is never
 * shown or copied anywhere. It can only do three things, and only when `apply` is true:
 *  1. add the events the app needs (including order.paid and order.refunded, used by Pro Lifetime) to our webhook endpoint,
 *  2. create the "Receipt Cycle Pro" benefit if it does not exist,
 *  3. attach that benefit to the monthly, yearly and lifetime products.
 * With `apply` false it only reads and reports. Nothing is deleted. Webhook secrets are never read or changed.
 */
import type { Env } from "../types";

/** Events our webhook handler acts on (see lib/polar.ts). Other events are accepted and ignored. */
export const REQUIRED_WEBHOOK_EVENTS = [
  "subscription.created",
  "subscription.updated",
  "subscription.active",
  "subscription.canceled",
  "subscription.uncanceled",
  "subscription.revoked",
  "subscription.past_due",
  "order.paid",
  "order.refunded",
] as const;

export const BENEFIT_NAME = "Receipt Cycle Pro";
const BENEFIT_NOTE = [
  "Unlimited transactions",
  "Receipt scan, upload and manual entry",
  "Voice capture and AI help",
  "Budgets and full edit access",
  "Excel and CSV export",
  "One plan for web and mobile",
].join(" · ");

export type SetupStep = { name: string; ok: boolean; changed: boolean; detail: string };
type Fetch = (url: string, init?: RequestInit) => Promise<Response>;
type Rec = Record<string, unknown>;

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);

function apiBase(env: Env) {
  return env.POLAR_SERVER === "sandbox" ? "https://sandbox-api.polar.sh" : "https://api.polar.sh";
}

async function call(env: Env, doFetch: Fetch, method: string, path: string, body?: unknown) {
  const res = await doFetch(`${apiBase(env)}${path}`, {
    method,
    headers: { Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`, "Content-Type": "application/json", Accept: "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: Rec | null = null;
  try {
    json = text ? (JSON.parse(text) as Rec) : null;
  } catch {
    json = null;
  }
  return { status: res.status, ok: res.ok, json, text };
}

/** A short, safe message for a failed Polar call. */
function why(status: number, text: string, needs?: string) {
  if (status === 401) return "Polar rejected the access token (401). Create a new organization access token and update the POLAR_ACCESS_TOKEN secret.";
  if (status === 403) return `Polar says this token is not allowed to do that (403)${needs ? `. It needs the ${needs} permission` : ""}.`;
  return `Polar answered ${status}: ${text.replace(/\s+/g, " ").slice(0, 140)}`;
}

export async function runPolarSetup(env: Env, opts: { apply: boolean }, doFetch: Fetch = fetch): Promise<SetupStep[]> {
  const steps: SetupStep[] = [];
  const token = str(env.POLAR_ACCESS_TOKEN);
  const org = str(env.POLAR_ORGANIZATION_ID);
  const products = [
    ["monthly", str(env.POLAR_MONTHLY_PRODUCT_ID)],
    ["yearly", str(env.POLAR_YEARLY_PRODUCT_ID)],
    ["lifetime", str(env.POLAR_LIFETIME_PRODUCT_ID)],
  ] as const;

  const missing = [!token && "POLAR_ACCESS_TOKEN", !org && "POLAR_ORGANIZATION_ID", ...products.filter(([, id]) => !id).map(([n]) => `the ${n} product id`)].filter(Boolean);
  if (missing.length) {
    steps.push({ name: "Settings on the API", ok: false, changed: false, detail: `Missing: ${missing.join(", ")}.` });
    return steps;
  }
  steps.push({ name: "Settings on the API", ok: true, changed: false, detail: `Token, organization and the monthly, yearly and lifetime products are set (${env.POLAR_SERVER === "sandbox" ? "sandbox" : "production"}).` });

  // 1. webhook endpoint and its events
  try {
    const list = await call(env, doFetch, "GET", `/v1/webhooks/endpoints?organization_id=${org}&limit=100`);
    if (!list.ok) {
      steps.push({ name: "Webhook events", ok: false, changed: false, detail: why(list.status, list.text, "webhooks:read") });
    } else {
      const items = (Array.isArray(list.json?.items) ? list.json!.items : []) as Rec[];
      const endpoint = items.find((e) => str(e.url)?.endsWith("/api/webhooks/polar"));
      if (!endpoint) {
        steps.push({
          name: "Webhook events",
          ok: false,
          changed: false,
          detail: "No webhook endpoint that points to /api/webhooks/polar was found. In Polar, add one for https://api.receiptcycle.com/api/webhooks/polar with the Raw format and your webhook secret.",
        });
      } else {
        const have = ((Array.isArray(endpoint.events) ? endpoint.events : []) as unknown[]).filter((x): x is string => typeof x === "string");
        const lacking = REQUIRED_WEBHOOK_EVENTS.filter((e) => !have.includes(e));
        const notes: string[] = [];
        if (endpoint.enabled === false) notes.push("The endpoint is switched off in Polar, so no events are sent. Turn it on.");
        if (str(endpoint.format) && endpoint.format !== "raw") notes.push(`The format is "${String(endpoint.format)}" but the app expects Raw.`);
        if (!lacking.length) {
          steps.push({ name: "Webhook events", ok: notes.length === 0, changed: false, detail: ["All needed events (including order.paid and order.refunded) are enabled.", ...notes].join(" ") });
        } else if (!opts.apply) {
          steps.push({ name: "Webhook events", ok: false, changed: false, detail: [`Missing events: ${lacking.join(", ")}.`, ...notes].join(" ") });
        } else {
          const merged = Array.from(new Set([...have, ...REQUIRED_WEBHOOK_EVENTS]));
          const patch = await call(env, doFetch, "PATCH", `/v1/webhooks/endpoints/${String(endpoint.id)}`, { events: merged });
          steps.push(
            patch.ok
              ? { name: "Webhook events", ok: notes.length === 0, changed: true, detail: [`Added: ${lacking.join(", ")}.`, ...notes].join(" ") }
              : { name: "Webhook events", ok: false, changed: false, detail: why(patch.status, patch.text, "webhooks:write") },
          );
        }
      }
    }
  } catch (e) {
    steps.push({ name: "Webhook events", ok: false, changed: false, detail: `Could not reach Polar: ${e instanceof Error ? e.message : "unknown error"}.` });
  }

  // 2. the benefit
  let benefitId: string | undefined;
  try {
    const list = await call(env, doFetch, "GET", `/v1/benefits/?organization_id=${org}&type=custom&limit=100`);
    if (!list.ok) {
      steps.push({ name: `Benefit "${BENEFIT_NAME}"`, ok: false, changed: false, detail: why(list.status, list.text, "benefits:read") });
    } else {
      const items = (Array.isArray(list.json?.items) ? list.json!.items : []) as Rec[];
      const found = items.find((b) => str(b.description) === BENEFIT_NAME);
      if (found) {
        benefitId = str(found.id);
        steps.push({ name: `Benefit "${BENEFIT_NAME}"`, ok: true, changed: false, detail: "It already exists." });
      } else if (!opts.apply) {
        steps.push({ name: `Benefit "${BENEFIT_NAME}"`, ok: false, changed: false, detail: "It does not exist yet." });
      } else {
        const made = await call(env, doFetch, "POST", "/v1/benefits/", { type: "custom", description: BENEFIT_NAME, organization_id: org, properties: { note: BENEFIT_NOTE } });
        if (made.ok) {
          benefitId = str(made.json?.id);
          steps.push({ name: `Benefit "${BENEFIT_NAME}"`, ok: true, changed: true, detail: "Created." });
        } else {
          steps.push({ name: `Benefit "${BENEFIT_NAME}"`, ok: false, changed: false, detail: why(made.status, made.text, "benefits:write") });
        }
      }
    }
  } catch (e) {
    steps.push({ name: `Benefit "${BENEFIT_NAME}"`, ok: false, changed: false, detail: `Could not reach Polar: ${e instanceof Error ? e.message : "unknown error"}.` });
  }

  // 3. the benefit on each paid product
  for (const [plan, id] of products) {
    const name = `Product: ${plan}`;
    try {
      const prod = await call(env, doFetch, "GET", `/v1/products/${id}`);
      if (!prod.ok) {
        steps.push({ name, ok: false, changed: false, detail: why(prod.status, prod.text, "products:read") });
        continue;
      }
      const have = ((Array.isArray(prod.json?.benefits) ? prod.json!.benefits : []) as Rec[]).map((b) => str(b.id)).filter((x): x is string => !!x);
      const title = str(prod.json?.name) ?? plan;
      const kind = prod.json?.is_recurring ? `recurring ${str(prod.json?.recurring_interval) ?? ""}`.trim() : "one-time";
      if (!benefitId) {
        steps.push({ name, ok: false, changed: false, detail: `${title} (${kind}): the benefit is not available yet, so it cannot be attached.` });
      } else if (have.includes(benefitId)) {
        steps.push({ name, ok: true, changed: false, detail: `${title} (${kind}) already has the Pro benefit.` });
      } else if (!opts.apply) {
        steps.push({ name, ok: false, changed: false, detail: `${title} (${kind}) does not have the Pro benefit yet.` });
      } else {
        const attach = await call(env, doFetch, "POST", `/v1/products/${id}/benefits`, { benefits: [...have, benefitId] });
        steps.push(
          attach.ok
            ? { name, ok: true, changed: true, detail: `${title} (${kind}): Pro benefit attached.` }
            : { name, ok: false, changed: false, detail: why(attach.status, attach.text, "products:write") },
        );
      }
    } catch (e) {
      steps.push({ name, ok: false, changed: false, detail: `Could not reach Polar: ${e instanceof Error ? e.message : "unknown error"}.` });
    }
  }
  return steps;
}
