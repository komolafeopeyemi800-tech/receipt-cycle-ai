import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { documents } from "../db/schema";
import { ApiError } from "../lib/errors";
import { newId } from "../lib/scope";
import { requireUser } from "../middleware/auth";
import type { AppEnv } from "../types";
import { deleteReceiptQuietly, receiptPrefix } from "./receipts";

/**
 * Hard cap per stored file. It keeps one upload inside the Cloudflare Workers free-plan request limits and the free R2
 * storage allowance; the apps check the same limit before uploading.
 */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const MAX_DOCUMENTS_PER_USER = 1000;
const MAX_META_CHARS = 64 * 1024;
const KINDS = ["bank_statement", "card_statement", "receipt", "invoice", "spreadsheet", "other"] as const;
type Kind = (typeof KINDS)[number];

const BY_EXT: Record<string, { mime: string }> = {
  csv: { mime: "text/csv" },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  xls: { mime: "application/vnd.ms-excel" },
  ods: { mime: "application/vnd.oasis.opendocument.spreadsheet" },
  pdf: { mime: "application/pdf" },
  jpg: { mime: "image/jpeg" },
  jpeg: { mime: "image/jpeg" },
  png: { mime: "image/png" },
};

const extOf = (name: string) => (name.includes(".") ? name.split(".").pop()!.toLowerCase() : "");

export const documentRoutes = new Hono<AppEnv>();
documentRoutes.use("*", requireUser);

/** Store an original file with its details. multipart/form-data: `file`, `kind`, `meta` (JSON text, optional). Returns { id, key }. */
documentRoutes.post("/", async (c) => {
  const u = c.get("user");
  const form = await c.req.parseBody();
  const file = form.file;
  if (!(file instanceof File)) throw new ApiError(400, "Send the document as a multipart `file` field.");
  if (file.size === 0) throw new ApiError(400, "That file is empty.");
  if (file.size > MAX_DOCUMENT_BYTES) throw new ApiError(413, "This file is larger than the 10 MB limit.");
  const ext = extOf(file.name) || ({ "image/jpeg": "jpg", "image/png": "png", "application/pdf": "pdf", "text/csv": "csv" } as Record<string, string>)[file.type] || "";
  const type = BY_EXT[ext];
  if (!type) throw new ApiError(400, "Documents must be CSV, Excel (xlsx, xls), ODS, PDF, JPG or PNG files.");
  const kind = String(form.kind ?? "other") as Kind;
  if (!KINDS.includes(kind)) throw new ApiError(400, "Unknown document kind.");
  let meta: Record<string, unknown> = {};
  const rawMeta = form.meta;
  if (typeof rawMeta === "string" && rawMeta.trim()) {
    if (rawMeta.length > MAX_META_CHARS) throw new ApiError(400, "The document details are too large.");
    try {
      const parsed = JSON.parse(rawMeta);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) meta = parsed as Record<string, unknown>;
    } catch {
      throw new ApiError(400, "The document details are not valid JSON.");
    }
  }
  const db = c.get("db");
  const have = await db.select({ id: documents.id }).from(documents).where(eq(documents.userId, u.id)).limit(MAX_DOCUMENTS_PER_USER + 1);
  if (have.length > MAX_DOCUMENTS_PER_USER) throw new ApiError(429, "You have stored the maximum number of documents. Delete some to add more.");

  const id = newId();
  const key = `${receiptPrefix(u.id)}${id}.${ext === "jpeg" ? "jpg" : ext}`;
  const fileName = (file.name || `document.${ext}`).slice(0, 200);
  await c.env.FILES.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: type.mime },
    customMetadata: { userId: u.id, originalName: fileName.slice(0, 120) },
  });
  try {
    await db.insert(documents).values({ id, userId: u.id, kind, fileName, r2Key: key, mime: type.mime, size: file.size, meta: JSON.stringify(meta), createdAt: Date.now() });
  } catch (error) {
    await deleteReceiptQuietly(c.env.FILES, u.id, key);
    throw error;
  }
  return c.json({ id, key }, 201);
});

documentRoutes.get("/", async (c) => {
  const rows = await c
    .get("db")
    .select()
    .from(documents)
    .where(eq(documents.userId, c.get("user").id))
    .orderBy(desc(documents.createdAt))
    .limit(MAX_DOCUMENTS_PER_USER);
  return c.json(
    rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      fileName: r.fileName,
      r2Key: r.r2Key,
      mime: r.mime,
      size: r.size,
      meta: (() => {
        try {
          return JSON.parse(r.meta);
        } catch {
          return {};
        }
      })(),
      createdAt: r.createdAt,
    })),
  );
});

documentRoutes.delete("/:id", async (c) => {
  const u = c.get("user");
  const db = c.get("db");
  const row = await db.select().from(documents).where(and(eq(documents.id, c.req.param("id")), eq(documents.userId, u.id))).get();
  if (!row) throw new ApiError(404, "Document not found");
  await db.delete(documents).where(eq(documents.id, row.id));
  await deleteReceiptQuietly(c.env.FILES, u.id, row.r2Key);
  return c.json({ ok: true });
});
