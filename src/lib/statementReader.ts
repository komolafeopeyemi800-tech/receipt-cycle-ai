import type { DocEngine } from "@mobile-lib/statementParse/types";

let engine: Promise<DocEngine> | null = null;

/**
 * anydoc's WebAssembly reader (about 6 MB). Loaded only when someone actually uploads a statement,
 * so it never slows down the rest of the site. Reading happens in the browser: free, and no file-size
 * limit from the server.
 */
export function loadStatementEngine(): Promise<DocEngine> {
  engine ??= (async () => {
    const mod = await import("@firecrawl/anydoc-wasm");
    await mod.default();
    return {
      detectFormat: (bytes) => mod.formatFromBytes(bytes),
      formatForExtension: (ext) => mod.formatFromExtension(ext),
      toDocument: (bytes, format) => mod.toDocument(bytes, format as never) as never,
      toMarkdown: (bytes, format) => mod.toMarkdownBytes(bytes, format as never),
    } satisfies DocEngine;
  })().catch((e) => {
    engine = null; // let the next attempt retry (e.g. after a network blip)
    throw e;
  });
  return engine;
}
