import { describe, expect, it } from "vitest";
import { ACCENTS, buildDocument, type DocKind, type DocLayout, type Prim } from "../../../apps/mobile/src/features/documents/layout";
import { makeDocInput } from "../../../apps/mobile/src/features/documents/input";
import { textWidth } from "../../../apps/mobile/src/features/documents/fonts";
import { renderPdf } from "../../../apps/mobile/src/features/documents/pdfBytes";
import { resolveDocumentStyle } from "../../../apps/mobile/src/features/documents/styleStore";
import type { InvoiceSettings } from "../../../apps/mobile/src/features/sales/setupData";
import { calculateInvoiceTotals } from "../../../apps/mobile/src/features/invoices/model";
import { layoutToSvgPages } from "./svg";
import { createEstimateDraft } from "../../../apps/mobile/src/features/estimates/model";
import { createInvoiceDraft } from "../../../apps/mobile/src/features/invoices/model";
import { renderPublicDocumentPage } from "../../../workers/api/src/routes/publicDocumentPage";

/**
 * End to end: for a matrix of saved settings, build the document through the SAME functions the phone's share
 * button (createInvoicePdf) and the web preview/print call, render the real PDF bytes and check them.
 */

const base: InvoiceSettings = { currency: "USD", dateFormat: "YYYY-MM-DD", invoicePrefix: "INV", defaultTaxRate: "7.5%", taxLabel: "VAT", paymentTerms: "Net 30", defaultNotes: "Thank you", paymentInstructions: "Bank X acct 12345" };
const business: any = { businessName: "Acme Studio", email: "hello@acme.test", phone: "+1 555 0100", address: "1 Main Street", taxId: "TX-77", website: "acme.test", logoUri: null, signature: { strokes: [[[0, 0.5], [0.5, 0], [1, 0.5]]], aspect: 3 } };
const customer: any = { id: "c1", name: "Jane Buyer", businessName: "Buyer Ltd", email: "jane@buyer.test", phone: "+1 555 0199", billingAddress: "2 Side Road", taxId: "", notes: "", status: "active", createdAt: "2026-01-01" };
const draft: any = {
  invoiceNumber: "INV-2026-001", title: "Spring campaign", issueDate: "2026-10-01", dueDate: "2026-10-31", customerId: "c1",
  items: [
    { id: "1", name: "Design work", description: "Logo and guide", quantity: 2, rate: 150 },
    { id: "2", name: "Hosting", description: "12 months", quantity: 12, rate: 25 },
  ],
  discountType: "percentage", discountValue: 10, taxRate: 7.5, taxLabel: "VAT", shipping: 15, notes: "Pay by bank transfer please", terms: "Net 30",
  signatureEnabled: true, signatureText: "A. Owner",
};

/** The same call chain as createInvoicePdf (phone) and buildDocInput (web): resolve style, makeDocInput, buildDocument, renderPdf. */
function make(settings: InvoiceSettings, kind: DocKind = "INVOICE", over: Record<string, unknown> = {}, biz: any = business) {
  const style = resolveDocumentStyle(kind, settings, (d) => d);
  const input = makeDocInput({ kind, draft: { ...draft, ...over } as any, business: biz, customer, currency: settings.currency || "USD", style, logo: null });
  const layout = buildDocument(input);
  const bytes = renderPdf(layout, null);
  return { input, layout, bytes, pdf: new TextDecoder("latin1").decode(bytes) };
}

const texts = (layout: DocLayout) => layout.pages.flat().filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text");
const all = (layout: DocLayout) => texts(layout).map((t) => t.text).join("\n");
const rg = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => (v / 255).toFixed(3);
  return `${f((n >> 16) & 255)} ${f((n >> 8) & 255)} ${f(n & 255)} rg`;
};

/** Geometry audit: nothing wider than its box, nothing off the page, no two pieces of text on top of each other. */
function audit(layout: DocLayout) {
  const problems: string[] = [];
  layout.pages.forEach((page, pi) => {
    const boxes: { x0: number; x1: number; y0: number; y1: number; text: string }[] = [];
    for (const p of page) {
      if (p.t !== "text" || !p.text) continue;
      const w = textWidth(p.text, p.size, !!p.bold);
      if (w > p.w + 0.6) problems.push(`p${pi + 1} too wide (${w.toFixed(1)} > ${p.w.toFixed(1)}): ${p.text}`);
      const x0 = p.align === "right" ? p.x + p.w - w : p.align === "center" ? p.x + (p.w - w) / 2 : p.x;
      if (x0 < -0.5 || x0 + w > layout.w + 0.5) problems.push(`p${pi + 1} off page horizontally: ${p.text}`);
      if (p.y < 0 || p.y + p.size > layout.h) problems.push(`p${pi + 1} off page vertically: ${p.text}`);
      boxes.push({ x0, x1: x0 + w, y0: p.y + p.size * 0.1, y1: p.y + p.size * 0.95, text: p.text });
    }
    for (let i = 0; i < boxes.length; i += 1) for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i], b = boxes[j];
      if (a.x0 < b.x1 - 0.5 && b.x0 < a.x1 - 0.5 && a.y0 < b.y1 - 0.5 && b.y0 < a.y1 - 0.5) problems.push(`p${pi + 1} overlap: "${a.text}" with "${b.text}"`);
    }
  });
  return problems;
}

const TEMPLATES = ["standard", "compact"] as const;
const PAPERS = ["a4", "letter"] as const;
const KINDS: DocKind[] = ["INVOICE", "ESTIMATE"];
const COLORS = [ACCENTS[0].hex, ACCENTS[4].hex, ACCENTS[7].hex];

function styled(kind: DocKind, template: string, accent: string, paper: string, docOptions: Record<string, boolean> = {}): InvoiceSettings {
  return { ...base, paperSize: paper as never, ...(kind === "INVOICE" ? { invoiceTemplate: template as never, invoiceColor: accent } : { estimateTemplate: template as never, estimateColor: accent }), docOptions: { [kind]: docOptions } };
}

describe("matrix: template x colour x paper x kind", () => {
  for (const kind of KINDS) for (const template of TEMPLATES) for (const paper of PAPERS) for (const color of COLORS) {
    it(`${kind} ${template} ${paper} ${color}`, () => {
      const out = make(styled(kind, template, color, paper), kind);
      expect(out.input.template).toBe(template);
      expect(out.input.accent).toBe(color);
      expect(out.pdf).toContain(rg(color));
      expect(out.pdf).toContain(paper === "a4" ? "/MediaBox [0 0 595 842]" : "/MediaBox [0 0 612 792]");
      expect(out.layout.w).toBe(paper === "a4" ? 595 : 612);
      expect(out.pdf).toContain(kind === "INVOICE" ? "(INVOICE)" : "(ESTIMATE)");
      // Standard has the coloured band across the top of the page; Compact never does
      const band = out.layout.pages[0].some((p) => p.t === "rect" && p.y === 0 && p.h === 10 && p.fill === color);
      expect(band).toBe(template === "standard");
      // the web draws the same pages the PDF has
      expect(layoutToSvgPages(out.layout)).toHaveLength(out.layout.pages.length);
      expect(audit(out.layout)).toEqual([]);
    });
  }
});

/** Every switch: what it controls must be present when on and absent when off, on both layouts and both kinds. */
const TOGGLES: { key: string; needles: string[]; exact?: boolean }[] = [
  { key: "phone", needles: ["+1 555 0100"] },
  { key: "email", needles: ["hello@acme.test"] },
  { key: "address", needles: ["1 Main Street"] },
  { key: "taxId", needles: ["TX-77"] },
  { key: "website", needles: ["Acme Studio · acme.test"] },
  { key: "customerContact", needles: ["jane@buyer.test", "+1 555 0199"] },
  { key: "itemDescriptions", needles: ["Logo and guide", "12 months"] },
  { key: "itemNumbers", needles: ["#"], exact: true },
  { key: "taxLine", needles: ["VAT (7.5%)"] },
  { key: "notes", needles: ["Pay by bank transfer please"] },
  { key: "terms", needles: ["Net 30"] },
  { key: "paymentDetails", needles: ["Bank X acct 12345"] },
  { key: "hideBranding", needles: ["Created with Receipt Cycle"] },
];
describe("every switch is honoured", () => {
  for (const kind of KINDS) for (const template of TEMPLATES) {
    it(`${kind} ${template} amountBox`, () => {
      const count = (on: boolean) => {
        const out = make(styled(kind, template, ACCENTS[0].hex, "a4", { amountBox: on }), kind);
        const total = calculateInvoiceTotals(out.input.draft);
        const money = `$${total.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
        return texts(out.layout).filter((x) => x.text === money).length;
      };
      expect(count(true)).toBe(count(false) + 1);
    });
  }
  for (const kind of KINDS) for (const template of TEMPLATES) for (const t of TOGGLES) {
    it(`${kind} ${template} ${t.key}`, () => {
      const inverted = t.key === "hideBranding";
      const on = make(styled(kind, template, ACCENTS[0].hex, "a4", { [t.key]: !inverted }), kind);
      const off = make(styled(kind, template, ACCENTS[0].hex, "a4", { [t.key]: inverted }), kind);
      const lines = (l: DocLayout) => texts(l).map((x) => x.text);
      const has = (l: DocLayout, n: string) => (t.exact ? lines(l).includes(n) : all(l).includes(n));
      expect(t.needles.some((n) => has(on.layout, n)), `${t.key} on`).toBe(true);
      expect(t.needles.filter((n) => has(off.layout, n)), `${t.key} off`).toEqual([]);
    });
  }
});

const squash = (v: string) => v.replace(/\s+/g, "");
const LONG = "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ";

describe("long values are never cut off", () => {
  const items = Array.from({ length: 70 }, (_, i) => ({
    id: String(i), name: i % 5 === 0 ? `Extraordinarily long line item name number ${i} that keeps going and going with Supercalifragilisticexpialidocious${i}` : `Item ${i}`,
    description: i % 3 === 0 ? `${LONG}${LONG}${i}` : "", quantity: i % 4 === 0 ? 1234.5 : 3, rate: i === 7 ? 1234567.89 : 12.5 * (i + 1),
  }));
  const longBiz = { ...business, businessName: "The Extraordinarily Long Named Consulting and Design Studio of Greater Metropolitan Area Ltd", address: `${LONG}
${LONG}
Line three
Line four
Line five
Line six`, website: "https://www.a-very-long-website-address-for-testing.example.com/path" };
  const longCustomer = { ...customer, name: "Customer With An Exceedingly Long Name That Wraps", billingAddress: `${LONG}
${LONG}
5
6
7` };
  const stress = { items, notes: LONG.repeat(30), terms: "Payment due within fourteen days of the invoice date, late fees apply after that", taxLabel: "Value Added Tax Standard Rate", shipping: 99999999.5, discountType: "fixed", discountValue: 1234567.89 };
  for (const kind of KINDS) for (const template of TEMPLATES) for (const paper of PAPERS) {
    it(`${kind} ${template} ${paper}`, () => {
      const settings = { ...styled(kind, template, ACCENTS[1].hex, paper), paymentInstructions: LONG.repeat(6) };
      const style = resolveDocumentStyle(kind, settings, (d) => d);
      const input = makeDocInput({ kind, draft: { ...draft, ...stress } as any, business: longBiz, customer: longCustomer, currency: "USD", style, logo: null });
      const layout = buildDocument(input);
      expect(layout.pages.length).toBeGreaterThan(1);
      expect(audit(layout)).toEqual([]);
      const flat = squash(all(layout));
      // text that flows across a sheet break has the repeated page header and footer in the middle: take those out for the flow checks
      const literals = [squash(longBiz.businessName), squash(`·${longBiz.website}`), "CreatedwithReceiptCycle", `${kind}INV-2026-001·continued`, "#DESCRIPTIONQTYRATEAMOUNT"];
      let flowText = flat.replace(/INV-2026-001·Page\d+of\d+/g, "");
      for (const lit of literals) flowText = flowText.split(lit).join("");
      for (const it of items) {
        expect(flat, it.name).toContain(squash(it.name));
        if (it.description) expect(flat, `desc ${it.id}`).toContain(squash(it.description));
      }
      expect(flowText).toContain(squash(stress.notes));
      expect(flowText).toContain(squash(settings.paymentInstructions));
      expect(flat).toContain(squash(longBiz.businessName));
      expect(flat).toContain(squash(longBiz.address));
      expect(flat).toContain(squash(longCustomer.billingAddress));
      expect(flat).toContain(squash(stress.terms));
      expect(flat).toContain("$1,234,567.89");
      expect(flat).toContain(squash(stress.taxLabel));
      // page numbers and the continued header are present on every page
      layout.pages.forEach((_, i) => expect(all({ ...layout, pages: [layout.pages[i]] })).toContain(`Page ${i + 1} of ${layout.pages.length}`));
    });
  }

  it("keeps a huge total inside its box", () => {
    for (const template of TEMPLATES) {
      const out = make(styled("INVOICE", template, ACCENTS[0].hex, "a4"), "INVOICE", { items: [{ id: "1", name: "Big", description: "", quantity: 1, rate: 987654321.12 }], shipping: 0, discountValue: 0, taxRate: 0 });
      expect(audit(out.layout)).toEqual([]);
      expect(all(out.layout)).toContain("$987,654,321.12");
    }
  });
});

describe("the public link page is the same document", () => {
  const record = { ...draft, items: draft.items, customerId: "c1", customerName: "Jane Buyer" };
  const snapshot = (settings: Record<string, unknown>) => ({ document: record, business: { ...business, name: undefined }, settings: { ...base, ...settings }, customer });

  it("uses the saved layout, colour and paper, not a fixed look", () => {
    const html = renderPublicDocumentPage("invoice", snapshot({ invoiceTemplate: "compact", invoiceColor: ACCENTS[4].hex, paperSize: "letter" }), "INV-2026-001");
    expect(html).toContain(ACCENTS[4].hex);
    expect(html).toContain("size:612pt 792pt");
    expect(html).not.toContain("BALANCE DUE");
    expect(html).toContain("Total due");
    expect(html).not.toContain(ACCENTS[0].hex);
    const std = renderPublicDocumentPage("invoice", snapshot({ invoiceTemplate: "standard", invoiceColor: ACCENTS[1].hex }), "INV-2026-001");
    expect(std).toContain("BALANCE DUE");
    expect(std).toContain("size:595pt 842pt");
  });

  it("is drawn from the same layout the PDF has, page for page", () => {
    const settings = { invoiceTemplate: "compact", invoiceColor: ACCENTS[2].hex, paperSize: "a4", docOptions: { INVOICE: { phone: false, notes: false } } };
    const html = renderPublicDocumentPage("invoice", snapshot(settings), "INV-2026-001");
    const local = make(settings as InvoiceSettings, "INVOICE");
    for (const t of texts(local.layout)) expect(html).toContain(t.text.replace(/&/g, "&amp;"));
    expect(html).not.toContain("+1 555 0100");
    expect(html).not.toContain("Pay by bank transfer please");
    expect((html.match(/<section class="sheet">/g) ?? []).length).toBe(local.layout.pages.length);
  });

  it("estimates use the estimate style", () => {
    const est = { ...record, estimateNumber: "EST-2026-001", estimateDate: "2026-10-01", validUntil: "2026-10-31", terms: "Net 30", customerSignatureEnabled: true };
    const html = renderPublicDocumentPage("estimate", { ...snapshot({ estimateTemplate: "compact", estimateColor: ACCENTS[3].hex, invoiceColor: ACCENTS[0].hex }), document: est }, "EST-2026-001");
    expect(html).toContain(ACCENTS[3].hex);
    expect(html).toContain("ESTIMATE");
    expect(html).toContain("EST-2026-001");
  });
});

describe("Invoice Settings reach new documents", () => {
  const settings: InvoiceSettings = { ...base, invoicePrefix: "ACME", defaultTaxRate: "12.5%", taxLabel: "GST", paymentTerms: "Net 15", defaultNotes: "Bank details on request" };
  it("an invoice draft carries prefix, tax, label, terms and notes into the printed document", () => {
    const d = createInvoiceDraft(settings, []);
    expect(d.invoiceNumber.startsWith("ACME")).toBe(true);
    const style = resolveDocumentStyle("INVOICE", settings, (x) => x);
    const layout = buildDocument(makeDocInput({ kind: "INVOICE", draft: { ...d, items: draft.items }, business, customer, currency: "USD", style, logo: null }));
    const printed = all(layout);
    for (const needle of ["GST (12.5%)", "Net 15", "Bank details on request", d.invoiceNumber]) expect(printed, needle).toContain(needle);
  });
  it("an estimate draft uses the saved default notes too", () => {
    expect(createEstimateDraft(settings, []).notes).toBe("Bank details on request");
    expect(createEstimateDraft({ ...settings, defaultNotes: "" }, []).notes).toBe("Thank you for your consideration!");
  });
});
