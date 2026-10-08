import { drizzle } from "drizzle-orm/d1";
import { getAuth } from "./auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import * as schema from "./db/schema";
import { ApiError } from "./lib/errors";
import { enforce } from "./lib/rateLimit";
import { adminRoutes, configRoutes } from "./routes/admin";
import { aiRoutes, contactRoutes } from "./routes/ai";
import { preferenceRoutes, subscriptionRoutes } from "./routes/account";
import { accountRoutes, budgetRoutes, categoryRoutes } from "./routes/money";
import { transactionRoutes } from "./routes/transactions";
import { webhookRoutes } from "./routes/webhooks";
import { meRoutes, socialRoutes } from "./routes/session";
import { billingRoutes } from "./routes/billing";
import { salesRoutes } from "./routes/sales";
import { receiptRoutes } from "./routes/receipts";
import { uploadRoutes } from "./routes/uploads";
import { workspaceRoutes } from "./routes/workspaces";
import type { AppEnv } from "./types";

export const app = new Hono<AppEnv>();

app.use("/api/*", cors({ origin: (origin) => origin ?? "*", allowHeaders: ["authorization", "content-type", "x-admin-secret"], credentials: true, exposeHeaders: ["set-auth-token"], maxAge: 86400 }));

app.use("*", async (c, next) => {
  c.set("db", drizzle(c.env.DB, { schema }));
  await next();
});

app.get("/api/health", (c) => c.json({ ok: true, time: Date.now() }));

const HOUR = 60 * 60 * 1000;
const clientIp = (c: { req: { header: (n: string) => string | undefined } }) => c.req.header("cf-connecting-ip") ?? "unknown";

// Password endpoints exist but are off unless PASSWORD_AUTH_ENABLED=true (see types.ts for why).
const PASSWORD_PATHS = ["sign-up/email", "sign-in/email", "request-password-reset", "reset-password", "change-password"];
for (const p of PASSWORD_PATHS) {
  app.use(`/api/auth/${p}`, async (c, next) => {
    if (c.env.PASSWORD_AUTH_ENABLED !== "true") {
      throw new ApiError(403, "Password sign-in is turned off. Continue with Google or get an emailed sign-in code.");
    }
    await next();
  });
}

// Emailed codes: only sign-in codes, and capped so nobody can use us to spam an inbox or guess codes.
app.use("/api/auth/email-otp/send-verification-otp", async (c, next) => {
  const body = (await c.req.raw.clone().json().catch(() => ({}))) as { email?: unknown; type?: unknown };
  if (body.type !== "sign-in") throw new ApiError(400, "Only sign-in codes can be requested here.");
  const email = String(body.email ?? "").trim().toLowerCase();
  const db = c.get("db");
  await enforce(db, `otp-send:email:${email}`, 5, HOUR, "Too many codes were requested for this email.");
  await enforce(db, `otp-send:ip:${clientIp(c)}`, 20, HOUR, "Too many codes were requested from this network.");
  await next();
});
app.use("/api/auth/sign-in/email-otp", async (c, next) => {
  const body = (await c.req.raw.clone().json().catch(() => ({}))) as { email?: unknown };
  const db = c.get("db");
  await enforce(db, `otp-verify:ip:${clientIp(c)}`, 30, 10 * 60 * 1000, "Too many attempts.");
  await enforce(db, `otp-verify:email:${String(body.email ?? "").trim().toLowerCase()}`, 10, 10 * 60 * 1000, "Too many attempts for this email.");
  await next();
});

// Better Auth: /api/auth/sign-up/email, /sign-in/email, /sign-out, /change-password, /request-password-reset, /reset-password, ...
app.on(["GET", "POST"], "/api/auth/*", (c) => getAuth(c.env, c.get("db")).handler(c.req.raw));
app.route("/api/social", socialRoutes);
app.route("/api/me", meRoutes);
app.route("/api/config", configRoutes);
app.route("/api/webhooks", webhookRoutes);
app.route("/api/transactions", transactionRoutes);
app.route("/api/accounts", accountRoutes);
app.route("/api/categories", categoryRoutes);
app.route("/api/budgets", budgetRoutes);
app.route("/api/workspaces", workspaceRoutes);
app.route("/api/preferences", preferenceRoutes);
app.route("/api/subscription", subscriptionRoutes);
app.route("/api/sales", salesRoutes);
/** Which billing settings are present (yes/no only, never the values). Lets setup be checked without exposing secrets. */
app.get("/api/billing/status", (c) => {
  const has = (v: string | undefined) => Boolean(v?.trim());
  const e = c.env;
  const checks = {
    POLAR_ACCESS_TOKEN: has(e.POLAR_ACCESS_TOKEN),
    POLAR_WEBHOOK_SECRET: has(e.POLAR_WEBHOOK_SECRET),
    POLAR_ORGANIZATION_ID: has(e.POLAR_ORGANIZATION_ID),
    POLAR_ORG_SLUG: has(e.POLAR_ORG_SLUG),
    POLAR_MONTHLY_PRODUCT_ID: has(e.POLAR_MONTHLY_PRODUCT_ID),
    POLAR_YEARLY_PRODUCT_ID: has(e.POLAR_YEARLY_PRODUCT_ID),
    POLAR_FREE_PRODUCT_ID: has(e.POLAR_FREE_PRODUCT_ID),
  };
  const required = ["POLAR_ACCESS_TOKEN", "POLAR_WEBHOOK_SECRET", "POLAR_MONTHLY_PRODUCT_ID", "POLAR_YEARLY_PRODUCT_ID"] as const;
  return c.json({ server: e.POLAR_SERVER === "sandbox" ? "sandbox" : "production", ready: required.every((k) => checks[k]), present: checks });
});
app.route("/api/billing", billingRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/ai", aiRoutes);
app.route("/api/contact", contactRoutes);
app.route("/api/uploads", uploadRoutes);
app.route("/api/receipts", receiptRoutes);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  if (err instanceof ApiError) return c.json({ error: err.message }, err.status);
  console.error("Unhandled error", err);
  return c.json({ error: "Something went wrong. Please try again." }, 500);
});

export default app;
