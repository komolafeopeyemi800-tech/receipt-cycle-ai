import { api } from "../api/registry";
import type { ApiClient } from "../api/client";
import type { ScannedExtracted } from "../../types/transaction";
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

/** A receipt or invoice (PDF or photo) read on the server with Azure prebuilt-receipt / prebuilt-invoice. */
export function apiReadDocument(client: ApiClient) {
  return async (bytes: Uint8Array, opts: { kind?: "receipt" | "invoice" | "auto"; mimeType?: string; pageCount?: number } = {}): Promise<ScannedExtracted> =>
    (await client.action(api.uploads.aiReadDocument, { fileBase64: bytesToBase64(bytes), ...opts })).extracted_data;
}
