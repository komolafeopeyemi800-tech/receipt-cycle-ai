/**
 * Print helpers for the browser. The page drawing itself lives in svgPages.ts (no browser APIs, so the server can use it too).
 */
import type { DocLayout } from "../../../apps/mobile/src/features/documents/layout";
import { layoutToPrintHtml, layoutToSvgPages } from "./svgPages";

export { layoutToPrintHtml, layoutToSvgPages, pageToSvg } from "./svgPages";

/** Prints the document alone through a hidden frame (the browser's print dialog also offers "Save as PDF"). */
export function printLayout(layout: DocLayout, title: string) {
  if (typeof document === "undefined") return;
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc || !frame.contentWindow) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(layoutToPrintHtml(layout, title));
  doc.close();
  const win = frame.contentWindow;
  const run = () => {
    try {
      win.focus();
      win.print();
    } finally {
      window.setTimeout(() => frame.remove(), 1500);
    }
  };
  // Give a logo image a moment to load before the print dialog takes its snapshot.
  const images = Array.from(doc.images);
  if (!images.length) {
    window.setTimeout(run, 50);
    return;
  }
  Promise.all(images.map((img) => (img.complete ? Promise.resolve() : new Promise<void>((done) => { img.onload = img.onerror = () => done(); })))).then(run);
}
