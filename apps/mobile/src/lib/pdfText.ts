/**
 * Extract plain text from PDF bytes.
 * Prefer Convex `pdfExtract.extractTextFromPdfBase64` (pdf.js is unreliable in RN/Hermes).
 */
import "../polyfills";

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

export type ConvexPdfResult = { ok: boolean; text?: string; error?: string };

export async function extractTextFromPdfArrayBuffer(
  data: ArrayBuffer,
  options?: {
    convexExtract?: (pdfBase64: string) => Promise<ConvexPdfResult>;
  },
): Promise<string> {
  if (options?.convexExtract) {
    const b64 = arrayBufferToBase64(data);
    const r = await options.convexExtract(b64);
    if (r.ok && r.text && r.text.trim().length > 0) {
      return r.text;
    }
    const errMsg = r.error ?? "Server could not extract PDF text.";
    // Optional client fallback on web only
    if (typeof window === "undefined") {
      throw new Error(errMsg);
    }
    try {
      return await extractWithPdfJs(data);
    } catch {
      throw new Error(errMsg);
    }
  }

  try {
    return await extractWithPdfJs(data);
  } catch (e) {
    throw e instanceof Error ? e : new Error("PDF read failed.");
  }
}

async function extractWithPdfJs(data: ArrayBuffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const version = (pdfjs as { version?: string }).version ?? "4.4.168";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

  const loadingTask = pdfjs.getDocument({ data, useSystemFonts: true });
  const doc = await loadingTask.promise;
  const parts: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
      .join(" ");
    parts.push(line);
  }

  const t = parts.join("\n").trim();
  if (!t.length) throw new Error("No text in PDF (image-only?).");
  return t;
}
