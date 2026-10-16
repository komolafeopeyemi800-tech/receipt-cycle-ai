import { describe, expect, it } from "vitest";
import { buildDocument, ACCENTS, DEFAULT_DOC_OPTIONS, type DocInput } from "../../../apps/mobile/src/features/documents/layout";
import { makeDocInput } from "../../../apps/mobile/src/features/documents/input";
import { renderPdf } from "../../../apps/mobile/src/features/documents/pdfBytes";
import { resolveDocumentStyle } from "../../../apps/mobile/src/features/documents/styleStore";
import type { InvoiceSettings } from "../../../apps/mobile/src/features/sales/setupData";

/** What a person shares must be exactly the style they saved: these tests read the real PDF bytes. */

const settingsBase: InvoiceSettings = { currency: "USD", dateFormat: "YYYY-MM-DD", invoicePrefix: "INV", defaultTaxRate: "7.5%", taxLabel: "VAT", paymentTerms: "Net 30", defaultNotes: "Thank you" };
const draft: any = {
  invoiceNumber: "INV-2026-001", issueDate: "2026-10-01", dueDate: "2026-10-31", customerId: "c1",
  items: [{ id: "1", name: "Design work", description: "Logo and guide", quantity: 2, rate: 150 }],
  discountType: "percentage", discountValue: 0, taxRate: 7.5, taxLabel: "VAT", shipping: 0, notes: "Pay by bank transfer please", terms: "Net 30",
  signatureEnabled: true, signatureText: "A. Owner",
};
const business: any = { businessName: "Acme Studio", email: "hello@acme.test", phone: "+1 555 0100", address: "1 Main Street", taxId: "TX-77", website: "acme.test", logoUri: null, signature: { strokes: [[[0, 0.5], [0.5, 0], [1, 0.5]]], aspect: 3 } };
const customer: any = { id: "c1", name: "Jane Buyer", businessName: "", email: "jane@buyer.test", phone: "+1 555 0199", billingAddress: "2 Side Road", taxId: "", notes: "", status: "active", createdAt: "2026-01-01" };

function pdfFor(settings: InvoiceSettings, kind: "INVOICE" | "ESTIMATE" = "INVOICE") {
  const style = resolveDocumentStyle(kind, settings, (d) => d);
  const input = makeDocInput({ kind, draft, business, customer, currency: "USD", style, logo: null });
  const layout = buildDocument(input);
  const bytes = renderPdf(layout, null);
  return { text: new TextDecoder("latin1").decode(bytes), input, layout, bytes };
}

const rg = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => (v / 255).toFixed(3);
  return `${f((n >> 16) & 255)} ${f((n >> 8) & 255)} ${f(n & 255)} rg`;
};

describe("the PDF is the style the person saved", () => {
  it("Standard and Compact give different documents, and the saved choice is the one produced", () => {
    const standard = pdfFor({ ...settingsBase, invoiceTemplate: "standard" });
    const compact = pdfFor({ ...settingsBase, invoiceTemplate: "compact" });
    expect(standard.input.template).toBe("standard");
    expect(compact.input.template).toBe("compact");
    expect(standard.text).not.toBe(compact.text);
    expect(standard.text).toContain("BALANCE DUE"); // the Standard totals bar
    expect(compact.text).not.toContain("BALANCE DUE");
    expect(compact.text).toContain("Total due"); // the Compact total line
  });

  it("uses the chosen colour in the PDF and nothing from another palette", () => {
    for (const a of ACCENTS) {
      const out = pdfFor({ ...settingsBase, invoiceColor: a.hex });
      expect(out.text).toContain(rg(a.hex));
      for (const other of ACCENTS.filter((x) => x.hex !== a.hex)) expect(out.text).not.toContain(rg(other.hex));
    }
  });

  it("keeps invoices and estimates independent: each document kind follows its own saved style", () => {
    const settings: InvoiceSettings = { ...settingsBase, invoiceTemplate: "standard", invoiceColor: ACCENTS[1].hex, estimateTemplate: "compact", estimateColor: ACCENTS[3].hex };
    const inv = pdfFor(settings, "INVOICE");
    const est = pdfFor(settings, "ESTIMATE");
    expect(inv.input.template).toBe("standard");
    expect(inv.input.accent).toBe(ACCENTS[1].hex);
    expect(est.input.template).toBe("compact");
    expect(est.input.accent).toBe(ACCENTS[3].hex);
    expect(inv.text).toContain("INVOICE");
    expect(est.text).toContain("ESTIMATE");
  });

  it("honours paper size", () => {
    expect(pdfFor({ ...settingsBase, paperSize: "letter" }).text).toContain("/MediaBox [0 0 612 792]");
    expect(pdfFor({ ...settingsBase, paperSize: "a4" }).text).toContain("/MediaBox [0 0 595 842]");
  });

  it("prints exactly what is switched on and nothing that is switched off", () => {
    const all = pdfFor({ ...settingsBase, paymentInstructions: "Bank X acct 12345" });
    for (const needle of ["hello@acme.test", "+1 555 0100", "1 Main Street", "TX-77", "acme.test", "jane@buyer.test", "Logo and guide", "VAT", "Pay by bank transfer please", "Net 30", "Bank X acct 12345", "Created with Receipt Cycle"]) {
      expect(all.text, needle).toContain(needle);
    }
    const off = pdfFor({
      ...settingsBase,
      paymentInstructions: "Bank X acct 12345",
      docOptions: { INVOICE: { phone: false, email: false, address: false, taxId: false, website: false, customerContact: false, itemDescriptions: false, taxLine: false, notes: false, terms: false, paymentDetails: false, hideBranding: true } },
    });
    for (const needle of ["hello@acme.test", "+1 555 0100", "1 Main Street", "TX-77", "jane@buyer.test", "Logo and guide", "(VAT", "Pay by bank transfer please", "Bank X acct 12345", "Created with Receipt Cycle"]) {
      expect(off.text, needle).not.toContain(needle);
    }
  });

  it("draws the saved signature and never our own logo or tagline", () => {
    const out = pdfFor(settingsBase);
    expect(out.layout.pages.flat().some((p) => p.t === "ink")).toBe(true);
    expect(out.text).not.toMatch(/Brighter Tomorrow|Simple Financial Tools/i);
    expect(out.layout.pages.flat().some((p) => p.t === "img")).toBe(false); // no logo uploaded: nothing printed in its place
  });

  it("is deterministic: the same document and settings always give the same bytes", () => {
    const a = pdfFor({ ...settingsBase, invoiceTemplate: "compact", invoiceColor: ACCENTS[2].hex });
    const b = pdfFor({ ...settingsBase, invoiceTemplate: "compact", invoiceColor: ACCENTS[2].hex });
    expect(a.text).toBe(b.text);
  });

  it("the preview and the PDF come from the same input", () => {
    const style = resolveDocumentStyle("INVOICE", { ...settingsBase, invoiceTemplate: "compact", invoiceColor: ACCENTS[4].hex }, (d) => d);
    const forPreview: DocInput = makeDocInput({ kind: "INVOICE", draft, business, customer, currency: "USD", style, logo: null });
    const forPdf: DocInput = makeDocInput({ kind: "INVOICE", draft, business, customer, currency: "USD", style, logo: null });
    expect(buildDocument(forPreview)).toEqual(buildDocument(forPdf));
  });

  it("unknown or missing settings fall back to the documented defaults, never to something else", () => {
    const style = resolveDocumentStyle("INVOICE", { ...settingsBase, invoiceColor: "#123456", invoiceTemplate: "weird" as never }, (d) => d);
    expect(style.template).toBe("standard");
    expect(style.accent).toBe(ACCENTS[0].hex);
    expect(style.options).toEqual(DEFAULT_DOC_OPTIONS);
  });
});
