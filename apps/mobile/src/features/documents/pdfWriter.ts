import { Directory, File, Paths } from "expo-file-system";
import type { DocLayout } from "./layout";
import { renderPdf, type JpegInfo } from "./pdfBytes";

export type { JpegInfo };

export function readJpeg(uri: string | null | undefined): JpegInfo | null {
  if (!uri || /^(https?:|data:)/.test(uri)) return null;
  try {
    const bytes = new File(uri).bytesSync();
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) { i += 1; continue; }
      const marker = bytes[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        const height = (bytes[i + 5] << 8) | bytes[i + 6];
        const width = (bytes[i + 7] << 8) | bytes[i + 8];
        const components = bytes[i + 9];
        if (marker === 0xc2) return null; // progressive JPEG: leave out rather than risk a blank logo
        return width && height && (components === 1 || components === 3) ? { bytes, width, height, components } : null;
      }
      i += 2 + ((bytes[i + 2] << 8) | bytes[i + 3]);
    }
  } catch {
    /* unreadable logo: the document falls back to a monogram */
  }
  return null;
}


export function layoutToPdfBytes(layout: DocLayout, logoUri: string | null) {
  return renderPdf(layout, readJpeg(logoUri));
}

export function writePdf(bytes: Uint8Array, folder: "Invoices" | "Estimates", fileBase: string) {
  const directory = new Directory(Paths.document, "ReceiptCycle", folder);
  directory.create({ idempotent: true, intermediates: true });
  const file = new File(directory, `${fileBase.replace(/[^A-Za-z0-9_-]/g, "-")}.pdf`);
  if (file.exists) file.delete();
  file.write(bytes);
  return file.uri;
}
