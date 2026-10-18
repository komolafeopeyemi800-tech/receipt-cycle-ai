import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { publicDocumentLinks, salesRecords } from "../db/schema";
import { ApiError } from "../lib/errors";
import { parseBody } from "../lib/http";
import { resolveScope } from "../lib/scope";
import { requireUser } from "../middleware/auth";
import type { AppEnv } from "../types";
import { renderPublicDocumentPage, type PublicSnapshot } from "./publicDocumentPage";

export const publicDocumentRoutes = new Hono<AppEnv>();

const createBody = z.object({ workspace: z.string().min(1), kind: z.enum(["invoice", "estimate"]), documentId: z.string().min(1).max(200) });
function makeToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

publicDocumentRoutes.post("/", requireUser, async (c) => {
  const body = await parseBody(c, createBody);
  const db = c.get("db");
  const scope = await resolveScope(db, c.get("user").id, body.workspace);
  const document = await db.select().from(salesRecords).where(and(eq(salesRecords.scope, scope), eq(salesRecords.kind, body.kind), eq(salesRecords.id, body.documentId), eq(salesRecords.deleted, 0))).get();
  if (!document) throw new ApiError(404, `${body.kind === "invoice" ? "Invoice" : "Estimate"} not found.`);
  const business = await db.select().from(salesRecords).where(and(eq(salesRecords.scope, scope), eq(salesRecords.kind, "business_profile"), eq(salesRecords.deleted, 0))).get();
  const parsedDocument = JSON.parse(document.data) as Record<string, any>;
  const settingsRow = await db.select().from(salesRecords).where(and(eq(salesRecords.scope, scope), eq(salesRecords.kind, "invoice_settings"), eq(salesRecords.deleted, 0))).get();
  const customerId = typeof parsedDocument.customerId === "string" ? parsedDocument.customerId : "";
  const customerRow = customerId ? await db.select().from(salesRecords).where(and(eq(salesRecords.scope, scope), eq(salesRecords.kind, "customer"), eq(salesRecords.id, customerId), eq(salesRecords.deleted, 0))).get() : null;
  // The page is drawn with the owner's saved style, so the snapshot keeps the style settings and the customer beside the document.
  const snapshot = JSON.stringify({ document: parsedDocument, business: business ? JSON.parse(business.data) : null, settings: settingsRow ? JSON.parse(settingsRow.data) : null, customer: customerRow ? JSON.parse(customerRow.data) : null });
  const existing = await db.select().from(publicDocumentLinks).where(and(eq(publicDocumentLinks.scope, scope), eq(publicDocumentLinks.kind, body.kind), eq(publicDocumentLinks.documentId, body.documentId))).get();
  const now = Date.now();
  const token = existing?.token ?? makeToken();
  if (existing) await db.update(publicDocumentLinks).set({ snapshot, updatedAt: now }).where(eq(publicDocumentLinks.token, token));
  else await db.insert(publicDocumentLinks).values({ token, scope, kind: body.kind, documentId: body.documentId, snapshot, createdAt: now, updatedAt: now });
  const origin = (c.env.BETTER_AUTH_URL || new URL(c.req.url).origin).replace(/\/+$/, "");
  return c.json({ url: `${origin}/public/documents/${token}` });
});

publicDocumentRoutes.get("/:token", async (c) => {
  const row = await c.get("db").select().from(publicDocumentLinks).where(eq(publicDocumentLinks.token, c.req.param("token"))).get();
  if (!row) return c.html("<!doctype html><title>Document unavailable</title><main style='font-family:system-ui;padding:48px;text-align:center'><h1>Document unavailable</h1><p>This link is invalid or no longer available.</p></main>", 404);
  const payload = JSON.parse(row.snapshot) as PublicSnapshot;
  // Links made before the style was saved with them use the owner's current style settings.
  if (!payload.settings) {
    const live = await c.get("db").select().from(salesRecords).where(and(eq(salesRecords.scope, row.scope), eq(salesRecords.kind, "invoice_settings"), eq(salesRecords.deleted, 0))).get();
    payload.settings = live ? JSON.parse(live.data) : null;
  }
  const html = renderPublicDocumentPage(row.kind === "invoice" ? "invoice" : "estimate", payload, row.documentId.replace(/^(inv|est):/, ""));
  return c.html(html, 200, { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" });
});
