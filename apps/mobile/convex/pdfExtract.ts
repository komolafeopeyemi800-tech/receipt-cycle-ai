"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

function stripBase64Prefix(s: string) {
  return s.replace(/^data:application\/pdf;base64,/, "").replace(/\s/g, "");
}

/** Server-side PDF text extraction (pdf-parse breaks Convex static analysis; use pdf.js like the client). */
export const extractTextFromPdfBase64 = action({
  args: { pdfBase64: v.string() },
  handler: async (_ctx, { pdfBase64 }) => {
    try {
      const clean = stripBase64Prefix(pdfBase64);
      const buf = Buffer.from(clean, "base64");
      if (buf.length < 24) {
        return { ok: false as const, text: "", error: "PDF data too small or invalid." };
      }

      const pdfjs = await import("pdfjs-dist");
      const version = "4.4.168";
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

      const data = new Uint8Array(buf);
      const loadingTask = pdfjs.getDocument({ data, useSystemFonts: true });
      const doc = await loadingTask.promise;
      const parts: string[] = [];

      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const line = content.items
          .map((item) => ("str" in item && typeof (item as { str: string }).str === "string" ? (item as { str: string }).str : ""))
          .join(" ");
        parts.push(line);
      }

      const text = parts.join("\n").trim();
      if (!text.length) {
        return {
          ok: false as const,
          text: "",
          error: "No extractable text (image-only PDF?). Try a text-based export or CSV.",
        };
      }
      return { ok: true as const, text, error: undefined as string | undefined };
    } catch (e) {
      return {
        ok: false as const,
        text: "",
        error: e instanceof Error ? e.message : "PDF parse failed on server.",
      };
    }
  },
});
