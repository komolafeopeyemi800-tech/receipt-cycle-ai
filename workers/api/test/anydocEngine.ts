/** anydoc WASM running inside workerd: the same engine the browser uses, so tests exercise the real reader. */
import wasmModule from "@firecrawl/anydoc-wasm/anydoc_wasm_bg.wasm";
import { type Format, formatFromBytes, formatFromExtension, initSync, toDocument, toMarkdownBytes } from "@firecrawl/anydoc-wasm";
import type { DocEngine } from "../../../apps/mobile/src/lib/statementParse/types";

let ready = false;
const ensure = () => {
  if (!ready) {
    initSync({ module: wasmModule as WebAssembly.Module });
    ready = true;
  }
};

export const testEngine: DocEngine = {
  detectFormat: (b) => (ensure(), formatFromBytes(b)),
  formatForExtension: (e) => (ensure(), formatFromExtension(e)),
  toDocument: (b, f) => (ensure(), toDocument(b, f as Format) as never),
  toMarkdown: (b, f) => (ensure(), toMarkdownBytes(b, f as Format)),
};
