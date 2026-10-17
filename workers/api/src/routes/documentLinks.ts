import { Hono } from "hono";
import { ApiError } from "../lib/errors";
import { requireUser } from "../middleware/auth";
import type { AppEnv } from "../types";
import { ownsReceipt } from "./receipts";

/**
 * Signed, expiring links to stored files, for spreadsheets.
 *
 * Why this exists: stored receipts and uploaded documents are only served to the signed-in owner (bearer token), so
 * a plain link inside an exported .xlsx would not open for a tax preparer. An export asks for one link per file and
 * puts it in a cell; clicking it opens the file in a browser with no sign-in.
 *
 * Security reasoning:
 * - A link is `key + exp + sig`. `sig` is HMAC-SHA256 over "key\nexp". Nobody can make a link for a file without the
 *   server secret, and changing the key or the expiry invalidates the signature, so one link never opens any other file.
 * - The HMAC key is not the raw BETTER_AUTH_SECRET: it is derived from it with a fixed purpose label (domain
 *   separation), so a signature made for another feature can never be replayed as a document link, and vice versa.
 * - Signatures are compared in constant time (no early exit), so timing does not leak the correct signature.
 * - Links are created only for keys under the caller's own prefix (`receipts/<userId>/`, no "..", at most 500 per
 *   call), after authentication. The shared endpoint can only read keys that pass the same prefix shape check and
 *   returns the same 404 for every failure (bad signature, expired, missing file), so it cannot be used to probe
 *   which files exist. There is no listing endpoint.
 * - Links expire (default 180 days). Deleting the file, or the account, kills the link at once because the object is
 *   gone. Anyone who holds a link can open that one file until then: share the workbook only with people you trust.
 * - Files are served with `nosniff`, a sandboxing Content-Security-Policy, `Cache-Control: private` and
 *   `Referrer-Policy: no-referrer`; only images and PDFs are shown inline, everything else downloads.
 */

export const LINK_DEFAULT_DAYS = 180;
export const LINK_MAX_KEYS = 500;
const PURPOSE = "receipt-cycle/shared-document-link/v1";

const enc = new TextEncoder();

const base64Url = (bytes: Uint8Array) => {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

async function hmac(keyBytes: Uint8Array | ArrayBuffer, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

/** Sign a link. Exported for tests and for other server code that needs to build a link. */
export async function signSharedLink(secret: string | undefined, key: string, expSeconds: number): Promise<string> {
  if (!secret?.trim()) throw new ApiError(503, "Document links are not configured.");
  const derived = await hmac(enc.encode(secret), PURPOSE);
  return base64Url(await hmac(derived, `${key}\n${expSeconds}`));
}

/** Constant-time string comparison (length is not secret: signatures are always the same length). */
function safeEqual(a: string, b: string): boolean {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export async function sharedLinkUrl(secret: string | undefined, origin: string, key: string, now = Date.now(), days = LINK_DEFAULT_DAYS): Promise<string> {
  const exp = Math.floor(now / 1000) + Math.round(days * 86_400);
  const sig = await signSharedLink(secret, key, exp);
  return `${origin.replace(/\/+$/, "")}/api/receipts/shared?key=${encodeURIComponent(key)}&exp=${exp}&sig=${encodeURIComponent(sig)}`;
}

/** Same shape rule as ownership (`receipts/<user>/<file>`, no traversal) without needing to know who the user is. */
export function isStoredFileKey(key: string): boolean {
  if (!key.startsWith("receipts/") || key.length > 300) return false;
  if (key.includes("..") || key.includes("\\") || key.includes("//") || /[\u0000-\u001f]/.test(key)) return false;
  return key.split("/").length === 3;
}

const INLINE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "application/pdf"]);

export const documentLinkRoutes = new Hono<AppEnv>();

/** Public: open a file with a valid signed link. Every failure is the same 404. */
documentLinkRoutes.get("/shared", async (c) => {
  const notFound = () => new ApiError(404, "This link is not valid or has expired.");
  const key = c.req.query("key") ?? "";
  const exp = c.req.query("exp") ?? "";
  const sig = c.req.query("sig") ?? "";
  if (!isStoredFileKey(key) || !/^\d{1,12}$/.test(exp) || !sig || sig.length > 100) throw notFound();
  const expected = await signSharedLink(c.env.BETTER_AUTH_SECRET, key, Number(exp));
  const valid = safeEqual(sig, expected);
  if (!valid || Number(exp) * 1000 < Date.now()) throw notFound();
  const obj = await c.env.FILES.get(key);
  if (!obj) throw notFound();
  const stored = (obj.httpMetadata?.contentType ?? "").toLowerCase();
  const inline = INLINE_TYPES.has(stored);
  const name = (obj.customMetadata?.originalName || key.split("/").pop() || "document").replace(/[^\x20-\x7E]|["\\;]/g, "_").slice(0, 120);
  return new Response(obj.body, {
    headers: {
      "Content-Type": inline ? stored : "application/octet-stream",
      "Content-Length": String(obj.size),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${name}"`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
    },
  });
});

/** Signed-in: create links for some of your own files. Body: { keys: string[] }, returns { links: { [key]: url } }. */
documentLinkRoutes.post("/links", requireUser, async (c) => {
  const u = c.get("user");
  const body = (await c.req.json().catch(() => null)) as { keys?: unknown; days?: unknown } | null;
  if (!body || !Array.isArray(body.keys)) throw new ApiError(400, "Send { keys: string[] }.");
  if (body.keys.length > LINK_MAX_KEYS) throw new ApiError(400, `Ask for at most ${LINK_MAX_KEYS} links at a time.`);
  const keys = [...new Set(body.keys)];
  for (const k of keys) {
    if (typeof k !== "string" || !ownsReceipt(u.id, k) || !isStoredFileKey(k)) throw new ApiError(404, "One of those files was not found.");
  }
  const origin = c.env.BETTER_AUTH_URL || new URL(c.req.url).origin;
  const links: Record<string, string> = {};
  const now = Date.now();
  for (const k of keys as string[]) links[k] = await sharedLinkUrl(c.env.BETTER_AUTH_SECRET, origin, k, now);
  return c.json({ links });
});
