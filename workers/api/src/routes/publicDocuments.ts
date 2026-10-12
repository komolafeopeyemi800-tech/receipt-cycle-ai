import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { publicDocumentLinks, salesRecords } from "../db/schema";
import { ApiError } from "../lib/errors";
import { parseBody } from "../lib/http";
import { resolveScope } from "../lib/scope";
import { requireUser } from "../middleware/auth";
import type { AppEnv } from "../types";

export const publicDocumentRoutes = new Hono<AppEnv>();

const createBody = z.object({ workspace: z.string().min(1), kind: z.enum(["invoice", "estimate"]), documentId: z.string().min(1).max(200) });
const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
const amount = (value: unknown) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0);

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
  const snapshot = JSON.stringify({ document: JSON.parse(document.data), business: business ? JSON.parse(business.data) : null });
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
  const payload = JSON.parse(row.snapshot) as { document?: Record<string, any>; business?: Record<string, any> | null };
  const doc = payload.document ?? {};
  const business = payload.business ?? {};
  const label = row.kind === "invoice" ? "Invoice" : "Estimate";
  const number = doc.invoiceNumber ?? doc.estimateNumber ?? row.documentId;
  const date = doc.issueDate ?? doc.estimateDate ?? "";
  const dueLabel = row.kind === "invoice" ? "Due date" : "Valid until";
  const due = doc.dueDate ?? doc.validUntil ?? "";
  const items = Array.isArray(doc.items) ? doc.items : [];
  const rows = items.map((item: any) => `<tr><td><strong>${escapeHtml(item.name || item.description || "Item")}</strong><small>${escapeHtml(item.description || "")}</small></td><td>${escapeHtml(item.quantity ?? 1)}</td><td>${amount(item.rate)}</td><td>${amount((Number(item.quantity) || 0) * (Number(item.rate) || 0))}</td></tr>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(label)} ${escapeHtml(number)}</title><style>body{margin:0;background:#f4f7f6;color:#102a2a;font:15px system-ui,-apple-system,sans-serif}.page{max-width:820px;margin:40px auto;background:#fff;padding:44px;border-radius:18px;box-shadow:0 12px 40px #1232}.top,.meta,.total{display:flex;justify-content:space-between;gap:24px}.brand{font-size:20px;font-weight:800;color:#087f72}.label{font-size:30px;font-weight:900;text-align:right}.muted{color:#64748b}.meta{margin:34px 0;padding:22px 0;border-block:1px solid #e2e8f0}.meta div:last-child{text-align:right}table{width:100%;border-collapse:collapse}th,td{padding:14px 10px;border-bottom:1px solid #e2e8f0;text-align:right}th:first-child,td:first-child{text-align:left}small{display:block;color:#64748b;margin-top:3px}.total{margin:28px 0 0 auto;max-width:340px;border-top:2px solid #0f766e;padding-top:15px;font-size:22px;font-weight:900}.actions{text-align:center;margin:24px}.actions button{border:0;border-radius:10px;background:#0f766e;color:#fff;padding:12px 20px;font-weight:800}@media(max-width:640px){.page{margin:0;padding:24px;border-radius:0;min-height:100vh}.top,.meta{flex-direction:column}.label,.meta div:last-child{text-align:left}th,td{padding:10px 5px;font-size:12px}}@media print{body{background:#fff}.page{margin:0;box-shadow:none;max-width:none}.actions{display:none}}</style></head><body><div class="page"><div class="top"><div><div class="brand">${escapeHtml(business.name || "Receipt Cycle")}</div><div class="muted">${escapeHtml(business.email || business.phone || "")}</div></div><div><div class="label">${escapeHtml(label)}</div><strong>${escapeHtml(number)}</strong></div></div><div class="meta"><div><span class="muted">Prepared for</span><br><strong>${escapeHtml(doc.customerName || "Customer")}</strong></div><div><span class="muted">Date</span><br><strong>${escapeHtml(date)}</strong><br><span class="muted">${dueLabel}</span><br><strong>${escapeHtml(due)}</strong></div></div><table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><div class="total"><span>Total</span><span>${amount(doc.total)}</span></div>${doc.notes ? `<p class="muted">${escapeHtml(doc.notes)}</p>` : ""}</div><div class="actions"><button onclick="window.print()">Print or save PDF</button></div></body></html>`;
  return c.html(html, 200, { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" });
});
