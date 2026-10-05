import wasmModule from "@firecrawl/anydoc-wasm/anydoc_wasm_bg.wasm";
import {
  type Document,
  type Format,
  formatFromBytes,
  formatFromExtension,
  initSync,
  toDocument,
  toMarkdownBytes,
} from "@firecrawl/anydoc-wasm";

let ready = false;

/** The WASM file is bundled by Wrangler as a precompiled module; compile once per isolate. */
function ensureReady() {
  if (!ready) {
    initSync({ module: wasmModule as WebAssembly.Module });
    ready = true;
  }
}

export type { Document, Format };

export function detectFormat(bytes: Uint8Array): Format | undefined {
  ensureReady();
  return formatFromBytes(bytes);
}

export function toDoc(bytes: Uint8Array, format?: Format): Document {
  ensureReady();
  return toDocument(bytes, format ?? null);
}

export function toMarkdown(bytes: Uint8Array, format?: Format): string {
  ensureReady();
  return toMarkdownBytes(bytes, format ?? null);
}

export function formatForExtension(ext: string): Format | undefined {
  ensureReady();
  return formatFromExtension(ext);
}
