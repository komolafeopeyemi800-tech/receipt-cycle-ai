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
};

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

receiptRoutes.delete("/", async (c) => {
  const key = c.req.query("key");
  if (!ownsReceipt(c.get("user").id, key)) throw new ApiError(404, "Receipt not found");
  await c.env.FILES.delete(key);
  return c.json({ ok: true });
});
