/** Helvetica advance widths (per 1000 em) for ASCII 32..126, so text can be measured, wrapped and right-aligned exactly. */
const REGULAR = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];
const BOLD = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

export function charWidth(code: number, bold: boolean): number {
  const table = bold ? BOLD : REGULAR;
  if (code >= 32 && code <= 126) return table[code - 32];
  if (code === 0x20ac) return 556;
  return bold ? 611 : 556; // accented letters and symbols: close enough to an average glyph
}

export function textWidth(text: string, size: number, bold = false): number {
  let total = 0;
  for (let i = 0; i < text.length; i += 1) total += charWidth(text.charCodeAt(i), bold);
  return (total * size) / 1000;
}

/** Breaks text into lines no wider than maxWidth, honouring explicit newlines. A single over-long word is hard-split. */
export function wrapText(text: string, size: number, bold: boolean, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of String(text ?? "").split(/\r?\n/)) {
    const words = paragraph.replace(/[ \t]+/g, " ").trim().split(" ").filter(Boolean);
    if (!words.length) { out.push(""); continue; }
    let line = "";
    for (let word of words) {
      while (textWidth(word, size, bold) > maxWidth) {
        let cut = word.length - 1;
        while (cut > 1 && textWidth(word.slice(0, cut), size, bold) > maxWidth) cut -= 1;
        if (line) { out.push(line); line = ""; }
        out.push(word.slice(0, cut));
        word = word.slice(cut);
      }
      const next = line ? `${line} ${word}` : word;
      if (line && textWidth(next, size, bold) > maxWidth) { out.push(line); line = word; } else line = next;
    }
    if (line) out.push(line);
  }
  return out;
}

export function fitText(text: string, size: number, bold: boolean, maxWidth: number): string {
  if (textWidth(text, size, bold) <= maxWidth) return text;
  let cut = text.length;
  while (cut > 1 && textWidth(`${text.slice(0, cut)}…`, size, bold) > maxWidth) cut -= 1;
  return `${text.slice(0, cut).trimEnd()}...`;
}
