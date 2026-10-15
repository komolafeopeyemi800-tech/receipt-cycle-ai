import { calculateInvoiceTotals, type InvoiceDraft } from "../invoices/model";
import type { BusinessProfile, SalesCustomer } from "../sales/setupData";
import { formatNumberGrouped } from "../../lib/preferences";
import { fitText, textWidth, wrapText } from "./fonts";

export type DocKind = "INVOICE" | "ESTIMATE";
export type DocTemplate = "standard" | "compact";
export type PaperSize = "a4" | "letter";

export const PAPER: Record<PaperSize, { w: number; h: number; label: string }> = {
  a4: { w: 595, h: 842, label: "A4" },
  letter: { w: 612, h: 792, label: "US Letter" },
};

/** Print-safe accents: every one keeps white text readable (7:1 or better) and stays distinct in greyscale. */
export const ACCENTS = [
  { id: "teal", name: "Teal", hex: "#0F5F66" },
  { id: "navy", name: "Navy", hex: "#1F3A5F" },
  { id: "indigo", name: "Indigo", hex: "#3730A3" },
  { id: "plum", name: "Plum", hex: "#5B2A6B" },
  { id: "burgundy", name: "Burgundy", hex: "#7A1F2E" },
  { id: "forest", name: "Forest", hex: "#1E5A3C" },
  { id: "slate", name: "Slate", hex: "#334155" },
  { id: "graphite", name: "Graphite", hex: "#1F2937" },
] as const;
export const DEFAULT_ACCENT = ACCENTS[0].hex;

/** A signature drawn with a finger: strokes of points normalised to 0..1, plus the pad's width / height ratio. */
export type SignatureInk = { strokes: number[][][]; aspect: number };

export type Prim =
  | { t: "rect"; x: number; y: number; w: number; h: number; fill?: string; stroke?: string; lw?: number }
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; color: string; lw: number; dash?: boolean }
  | { t: "text"; x: number; y: number; w: number; text: string; size: number; bold?: boolean; color: string; align?: "left" | "right" | "center" }
  | { t: "img"; x: number; y: number; w: number; h: number; uri: string }
  /** On-screen only (never printed): a dashed box that tells the person where their logo will appear. */
  | { t: "hint"; x: number; y: number; w: number; h: number; text: string }
  | { t: "ink"; x: number; y: number; w: number; h: number; ink: SignatureInk; color: string };

/** What the person chooses to print on a document. Everything is on by default except the app credit switch. */
export type DocOptions = {
  logo: boolean; phone: boolean; email: boolean; address: boolean; taxId: boolean; website: boolean;
  customerContact: boolean; itemDescriptions: boolean; itemNumbers: boolean; taxLine: boolean; amountBox: boolean;
  notes: boolean; terms: boolean; paymentDetails: boolean;
  /** New invoices start with the signature line switched on. */
  signatureDefault: boolean;
  /** Hide the small "Created with Receipt Cycle" line in the footer. */
  hideBranding: boolean;
};
export const DEFAULT_DOC_OPTIONS: DocOptions = {
  logo: true, phone: true, email: true, address: true, taxId: true, website: true, customerContact: true, itemDescriptions: true,
  itemNumbers: true, taxLine: true, amountBox: true, notes: true, terms: true, paymentDetails: true, signatureDefault: false, hideBranding: false,
};

export type DocLayout = { w: number; h: number; pages: Prim[][] };

export type DocInput = {
  kind: DocKind;
  template: DocTemplate;
  accent: string;
  paper: PaperSize;
  draft: InvoiceDraft;
  business: BusinessProfile;
  customer: SalesCustomer;
  currency: string;
  formatDate: (ymd: string) => string;
  signature?: SignatureInk | null;
  /** A JPEG the PDF can embed; the same file is shown in the preview. */
  logo?: { uri: string; width: number; height: number } | null;
  options?: Partial<DocOptions>;
  /** Free text such as bank name and account number, printed when the "payment details" option is on. */
  paymentInstructions?: string;
};

const SYMBOLS: Record<string, string> = { USD: "$", GBP: "£", EUR: "€", JPY: "¥", CAD: "CA$", AUD: "A$", NZD: "NZ$", MXN: "MX$", HKD: "HK$", SGD: "S$" };
const ZERO_DECIMALS = new Set(["JPY", "KRW", "VND", "CLP", "ISK", "UGX", "XAF", "XOF"]);

/** Money exactly as the document prints it: the currency's symbol (or its code) and the person's chosen digit grouping. */
export function documentMoney(currency: string) {
  const code = (currency || "USD").toUpperCase();
  const symbol = SYMBOLS[code] ?? `${code} `;
  const digits = ZERO_DECIMALS.has(code) ? 0 : 2;
  return (amount: number) => {
    const body = formatNumberGrouped(Math.abs(amount), digits);
    return `${amount < 0 && Number(Math.abs(amount).toFixed(digits)) !== 0 ? "-" : ""}${symbol}${body}`;
  };
}

const INK = "#111827";
const MUTED = "#5B6470";
const HAIR = "#D9DDE3";
const ZEBRA = "#F5F6F8";

function tint(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(255 - (255 - c) * amount);
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => mix(c).toString(16).padStart(2, "0")).join("")}`;
}

function qty(n: number) {
  return String(Math.round(n * 1000) / 1000);
}

type Ctx = {
  input: DocInput;
  money: (n: number) => string;
  w: number;
  h: number;
  m: number;
  pages: Prim[][];
  cur: Prim[];
  y: number;
  limit: number;
};

function text(c: Ctx, x: number, y: number, w: number, s: string, size: number, o: { bold?: boolean; color?: string; align?: "left" | "right" | "center" } = {}) {
  c.cur.push({ t: "text", x, y, w, text: s, size, bold: o.bold, color: o.color ?? INK, align: o.align });
}

/** Writes wrapped lines and returns the height used. */
function paragraph(c: Ctx, x: number, y: number, w: number, s: string, size: number, o: { bold?: boolean; color?: string; max?: number; gap?: number } = {}) {
  const lines = wrapText(s, size, !!o.bold, w).slice(0, o.max ?? 99);
  const lh = size * 1.28 + (o.gap ?? 0);
  lines.forEach((line, i) => text(c, x, y + i * lh, w, line, size, o));
  return lines.length * lh;
}

function label(c: Ctx, x: number, y: number, w: number, s: string, align?: "left" | "right") {
  text(c, x, y, w, s.toUpperCase(), 7, { bold: true, color: MUTED, align });
}

export function buildDocument(input: DocInput): DocLayout {
  const { w, h } = PAPER[input.paper];
  const compact = input.template === "compact";
  const m = compact ? 34 : 40;
  const c: Ctx = { input, money: documentMoney(input.currency), w, h, m, pages: [], cur: [], y: 0, limit: h - (compact ? 52 : 62) };
  const isInvoice = input.kind === "INVOICE";
  const o: DocOptions = { ...DEFAULT_DOC_OPTIONS, ...input.options };
  const totals = calculateInvoiceTotals(input.draft);
  const cw = w - 2 * m;
  const accent = input.accent;
  const business = input.business;
  const customer = input.customer;

  // ---------- header ----------
  if (!compact) c.cur.push({ t: "rect", x: 0, y: 0, w, h: 10, fill: accent });
  let y = compact ? m - 6 : 36;
  const logoBox = compact ? 34 : 46;
  const logoSpace = o.logo ? logoBox + 12 : 0;
  if (!o.logo) {
    /* the person chose not to print a logo */
  } else if (input.logo) {
    const r = input.logo.width / input.logo.height;
    const lw = r >= 1 ? logoBox : logoBox * r, lh = r >= 1 ? logoBox / r : logoBox;
    c.cur.push({ t: "img", x: m, y, w: lw, h: lh, uri: input.logo.uri });
  } else {
    // No logo uploaded: leave the space empty (never our own mark). The preview draws a dashed "Your logo" hint here; the PDF stays blank.
    c.cur.push({ t: "hint", x: m, y, w: logoBox, h: logoBox, text: "Your logo" });
  }
  const nameX = m + logoSpace;
  const leftW = (compact ? cw * 0.58 : cw * 0.56) - logoSpace;
  const nameSize = (business.businessName || "").length > 28 ? 11.5 : compact ? 12 : 14;
  let hy = y + 1;
  hy += paragraph(c, nameX, hy, leftW, business.businessName || "Your business", nameSize, { bold: true, max: 2 });
  const contact = [o.email ? business.email : "", o.phone ? business.phone : ""].filter(Boolean).join("  ·  ");
  if (o.address && business.address) hy += paragraph(c, nameX, hy + 2, leftW, business.address, 8.5, { color: MUTED, max: 4 }) + 2;
  if (contact) hy += paragraph(c, nameX, hy + 1, leftW, contact, 8.5, { color: MUTED, max: 2 }) + 1;
  if (o.taxId && business.taxId) hy += paragraph(c, nameX, hy + 1, leftW, `Tax ID: ${business.taxId}`, 8.5, { color: MUTED, max: 1 });
  const rightX = m + cw * 0.58, rightW = cw * 0.42;
  const titleSize = compact ? 18 : 26;
  text(c, rightX, y - 2, rightW, input.kind, titleSize, { bold: true, color: accent, align: "right" });
  text(c, rightX, y + titleSize + 2, rightW, `# ${input.draft.invoiceNumber}`, compact ? 9.5 : 10.5, { bold: true, align: "right" });
  if (compact) c.cur.push({ t: "rect", x: rightX + rightW - 70, y: y + titleSize + 18, w: 70, h: 1.6, fill: accent });
  y = Math.max(hy, y + (o.logo ? logoBox : 0)) + (compact ? 14 : 20);

  // ---------- parties and key facts ----------
  const dueLabel = isInvoice ? "Due date" : "Valid until";
  const details: [string, string][] = [["Issue date", input.formatDate(input.draft.issueDate)], [dueLabel, input.formatDate(input.draft.dueDate)]];
  if (o.terms && input.draft.terms) details.push([isInvoice ? "Terms" : "Terms", input.draft.terms]);
  const billW = compact ? cw * 0.34 : cw * 0.36;
  const billLabel = isInvoice ? "Bill to" : "Prepared for";
  let by = y;
  label(c, m, by, billW, billLabel);
  by += 11;
  by += paragraph(c, m, by, billW, customer.name || "Customer", 11, { bold: true, max: 2 });
  if (customer.businessName && customer.businessName !== customer.name) by += paragraph(c, m, by, billW, customer.businessName, 9, { color: MUTED, max: 1 });
  if (customer.billingAddress) by += paragraph(c, m, by + 1, billW, customer.billingAddress, 8.5, { color: MUTED, max: 4 }) + 1;
  const reach = o.customerContact ? [customer.email, customer.phone].filter(Boolean).join("  ·  ") : "";
  if (reach) by += paragraph(c, m, by + 1, billW, reach, 8.5, { color: MUTED, max: 2 });

  const detX = m + cw * (compact ? 0.38 : 0.39), detW = cw * (compact ? 0.28 : 0.26);
  let dy = y;
  label(c, detX, dy, detW, "Details");
  dy += 12;
  details.forEach(([k, v]) => {
    text(c, detX, dy, detW * 0.5, k, 8.5, { color: MUTED });
    text(c, detX + detW * 0.45, dy, detW * 0.55, fitText(v, 8.5, true, detW * 0.55), 8.5, { bold: true, align: "right" });
    dy += 13;
  });

  if (!compact && !o.amountBox) {
    y = Math.max(by, dy) + 18;
  } else if (!compact) {
    const chipX = m + cw * 0.69, chipW = cw * 0.31, chipH = 62;
    c.cur.push({ t: "rect", x: chipX, y, w: chipW, h: chipH, fill: tint(accent, 0.1), stroke: tint(accent, 0.35), lw: 0.6 });
    label(c, chipX + 12, y + 10, chipW - 24, isInvoice ? "Amount due" : "Estimate total");
    const big = c.money(totals.total);
    const bigSize = textWidth(big, 18, true) > chipW - 24 ? 14 : 18;
    text(c, chipX + 12, y + 23, chipW - 24, big, bigSize, { bold: true, color: INK });
    text(c, chipX + 12, y + 46, chipW - 24, `${dueLabel}: ${input.formatDate(input.draft.dueDate)}`, 8, { color: MUTED });
    y = Math.max(by, dy, y + chipH) + 18;
  } else {
    const totX = m + cw * 0.7, totW = cw * 0.3;
    label(c, totX, y, totW, isInvoice ? "Amount due" : "Estimate total", "right");
    text(c, totX, y + 11, totW, c.money(totals.total), 14, { bold: true, color: accent, align: "right" });
    y = Math.max(by, dy, y + 30) + 14;
  }
  c.cur.push({ t: "line", x1: m, y1: y - 8, x2: m + cw, y2: y - 8, color: HAIR, lw: 0.6 });

  // ---------- table ----------
  const amtW = compact ? 74 : 82, rateW = compact ? 66 : 74, qtyW = compact ? 40 : 46, numW = compact || !o.itemNumbers ? 0 : 22;
  const descX = m + numW, descW = cw - numW - amtW - rateW - qtyW - 8;
  const qtyX = m + cw - amtW - rateW - qtyW, rateX = m + cw - amtW - rateW, amtX = m + cw - amtW;
  const tableHead = () => {
    if (compact) {
      text(c, descX, y, descW, "DESCRIPTION", 7.5, { bold: true, color: accent });
      text(c, qtyX, y, qtyW, "QTY", 7.5, { bold: true, color: accent, align: "right" });
      text(c, rateX, y, rateW, "RATE", 7.5, { bold: true, color: accent, align: "right" });
      text(c, amtX, y, amtW, "AMOUNT", 7.5, { bold: true, color: accent, align: "right" });
      c.cur.push({ t: "rect", x: m, y: y + 12, w: cw, h: 1, fill: accent });
      y += 18;
    } else {
      c.cur.push({ t: "rect", x: m, y, w: cw, h: 22, fill: accent });
      if (numW > 0) text(c, m + 6, y + 7, numW, "#", 8, { bold: true, color: "#FFFFFF" });
      text(c, descX, y + 7, descW, "DESCRIPTION", 8, { bold: true, color: "#FFFFFF" });
      text(c, qtyX, y + 7, qtyW, "QTY", 8, { bold: true, color: "#FFFFFF", align: "right" });
      text(c, rateX, y + 7, rateW, "RATE", 8, { bold: true, color: "#FFFFFF", align: "right" });
      text(c, amtX - 6, y + 7, amtW, "AMOUNT", 8, { bold: true, color: "#FFFFFF", align: "right" });
      y += 22;
    }
  };
  const footer = () => {
    const fy = h - (compact ? 34 : 40);
    c.cur.push({ t: "line", x1: m, y1: fy, x2: m + cw, y2: fy, color: HAIR, lw: 0.6 });
    text(c, m, fy + 7, cw * 0.5, fitText([business.businessName, o.website ? business.website : ""].filter(Boolean).join("  ·  ") || "", 7.5, false, cw * 0.5), 7.5, { color: MUTED });
    if (!o.hideBranding) text(c, m, fy + 18, cw * 0.5, "Created with Receipt Cycle", 6.5, { color: "#8A94A3" });
    text(c, m + cw * 0.5, fy + 7, cw * 0.5, `${input.draft.invoiceNumber}  ·  Page {{page}} of {{pages}}`, 7.5, { color: MUTED, align: "right" });
  };
  const newPage = () => {
    footer();
    c.pages.push(c.cur);
    c.cur = [];
    y = m;
    text(c, m, y, cw * 0.6, fitText(business.businessName || input.kind, 10, true, cw * 0.6), 10, { bold: true });
    text(c, m + cw * 0.6, y, cw * 0.4, `${input.kind} ${input.draft.invoiceNumber} · continued`, 8.5, { color: MUTED, align: "right" });
    y += 24;
    tableHead();
  };

  tableHead();
  const rowPad = compact ? 5 : 7;
  input.draft.items.forEach((item, index) => {
    const nameLines = wrapText(item.name, compact ? 8.5 : 9, true, descW - 4).slice(0, 3);
    const descLines = o.itemDescriptions && item.description ? wrapText(item.description, 7.8, false, descW - 4).slice(0, 3) : [];
    const rowH = rowPad * 2 + nameLines.length * (compact ? 11 : 12) + descLines.length * 10;
    if (y + rowH > c.limit) newPage();
    if (!compact && index % 2 === 1) c.cur.push({ t: "rect", x: m, y, w: cw, h: rowH, fill: ZEBRA });
    let ty = y + rowPad;
    if (numW > 0) text(c, m + 6, ty, numW, String(index + 1), 8.5, { color: MUTED });
    nameLines.forEach((line, i) => text(c, descX, ty + i * (compact ? 11 : 12), descW, line, compact ? 8.5 : 9, { bold: true }));
    ty += nameLines.length * (compact ? 11 : 12);
    descLines.forEach((line, i) => text(c, descX, ty + i * 10, descW, line, 7.8, { color: MUTED }));
    const sz = compact ? 8.5 : 9;
    text(c, qtyX, y + rowPad, qtyW, qty(item.quantity), sz, { align: "right" });
    text(c, rateX, y + rowPad, rateW, c.money(item.rate), sz, { align: "right" });
    text(c, amtX - (compact ? 0 : 6), y + rowPad, amtW, c.money(item.quantity * item.rate), sz, { bold: true, align: "right" });
    y += rowH;
    c.cur.push({ t: "line", x1: m, y1: y, x2: m + cw, y2: y, color: HAIR, lw: 0.4 });
  });
  if (!input.draft.items.length) { text(c, descX, y + 10, descW, "No line items", 9, { color: MUTED }); y += 30; }
  c.cur.push({ t: "line", x1: m, y1: y, x2: m + cw, y2: y, color: accent, lw: compact ? 0.8 : 1 });
  y += 16;

  // ---------- totals + notes (kept together) ----------
  const rows: [string, string][] = [["Subtotal", c.money(totals.subtotal)]];
  if (totals.discountAmount > 0) rows.push([`Discount${input.draft.discountType === "percentage" ? ` (${qty(input.draft.discountValue)}%)` : ""}`, `-${c.money(totals.discountAmount)}`]);
  if (o.taxLine && input.draft.taxRate > 0) rows.push([`${input.draft.taxLabel || "Tax"} (${qty(input.draft.taxRate)}%)`, c.money(totals.taxAmount)]);
  if (input.draft.shipping > 0) rows.push(["Shipping", c.money(input.draft.shipping)]);
  const totBoxW = cw * (compact ? 0.46 : 0.42), totX = m + cw - totBoxW;
  const noteW = cw - totBoxW - 24;
  const noteLines = o.notes && input.draft.notes ? wrapText(input.draft.notes, 8, false, noteW) : [];
  const needTotals = rows.length * 17 + (compact ? 34 : 40) + 6;
  const needNotes = noteLines.length ? 14 + Math.min(noteLines.length, 8) * 10.5 : 0;
  const needSign = input.draft.signatureEnabled || !isInvoice ? 96 : 0;
  if (y + Math.max(needTotals, needNotes) > c.limit) newPage(), y -= 4;
  const topY = y;
  rows.forEach(([k, v], i) => {
    text(c, totX, y + i * 17, totBoxW * 0.55, k, 9, { color: MUTED });
    text(c, totX + totBoxW * 0.4, y + i * 17, totBoxW * 0.6, v, 9, { bold: true, align: "right" });
  });
  y += rows.length * 17 + 4;
  if (compact) {
    c.cur.push({ t: "rect", x: totX, y, w: totBoxW, h: 1.2, fill: accent });
    text(c, totX, y + 8, totBoxW * 0.5, isInvoice ? "Total due" : "Estimate total", 10.5, { bold: true });
    text(c, totX + totBoxW * 0.4, y + 8, totBoxW * 0.6, c.money(totals.total), 11.5, { bold: true, color: accent, align: "right" });
    y += 30;
  } else {
    c.cur.push({ t: "rect", x: totX, y, w: totBoxW, h: 32, fill: accent });
    text(c, totX + 10, y + 11, totBoxW * 0.45, isInvoice ? "BALANCE DUE" : "ESTIMATE TOTAL", 8.5, { bold: true, color: "#FFFFFF" });
    text(c, totX + totBoxW * 0.3, y + 9, totBoxW * 0.7 - 10, c.money(totals.total), 13.5, { bold: true, color: "#FFFFFF", align: "right" });
    y += 40;
  }
  let ny = topY;
  if (noteLines.length) {
    label(c, m, ny, noteW, "Notes");
    noteLines.slice(0, 8).forEach((line, i) => text(c, m, ny + 12 + i * 10.5, noteW, line, 8, { color: "#374151" }));
    ny += needNotes;
  }
  const payLines = o.paymentDetails && input.paymentInstructions?.trim() ? wrapText(input.paymentInstructions, 8, false, noteW).slice(0, 7) : [];
  if (payLines.length) {
    label(c, m, ny, noteW, "Payment details");
    payLines.forEach((line, i) => text(c, m, ny + 12 + i * 10.5, noteW, line, 8, { color: "#374151" }));
    ny += 14 + payLines.length * 10.5;
  }
  y = Math.max(y, ny) + 8;

  // ---------- terms / acceptance / signature ----------
  if (!isInvoice) {
    if (y + 74 > c.limit) newPage();
    c.cur.push({ t: "rect", x: m, y, w: cw, h: 66, stroke: HAIR, lw: 0.8 });
    text(c, m + 12, y + 9, cw - 24, `To accept this estimate, sign and return it by ${input.formatDate(input.draft.dueDate)}.`, 8.5, { bold: true });
    const colW = (cw - 24 - 24) / 3;
    ["Name", "Signature", "Date"].forEach((k, i) => {
      const x = m + 12 + i * (colW + 12);
      c.cur.push({ t: "line", x1: x, y1: y + 50, x2: x + colW, y2: y + 50, color: "#9CA3AF", lw: 0.6 });
      text(c, x, y + 53, colW, k, 7, { color: MUTED });
    });
    y += 78;
  }
  if (input.draft.signatureEnabled) {
    if (y + 70 > c.limit) newPage();
    const sx = m + cw - 190;
    if (input.signature && input.signature.strokes.length) {
      const ih = 40, iw = Math.min(170, ih * input.signature.aspect);
      c.cur.push({ t: "ink", x: sx, y, w: iw, h: ih, ink: input.signature, color: INK });
    }
    c.cur.push({ t: "line", x1: sx, y1: y + 46, x2: sx + 190, y2: y + 46, color: "#9CA3AF", lw: 0.6 });
    text(c, sx, y + 50, 190, input.draft.signatureText ? fitText(input.draft.signatureText, 8.5, true, 190) : "Authorised signature", 8.5, { bold: !!input.draft.signatureText, color: input.draft.signatureText ? INK : MUTED });
    y += 68;
  }
  void needSign;
  if (o.terms && input.draft.terms && isInvoice && y + 26 <= c.limit) {
    label(c, m, y, cw, "Payment terms");
    text(c, m, y + 11, cw, `${input.draft.terms}. Please quote ${input.draft.invoiceNumber} with your payment.`, 8, { color: "#374151" });
  }

  footer();
  c.pages.push(c.cur);
  const total = c.pages.length;
  c.pages.forEach((page, index) => page.forEach((p) => {
    if (p.t === "text" && p.text.includes("{{")) p.text = p.text.replace("{{page}}", String(index + 1)).replace("{{pages}}", String(total));
  }));
  return { w, h, pages: c.pages };
}
