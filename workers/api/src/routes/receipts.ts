import { Hono } from "hono";
import { ApiError } from "../lib/errors";
import { newId } from "../lib/scope";
import { assertCanCreateTransaction, computeSubscriptionState } from "../lib/subscription";
import { requireUser } from "../middleware/auth";
import type { AppEnv } from "../types";

export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "application/pdf": "pdf",
  "text/csv": "csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.oasis.opendocument.text": "odt",
  "application/vnd.oasis.opendocument.spreadsheet": "ods",
};

const base64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

export async function receiptEvidenceSignature(secret: string | undefined, key: string): Promise<string> {
  if (!secret?.trim()) throw new ApiError(503, "Evidence links are not configured.");
  const cryptoKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(key))));
}

export async function receiptEvidenceUrl(secret: string | undefined, origin: string, key: string): Promise<string> {
  const sig = await receiptEvidenceSignature(secret, key);
  return `${origin.replace(/\/+$/, "")}/api/receipt-evidence?key=${encodeURIComponent(key)}&sig=${encodeURIComponent(sig)}`;
}

/** Public bearer-link endpoint. The unguessable HMAC lets a tax preparer open exported evidence without an account. */
export const receiptEvidenceRoutes = new Hono<AppEnv>();
receiptEvidenceRoutes.get("/", async (c) => {
  const key = c.req.query("key") ?? "";
  const sig = c.req.query("sig") ?? "";
  if (!key.startsWith("receipts/") || key.includes("..")) throw new ApiError(404, "Evidence not found");
  const expected = await receiptEvidenceSignature(c.env.BETTER_AUTH_SECRET, key);
  if (sig.length !== expected.length || sig !== expected) throw new ApiError(404, "Evidence not found");
  const obj = await c.env.FILES.get(key);
  if (!obj) throw new ApiError(404, "Evidence not found");
  return new Response(obj.body, { headers: {
    "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
    "Content-Length": String(obj.size),
    "Cache-Control": "private, max-age=3600",
    "Content-Disposition": `inline; filename="${(obj.customMetadata?.originalName || "receipt").replace(/["\\]/g, "")}"`,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  }});
});

/** Every receipt a user owns lives under this prefix; ownership is just a prefix check. */
export const receiptPrefix = (userId: string) => `receipts/${userId}/`;
export const ownsReceipt = (userId: string, key: string | null | undefined): key is string =>
  !!key && key.startsWith(receiptPrefix(userId)) && !key.includes("..");

/** Best-effort removal; a missing object or a storage hiccup must never block a delete. */
export async function deleteReceiptQuietly(bucket: R2Bucket, userId: string, key: string | null | undefined): Promise<void> {
  if (!ownsReceipt(userId, key)) return;
  try {
    await bucket.delete(key);
  } catch (error) {
    console.error("receipt delete failed", { key, error });
  }
}

/** Remove everything a user stored (account deletion). Loops over pages of up to 1000 keys. */
export async function deleteAllReceipts(bucket: R2Bucket, userId: string): Promise<void> {
  try {
    let cursor: string | undefined;
    do {
      const page = await bucket.list({ prefix: receiptPrefix(userId), cursor, limit: 1000 });
      if (page.objects.length) await bucket.delete(page.objects.map((o) => o.key));
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
  } catch (error) {
    console.error("receipt cleanup failed", { userId, error });
  }
}

export const receiptRoutes = new Hono<AppEnv>();
receiptRoutes.use("*", requireUser);

/** Store a receipt image or PDF. Send multipart/form-data with a `file` field. Returns `{ key }` for `receipt_url`. */
receiptRoutes.post("/", async (c) => {
  const u = c.get("user");
  assertCanCreateTransaction(
    computeSubscriptionState(
      {
        createdAt: u.createdAt,
        proSubscriptionActive: u.profile.proSubscriptionActive,
        trialStartedAt: u.profile.trialStartedAt,
        trialLifetimeAdds: u.profile.trialLifetimeAdds,
      },
      Date.now(),
    ),
  );
  const form = await c.req.parseBody();
  const file = form.file;
  if (!(file instanceof File)) throw new ApiError(400, "Send the receipt as a multipart `file` field.");
  const ext = TYPES[file.type];
  if (!ext) throw new ApiError(400, "Receipts must be a JPG, PNG, WebP, HEIC image or a PDF.");
  if (file.size === 0) throw new ApiError(400, "That file is empty.");
  if (file.size > MAX_RECEIPT_BYTES) throw new ApiError(413, `Receipts up to ${MAX_RECEIPT_BYTES / 1024 / 1024} MB are supported.`);

  const key = `${receiptPrefix(u.id)}${newId()}.${ext}`;
  await c.env.FILES.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { userId: u.id, originalName: file.name.slice(0, 120) },
  });
  return c.json({ key, size: file.size, contentType: file.type }, 201);
});

/** Download one of your own receipts: GET /api/receipts/file?key=receipts/<you>/<id>.jpg */
receiptRoutes.get("/file", async (c) => {
  const key = c.req.query("key");
  if (!ownsReceipt(c.get("user").id, key)) throw new ApiError(404, "Receipt not found");
  const obj = await c.env.FILES.get(key);
  if (!obj) throw new ApiError(404, "Receipt not found");
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      "Content-Length": String(obj.size),
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
});

receiptRoutes.get("/link", async (c) => {
  const key = c.req.query("key");
  if (!ownsReceipt(c.get("user").id, key)) throw new ApiError(404, "Receipt not found");
  const origin = c.env.BETTER_AUTH_URL || new URL(c.req.url).origin;
  return c.json({ url: await receiptEvidenceUrl(c.env.BETTER_AUTH_SECRET, origin, key) });
});

receiptRoutes.delete("/", async (c) => {
  const key = c.req.query("key");
  if (!ownsReceipt(c.get("user").id, key)) throw new ApiError(404, "Receipt not found");
  await c.env.FILES.delete(key);
  return c.json({ ok: true });
});
