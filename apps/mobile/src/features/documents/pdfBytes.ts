import { textWidth } from "./fonts";
import type { DocLayout, Prim } from "./layout";

const WIN1252: Record<string, number> = { "€": 0x80, "…": 0x85, "•": 0x95, "–": 0x96, "—": 0x97, "’": 0x92, "‘": 0x91, "“": 0x93, "”": 0x94 };

/** Maps text to the single-byte WinAnsi encoding the PDF fonts use. */
function encode(value: string) {
  let out = "";
  for (const ch of value.normalize("NFC")) {
    const code = ch.codePointAt(0) ?? 63;
    let byte = WIN1252[ch] ?? (code >= 32 && code <= 255 ? code : code === 9 || code === 10 ? 32 : 63);
    if (byte === 0xb7) byte = 0xb7; // middle dot is in Latin-1
    const c = String.fromCharCode(byte);
    out += c === "\\" || c === "(" || c === ")" ? `\\${c}` : c;
  }
  return out;
}

function rgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const f = (v: number) => (v / 255).toFixed(3);
  return `${f((n >> 16) & 255)} ${f((n >> 8) & 255)} ${f(n & 255)}`;
}

const num = (v: number) => (Math.round(v * 100) / 100).toString();

export type JpegInfo = { bytes: Uint8Array; width: number; height: number; components: number };

function pageStream(page: Prim[], H: number, imageName: string | null) {
  const out: string[] = [];
  for (const p of page) {
    if (p.t === "rect") {
      const y = H - p.y - p.h;
      if (p.fill) out.push(`${rgb(p.fill)} rg ${num(p.x)} ${num(y)} ${num(p.w)} ${num(p.h)} re f`);
      if (p.stroke) out.push(`${rgb(p.stroke)} RG ${num(p.lw ?? 0.6)} w ${num(p.x)} ${num(y)} ${num(p.w)} ${num(p.h)} re S`);
    } else if (p.t === "line") {
      out.push(`${rgb(p.color)} RG ${num(p.lw)} w ${p.dash ? "[2 2] 0 d" : "[] 0 d"} ${num(p.x1)} ${num(H - p.y1)} m ${num(p.x2)} ${num(H - p.y2)} l S`);
    } else if (p.t === "text") {
      if (!p.text) continue;
      const width = textWidth(p.text, p.size, !!p.bold);
      const x = p.align === "right" ? p.x + p.w - width : p.align === "center" ? p.x + (p.w - width) / 2 : p.x;
      out.push(`BT /${p.bold ? "F2" : "F1"} ${num(p.size)} Tf ${rgb(p.color)} rg ${num(x)} ${num(H - (p.y + p.size * 0.88))} Td (${encode(p.text)}) Tj ET`);
    } else if (p.t === "img" && imageName) {
      out.push(`q ${num(p.w)} 0 0 ${num(p.h)} ${num(p.x)} ${num(H - p.y - p.h)} cm /${imageName} Do Q`);
    } else if (p.t === "ink") {
      out.push(`${rgb(p.color)} RG 1.3 w 1 J 1 j`);
      for (const stroke of p.ink.strokes) {
        if (stroke.length === 1) stroke.push([stroke[0][0] + 0.001, stroke[0][1]]);
        stroke.forEach(([sx, sy], i) => out.push(`${num(p.x + sx * p.w)} ${num(H - (p.y + sy * p.h))} ${i === 0 ? "m" : "l"}`));
        out.push("S");
      }
    }
  }
  return out.join("\n");
}

function ascii(value: string) {
  const out = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i += 1) out[i] = value.charCodeAt(i) & 0xff;
  return out;
}

function join(chunks: Uint8Array[]) {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.length; }
  return out;
}

/** Turns a laid-out document into PDF bytes. Pure: no files, so it can be tested anywhere. */
export function renderPdf(layout: DocLayout, jpeg: JpegInfo | null) {
  const hasImage = jpeg && layout.pages.some((page) => page.some((p) => p.t === "img"));
  const first = hasImage ? 6 : 5;
  const pageIds = layout.pages.map((_, i) => first + i * 2);
  const objects: (string | Uint8Array[])[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${layout.pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  ];
  if (hasImage && jpeg) {
    objects.push([ascii(`<< /Type /XObject /Subtype /Image /Width ${jpeg.width} /Height ${jpeg.height} /ColorSpace /${jpeg.components === 1 ? "DeviceGray" : "DeviceRGB"} /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.bytes.length} >>\nstream\n`), jpeg.bytes, ascii("\nendstream")]);
  }
  layout.pages.forEach((page, index) => {
    const stream = `${pageStream(page, layout.h, hasImage ? "Im1" : null)}\n`;
    const contentId = first + 1 + index * 2;
    const xobj = hasImage ? " /XObject << /Im1 5 0 R >>" : "";
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${layout.w} ${layout.h}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>${xobj} >> /Contents ${contentId} 0 R >>`);
    objects.push([ascii(`<< /Length ${ascii(stream).length} >>\nstream\n`), ascii(stream), ascii("endstream")]);
  });

  const chunks: Uint8Array[] = [ascii("%PDF-1.4\n%âãÏÓ\n")];
  const offsets: number[] = [];
  let length = chunks[0].length;
  objects.forEach((obj, i) => {
    offsets.push(length);
    const parts = typeof obj === "string" ? [ascii(obj)] : obj;
    const head = ascii(`${i + 1} 0 obj\n`), tail = ascii("\nendobj\n");
    [head, ...parts, tail].forEach((part) => { chunks.push(part); length += part.length; });
  });
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => { xref += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`;
  chunks.push(ascii(xref));
  return join(chunks);
}

