import { and, eq } from "drizzle-orm";
import { type Context, Hono } from "hono";
import { z } from "zod";
import { uploadParses } from "../db/schema";
import { aiExtractChunk, aiMapColumns, aiOcrPdf } from "../docs/ai";
import { AzureError, azureConfigured } from "../docs/azure";
import { azureReadDocument } from "../docs/azureDoc";
import { AI_COST_MICROS, type AiKind, azureCostMicros, chargeAi, guardAiOrThrow } from "../lib/aiBudget";
import { getRuntimeConfig } from "../lib/config";
import { useDaily } from "../lib/dailyLimit";
import { ApiError } from "../lib/errors";
import { parseBody } from "../lib/http";
import { enforce } from "../lib/rateLimit";
import { newId } from "../lib/scope";
import { computeSubscriptionState, sessionErrorMessage } from "../lib/subscription";
import { requireUser } from "../middleware/auth";
import type { AppEnv } from "../types";

/**
 * Reading Excel/CSV/PDF files happens in the user's browser (free for us, no size limit). These
 * routes cover only what must stay on the server: the AI helper (so the API key stays secret and
 * the budget is enforced) and a small cache of AI-assisted results.
 */

/** AI calls one account may make per day across all uploads: a hard ceiling on spend. */
export const AI_CALLS_PER_DAY = 60;
const DAY_MS = 24 * 60 * 60 * 1000;
/** D1 rows max out at 2 MB; stay well under so a big result is returned but simply not cached. */
const MAX_CACHED_JSON = 1_500_000;
const MAX_TEXT_CHARS = 15_000;
const MAX_PDF_BASE64_CHARS = 14 * 1024 * 1024; // about a 10 MB PDF

export const uploadRoutes = new Hono<AppEnv>();
uploadRoutes.use("*", requireUser);

/** Gate shared by every AI route: switches, plan, key, and the daily budget. */
async function aiGate(c: Context<AppEnv>, countsAsUpload = false, needsOpenAi = true, cost: { kind: AiKind; micros: number } = { kind: "extract", micros: AI_COST_MICROS.extract }) {
  const db = c.get("db");
  const u = c.get("user");
  const cfg = await getRuntimeConfig(db);
  if (cfg.maintenanceMode) throw new ApiError(503, "System is in maintenance mode. Please try again later.");
  if (!cfg.uploadEnabled) throw new ApiError(403, "Upload flow is currently disabled by admin.");
  const sub = computeSubscriptionState(
    {
      createdAt: u.createdAt,
      proSubscriptionActive: u.profile.proSubscriptionActive,
      trialStartedAt: u.profile.trialStartedAt,
      trialLifetimeAdds: u.profile.trialLifetimeAdds,
    },
    Date.now(),
  );
  if (!sub.canUseAiFeatures) throw new ApiError(402, sessionErrorMessage(sub.phase) ?? "The AI helper is not available on your plan.");
  if (needsOpenAi && !c.env.OPENAI_API_KEY?.trim()) throw new ApiError(503, "The AI helper is not configured on the server.");
  if (!needsOpenAi && !azureConfigured(c.env)) throw new ApiError(503, "Scanned statements cannot be read right now. Please try again later, or upload a CSV or Excel version.");
  if (countsAsUpload) {
    // One uploaded document is one use, however many AI calls it needs; the per-call ceiling below still caps total spend.
    const r = await useDaily(db, u.id, "upload", cfg.dailyUploadLimit);
    if (!r.ok) throw new ApiError(429, r.message);
  }
  await enforce(db, `ai:${u.id}`, AI_CALLS_PER_DAY, DAY_MS, `Daily limit reached for the AI helper (${AI_CALLS_PER_DAY} calls).`);
  // Cost guard: pauses the smart features for people whose paid-AI use looks like a bot or is far above heavy-user levels.
  await guardAiOrThrow(db, c.env, u, cost.kind, cost.micros);
}

/** Wrap provider failures so the client sees a friendly 502-style message, not a stack trace. */
async function viaAi<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    console.error("upload AI call failed", e);
    throw new ApiError(503, "The AI helper could not read this right now. Please try again.");
  }
}

uploadRoutes.post("/ai/map-columns", async (c) => {
  const { grid } = await parseBody(c, z.object({ grid: z.array(z.array(z.string().max(200)).max(60)).min(2).max(60) }));
  await aiGate(c, true);
  return c.json({ mapping: await viaAi(() => aiMapColumns(c.env, grid)) });
});

uploadRoutes.post("/ai/extract", async (c) => {
  const { text } = await parseBody(c, z.object({ text: z.string().min(8).max(MAX_TEXT_CHARS) }));
  await aiGate(c);
  return c.json({ rows: await viaAi(() => aiExtractChunk(c.env, text)) });
});

uploadRoutes.post("/ai/ocr-pdf", async (c) => {
  const body = await parseBody(
    c,
    z.object({
      pdfBase64: z.string().min(100).max(MAX_PDF_BASE64_CHARS).optional(),
      fileBase64: z.string().min(100).max(MAX_PDF_BASE64_CHARS).optional(),
      /** "pdf" (default) or "statement": a photo (png / jpeg) of a multi-row statement. */
      kind: z.enum(["pdf", "statement"]).default("pdf"),
      mimeType: z.enum(["image/png", "image/jpeg", "image/jpg", "application/pdf"]).optional(),
      /** The PDF's real page count from the caller's own parser, to catch a reader tier that only reads part of it. */
      pageCount: z.number().int().min(1).max(2000).optional(),
    }),
  );
  const file = body.fileBase64 ?? body.pdfBase64;
  if (!file) throw new ApiError(400, "No file was sent.");
  if (body.kind === "statement" && body.mimeType === "application/pdf") throw new ApiError(400, "kind statement is for images; send PDFs with the default kind.");
  // Off until it is switched on in the Worker settings.
  if (c.env.OCR_PDF_ENABLED !== "true") throw new ApiError(400, "Scanned statements cannot be read yet. Upload a CSV, Excel or regular PDF statement instead.");
  const expectedPages = body.kind === "statement" ? 1 : (body.pageCount ?? 1);
  await aiGate(c, true, false, { kind: "document", micros: azureCostMicros(expectedPages) });
  try {
    const out = await aiOcrPdf(c.env, file, { kind: body.kind, expectedPages: body.kind === "statement" ? 1 : body.pageCount });
    // Charge what Azure really billed: every page, twice when the second (layout) model had to run too.
    await chargeAi(c.get("db"), c.env, c.get("user"), azureCostMicros(out.pages, out.model === "prebuilt-layout" ? 2 : 1) - azureCostMicros(expectedPages));
    return c.json({ rows: out.rows, opening: out.opening, closing: out.closing, warnings: out.warnings, pages: out.pages, meta: out.meta, metaKind: out.metaKind });
  } catch (e) {
    if (e instanceof AzureError) {
      console.error("scanned statement read failed", e.message);
      throw new ApiError(e.status === 503 || e.status === 504 ? 503 : 400, e.userMessage);
    }
    console.error("scanned statement read failed", e);
    throw new ApiError(503, "Scanned statements cannot be read right now. Please try again later, or upload a CSV or Excel version.");
  }
});

/**
 * A receipt or invoice (PDF or photo) read by Azure prebuilt-receipt / prebuilt-invoice, returned in the shape the
 * receipt-review screens already use plus invoice fields. Same switch, gates and daily upload limit as the statement route.
 */
uploadRoutes.post("/ai/read-document", async (c) => {
  const body = await parseBody(
    c,
    z.object({
      fileBase64: z.string().min(100).max(MAX_PDF_BASE64_CHARS),
      kind: z.enum(["receipt", "invoice", "auto"]).default("auto"),
      mimeType: z.enum(["image/png", "image/jpeg", "image/jpg", "application/pdf"]).optional(),
      pageCount: z.number().int().min(1).max(2000).optional(),
    }),
  );
  if (c.env.OCR_PDF_ENABLED !== "true") throw new ApiError(400, "Reading receipts and invoices from PDFs is not available yet. Take a photo of it instead.");
  const docPages = body.mimeType && body.mimeType !== "application/pdf" ? 1 : (body.pageCount ?? 1);
  await aiGate(c, true, false, { kind: "document", micros: azureCostMicros(docPages) });
  try {
    const extracted = await azureReadDocument(c.env, body.fileBase64, body.kind, { expectedPages: body.mimeType && body.mimeType !== "application/pdf" ? 1 : body.pageCount });
    // "auto" tries the receipt model first and the invoice model second: the second pass bills the pages again.
    if (body.kind === "auto" && extracted.source === "azure-invoice") await chargeAi(c.get("db"), c.env, c.get("user"), azureCostMicros(docPages));
    return c.json({ extracted_data: extracted });
  } catch (e) {
    if (e instanceof AzureError) {
      console.error("document read failed", e.message);
      throw new ApiError(e.status === 503 || e.status === 504 ? 503 : 400, e.userMessage);
    }
    console.error("document read failed", e);
    throw new ApiError(503, "This document cannot be read right now. Please try again later.");
  }
});

// ---- cache of AI-assisted results, keyed by the file's SHA-256 --------------------------------

const rowSchema = z.object({
  date: z.string(),
  amount: z.number().finite().positive(),
  type: z.enum(["expense", "income"]),
  category: z.string(),
  merchant: z.string().optional(),
  description: z.string().optional(),
  payment_method: z.string().optional(),
});

const cacheBody = z.object({
  hash: z.string().regex(/^[0-9a-f]{64}$/),
  fileName: z.string().max(200),
  result: z
    .object({
      status: z.literal("ok"),
      source: z.literal("ai"),
      rows: z.array(rowSchema).min(1).max(5000),
    })
    .passthrough(),
});

uploadRoutes.get("/cache", async (c) => {
  const hash = c.req.query("hash") ?? "";
  if (!/^[0-9a-f]{64}$/.test(hash)) throw new ApiError(400, "hash must be a SHA-256 hex string.");
  const hit = await c
    .get("db")
    .select({ result: uploadParses.result })
    .from(uploadParses)
    .where(and(eq(uploadParses.userId, c.get("user").id), eq(uploadParses.fileHash, hash)))
    .get();
  if (!hit) throw new ApiError(404, "Not cached");
  return c.json({ result: JSON.parse(hit.result) });
});

uploadRoutes.put("/cache", async (c) => {
  const body = await parseBody(c, cacheBody);
  const json = JSON.stringify(body.result);
  if (json.length > MAX_CACHED_JSON) return c.json({ stored: false });
  const values = {
    fileName: body.fileName,
    fileType: typeof body.result.fileType === "string" ? body.result.fileType : null,
    source: "ai" as const,
    rowCount: body.result.rows.length,
    result: json,
    createdAt: Date.now(),
  };
  await c
    .get("db")
    .insert(uploadParses)
    .values({ id: newId(), userId: c.get("user").id, fileHash: body.hash, ...values })
    .onConflictDoUpdate({ target: [uploadParses.userId, uploadParses.fileHash], set: values });
  return c.json({ stored: true });
});
