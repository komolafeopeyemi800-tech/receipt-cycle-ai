import { api } from "../api/registry";
import type { ApiClient } from "../api/client";
import { createResultCache, createStatementAi } from "./serverAi";

/** The AI helper and result cache wired to the API, for use with `readStatement`. */
export function apiStatementTools(client: ApiClient) {
  return {
    ai: createStatementAi({
      mapColumns: (grid) => client.action(api.uploads.aiMapColumns, { grid }),
      extractChunk: (text) => client.action(api.uploads.aiExtract, { text }),
      ocrPdf: (pdfBase64) => client.action(api.uploads.aiOcrPdf, { pdfBase64 }),
    }),
    cache: createResultCache({
      get: (hash) => client.action(api.uploads.cacheGet, { hash }),
      put: (hash, fileName, result) => client.action(api.uploads.cachePut, { hash, fileName, result }),
    }),
  };
}
