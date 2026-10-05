import { drizzle } from "drizzle-orm/d1";
import { getAuth } from "./auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import * as schema from "./db/schema";
import { ApiError } from "./lib/errors";
import { adminRoutes, configRoutes } from "./routes/admin";
import { aiRoutes, contactRoutes } from "./routes/ai";
import { preferenceRoutes, subscriptionRoutes } from "./routes/account";
import { accountRoutes, budgetRoutes, categoryRoutes } from "./routes/money";
import { transactionRoutes } from "./routes/transactions";
import { webhookRoutes } from "./routes/webhooks";
import { meRoutes, socialRoutes } from "./routes/session";
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
