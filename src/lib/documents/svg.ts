/**
 * Draws the layout engine's positioned primitives as SVG, one string per page. The same strings are shown in the
 * on-screen preview and sent to the printer, so what you see is what prints.
 */
import type { DocLayout } from "../../../apps/mobile/src/features/documents/layout";

const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const n = (value: number) => String(Math.round(value * 100) / 100);
const FONT = "Helvetica, Arial, 'Liberation Sans', sans-serif";

type Page = DocLayout["pages"][number];

export function pageToSvg(page: Page, w: number, h: number): string {
  const parts: string[] = [];
  for (const p of page) {
    if (p.t === "rect") {
      parts.push(`<rect x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${n(p.h)}" fill="${p.fill ? esc(p.fill) : "none"}"${p.stroke ? ` stroke="${esc(p.stroke)}" stroke-width="${n(p.lw ?? 0.6)}"` : ""}/>`);
    } else if (p.t === "line") {
      parts.push(`<line x1="${n(p.x1)}" y1="${n(p.y1)}" x2="${n(p.x2)}" y2="${n(p.y2)}" stroke="${esc(p.color)}" stroke-width="${n(p.lw)}"${p.dash ? ' stroke-dasharray="2 2"' : ""}/>`);
    } else if (p.t === "text") {
      if (!p.text) continue;
      const anchor = p.align === "right" ? "end" : p.align === "center" ? "middle" : "start";
      const x = p.align === "right" ? p.x + p.w : p.align === "center" ? p.x + p.w / 2 : p.x;
      parts.push(`<text x="${n(x)}" y="${n(p.y + p.size * 0.88)}" font-size="${n(p.size)}" font-weight="${p.bold ? 700 : 400}" fill="${esc(p.color)}" text-anchor="${anchor}" font-family="${esc(FONT)}" style="white-space:pre">${esc(p.text)}</text>`);
    } else if (p.t === "img") {
      parts.push(`<image href="${esc(p.uri)}" x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${n(p.h)}" preserveAspectRatio="xMidYMid meet"/>`);
    } else if (p.t === "hint") {
      // On screen only: tells the person where their logo will go. It never prints.
      parts.push(`<g class="rc-doc-hint"><rect x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${n(p.h)}" fill="none" stroke="#9CA3AF" stroke-width="0.8" stroke-dasharray="3 2"/><text x="${n(p.x + p.w / 2)}" y="${n(p.y + p.h / 2 + 2.5)}" font-size="7" fill="#9CA3AF" text-anchor="middle" font-family="${esc(FONT)}">${esc(p.text)}</text></g>`);
    } else if (p.t === "ink") {
      const d = p.ink.strokes
        .map((stroke) => {
          const pts = stroke.length === 1 ? [stroke[0], [stroke[0][0] + 0.001, stroke[0][1]]] : stroke;
          return pts.map(([sx, sy], i) => `${i === 0 ? "M" : "L"}${n(p.x + sx * p.w)} ${n(p.y + sy * p.h)}`).join(" ");
        })
        .join(" ");
      parts.push(`<path d="${d}" fill="none" stroke="${esc(p.color)}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Document page">${parts.join("")}</svg>`;
}

export function layoutToSvgPages(layout: DocLayout): string[] {
  return layout.pages.map((page) => pageToSvg(page, layout.w, layout.h));
}

/** A complete page that prints at the document's own paper size, one SVG per sheet, with nothing else around it. */
export function layoutToPrintHtml(layout: DocLayout, title: string): string {
  const pages = layoutToSvgPages(layout)
    .map((svg) => `<section class="sheet">${svg}</section>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
@page{size:${layout.w}pt ${layout.h}pt;margin:0}
html,body{margin:0;padding:0;background:#fff}
.sheet{width:${layout.w}pt;height:${layout.h}pt;overflow:hidden;page-break-after:always;break-after:page}
.sheet:last-child{page-break-after:auto;break-after:auto}
.sheet svg{display:block;width:100%;height:100%}
.rc-doc-hint{display:none}
*{-webkit-print-color-adjust:exact;print-color-adjust:exact}
</style></head><body>${pages}</body></html>`;
}

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
