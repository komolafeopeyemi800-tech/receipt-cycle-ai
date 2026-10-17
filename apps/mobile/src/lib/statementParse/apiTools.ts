import { api } from "../api/registry";
import type { ApiClient } from "../api/client";
import type { ScannedExtracted } from "../../types/transaction";
import { sha256Hex } from "./pipeline";
import { bytesToBase64, createResultCache, createStatementAi } from "./serverAi";

/** The AI helper and result cache wired to the API, for use with `readStatement`. */
export function apiStatementTools(client: ApiClient) {
  return {
    ai: createStatementAi({
      mapColumns: (grid) => client.action(api.uploads.aiMapColumns, { grid }),
      extractChunk: (text) => client.action(api.uploads.aiExtract, { text }),
      ocrPdf: (fileBase64, opts) => client.action(api.uploads.aiOcrPdf, { fileBase64, ...opts }),
    }),
    cache: createResultCache({
      get: (hash) => client.action(api.uploads.cacheGet, { hash }),
      put: (hash, fileName, result) => client.action(api.uploads.cachePut, { hash, fileName, result }),
    }),
  };
}

/**
 * A receipt or invoice (PDF or photo) read on the server with Azure prebuilt-receipt / prebuilt-invoice. The same file read
 * again (same kind) is served from the saved result, so it is paid for once.
 */
export function apiReadDocument(client: ApiClient) {
  const cache = createResultCache({
    get: (hash) => client.action(api.uploads.cacheGet, { hash }),
    put: (hash, fileName, result) => client.action(api.uploads.cachePut, { hash, fileName, result }),
  });
  return async (bytes: Uint8Array, opts: { kind?: "receipt" | "invoice" | "auto"; mimeType?: string; pageCount?: number } = {}): Promise<ScannedExtracted> => {
    let key = "";
    try {
      const salt = Array.from(`:doc:${opts.kind ?? "auto"}`, (ch) => ch.charCodeAt(0));
      const fileHash = await sha256Hex(bytes);
      key = await sha256Hex(Uint8Array.from([...Array.from(fileHash, (ch) => ch.charCodeAt(0)), ...salt]));
      const hit = (await cache.get(key)) as { extracted?: ScannedExtracted } | null;
      if (hit?.extracted) return hit.extracted;
    } catch {
      key = key || "";
    }
    const extracted = (await client.action(api.uploads.aiReadDocument, { fileBase64: bytesToBase64(bytes), ...opts })).extracted_data;
    if (key && typeof extracted.total_amount === "number" && extracted.total_amount > 0) {
      try {
        await cache.put(key, "document", {
          status: "ok",
          source: "ai",
          fileType: "document",
          rows: [{ date: /^\d{4}-\d{2}-\d{2}$/.test(extracted.date ?? "") ? extracted.date : new Date().toISOString().slice(0, 10), amount: extracted.total_amount, type: "expense", category: "Other" }],
          extracted,
        });
      } catch {
        /* best effort */
      }
    }
    return extracted;
  };
}
