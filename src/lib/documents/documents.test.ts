import { afterEach, describe, expect, it } from "vitest";
import { setActiveNumberFormat } from "@mobile-lib/preferences";
import { calculateInvoiceTotals } from "../../../apps/mobile/src/features/invoices/model";
import {
  documentBreakdown,
  documentTotal,
  type BusinessProfile,
  type DesktopCustomer,
  type DesktopInvoice,
  type DesktopEstimate,
  type InvoicePreferences,
} from "@/contexts/DesktopBusinessContext";
import { buildDocInput, buildWebDocument, invoiceAsDraft, estimateAsDraft } from "./build";
import { layoutToPrintHtml, layoutToSvgPages } from "./svg";
import { businessFromShared, businessToShared, prefsFromShared, prefsToShared } from "@/lib/salesAdapters";
import { strokesToInk } from "@/components/documents/SignaturePad";
import { businessDomain, customerAvatarSources } from "@/components/workspace/CustomerAvatar";

afterEach(() => setActiveNumberFormat("standard"));

const prefs: InvoicePreferences = { currency: "USD", dateFormat: "MM/DD/YYYY", prefix: "INV", taxRate: 7.5, taxLabel: "VAT", paymentTerms: "Net 30", notes: "Thanks", accent: "#0f766e" };
const business: BusinessProfile = { name: "Acme Studio", email: "hi@acme.test", phone: "+1 555", address: "1 Main St", taxId: "TX-9", website: "acme.test" };
const customers: DesktopCustomer[] = [{ id: "c1", name: "Jane", company: "Jane Ltd", email: "jane@jane.test", phone: "123", address: "2 Side St", status: "active", notes: "" }];
const invoice: DesktopInvoice = {
  id: "i1", number: "INV-0001", customerId: "c1", issueDate: "2026-03-01", dueDate: "2026-03-31", status: "sent",
  items: [{ id: "l1", name: "Design work", description: "Logo", quantity: 2, rate: 1234567.89 }], discountPct: 0, taxPct: 7.5, paidAmount: 0, notes: "Pay soon",
};
const ctx = { customers, business, prefs, currency: "USD", formatDate: (d: string) => d };
const texts = (layout: ReturnType<typeof buildWebDocument>) => layout.pages.flat().filter((p) => p.t === "text").map((p: any) => p.text as string);

describe("web documents use the phone's layout engine", () => {
  it("defaults to Standard, Teal and A4 and never prints our own brand on the document", () => {
    const layout = buildWebDocument("INVOICE", invoice, ctx);
    expect(layout.w).toBe(595);
    expect(layout.h).toBe(842);
    const all = texts(layout).join("|");
    expect(all).toContain("Acme Studio");
    expect(all).not.toContain("Simple financial tools");
    // no logo uploaded: an on-screen-only hint, never an image
    const prims = layout.pages.flat();
    expect(prims.some((p) => p.t === "hint")).toBe(true);
    expect(prims.some((p) => p.t === "img")).toBe(false);
    // the "Created with Receipt Cycle" footer line is only a switchable footer line
    expect(all).toContain("Created with Receipt Cycle");
    const hidden = buildWebDocument("INVOICE", invoice, { ...ctx, prefs: { ...prefs, docOptions: { INVOICE: { hideBranding: true } } } });
    expect(texts(hidden).join("|")).not.toContain("Created with Receipt Cycle");
  });

  it("honours template, colour, paper size and the what-to-show switches from the shared settings", () => {
    const styled: InvoicePreferences = {
      ...prefs, invoiceTemplate: "compact", invoiceColor: "#7A1F2E", paperSize: "letter", paymentInstructions: "Bank: Test Bank 123",
      docOptions: { INVOICE: { phone: false, email: false, taxId: false, itemNumbers: false, logo: false } },
    };
    const input = buildDocInput("INVOICE", invoice, { ...ctx, prefs: styled });
    expect(input.template).toBe("compact");
    expect(input.accent).toBe("#7A1F2E");
    expect(input.paper).toBe("letter");
    const layout = buildWebDocument("INVOICE", invoice, { ...ctx, prefs: styled });
    expect(layout.w).toBe(612);
    const all = texts(layout).join("|");
    expect(all).not.toContain("+1 555");
    expect(all).not.toContain("hi@acme.test");
    expect(all).not.toContain("TX-9");
    expect(all).toContain("Bank: Test Bank 123");
    expect(layout.pages.flat().some((p) => p.t === "hint")).toBe(false); // logo switched off
  });

  it("estimates use the estimate style, not the invoice one", () => {
    const estimate: DesktopEstimate = { id: "e1", number: "EST-0001", customerId: "c1", issueDate: "2026-03-01", validUntil: "2026-03-31", status: "sent", items: invoice.items, discountPct: 0, taxPct: 0, terms: "Valid for 30 days, delivery in two weeks, 50% upfront" };
    const styled: InvoicePreferences = { ...prefs, invoiceTemplate: "compact", estimateTemplate: "standard", estimateColor: "#1F3A5F" };
    const input = buildDocInput("ESTIMATE", estimate, { ...ctx, prefs: styled });
    expect(input.template).toBe("standard");
    expect(input.accent).toBe("#1F3A5F");
    expect(estimateAsDraft(estimate, prefs).notes).toContain("50% upfront"); // free text prints as notes
    expect(estimateAsDraft({ ...estimate, terms: "Net 30" }, prefs).terms).toBe("Net 30");
  });

  it("prints money in the chosen number format", () => {
    setActiveNumberFormat("indian");
    const layout = buildWebDocument("INVOICE", invoice, ctx);
    expect(texts(layout).some((t) => t.includes("12,34,567.89"))).toBe(true);
    setActiveNumberFormat("european");
    expect(texts(buildWebDocument("INVOICE", invoice, ctx)).some((t) => t.includes("1.234.567,89"))).toBe(true);
  });

  it("draws a saved signature and renders to escaped SVG pages", () => {
    const withSig = { ...business, name: "A & <B> \"Co\"", signature: { strokes: [[[0, 0.5], [0.5, 1], [1, 0]]], aspect: 3 } };
    const signed: DesktopInvoice = { ...invoice, _raw: { signatureEnabled: true } };
    const layout = buildWebDocument("INVOICE", signed, { ...ctx, business: withSig });
    expect(layout.pages.flat().some((p) => p.t === "ink")).toBe(true);
    const svg = layoutToSvgPages(layout).join("");
    expect(svg).toContain("A &amp; &lt;B&gt; &quot;Co&quot;");
    expect(svg).not.toContain("<B>");
    expect(svg).toContain("<path");
    expect(layoutToPrintHtml(layout, "x").includes("@page{size:595pt 842pt")).toBe(true);
  });

  it("maps invoice fields from the phone's stored record", () => {
    const fromPhone: DesktopInvoice = { ...invoice, _raw: { taxLabel: "GST", terms: "Net 15", signatureEnabled: true, signatureText: "Jo" }, shipping: 5, discountPct: 0, discountFixed: 10 };
    const draft = invoiceAsDraft(fromPhone, prefs);
    expect(draft.taxLabel).toBe("GST");
    expect(draft.terms).toBe("Net 15");
    expect(draft.discountType).toBe("fixed");
    expect(draft.shipping).toBe(5);
    expect(draft.signatureEnabled).toBe(true);
  });
});

describe("money matches the phone to the cent", () => {
  it("documentTotal equals the phone's calculateInvoiceTotals", () => {
    const cases = [
      { items: [{ quantity: 3, rate: 33.333 }, { quantity: 1, rate: 0.015 }], discountPct: 12.5, taxPct: 7.25, shipping: 4.99 },
      { items: [{ quantity: 7, rate: 19.99 }], discountPct: 0, taxPct: 8.25, discountFixed: 20, shipping: 0 },
      { items: [{ quantity: 1, rate: 1000.1 }, { quantity: 2, rate: 99.995 }], discountPct: 5, taxPct: 20, shipping: 0 },
    ];
    for (const c of cases) {
      const web = documentBreakdown({ items: c.items.map((i, k) => ({ id: String(k), name: "x", description: "", ...i })), discountPct: c.discountPct, taxPct: c.taxPct, discountFixed: (c as any).discountFixed, shipping: c.shipping });
      const percent = c.discountPct > 0 || !((c as any).discountFixed > 0);
      const phone = calculateInvoiceTotals({
        items: c.items.map((i, k) => ({ id: String(k), name: "x", description: "", ...i })),
        discountType: percent ? "percentage" : "fixed", discountValue: percent ? c.discountPct : (c as any).discountFixed,
        taxRate: c.taxPct, shipping: c.shipping,
      } as any);
      expect(web.total).toBe(phone.total);
      expect(web.subtotal).toBe(phone.subtotal);
      expect(web.tax).toBe(phone.taxAmount);
      expect(documentTotal({ items: [], discountPct: 0, taxPct: 0 })).toBe(0);
    }
  });
});

describe("shared records never lose fields", () => {
  it("round-trips the phone's style fields and keeps unknown ones", () => {
    const stored = {
      currency: "EUR", dateFormat: "DD/MM/YYYY", invoicePrefix: "INV", defaultTaxRate: "10%", taxLabel: "VAT", paymentTerms: "Net 15", defaultNotes: "Hi",
      invoiceTemplate: "compact", invoiceColor: "#1F3A5F", estimateTemplate: "standard", estimateColor: "#5B2A6B", paperSize: "letter",
      docOptions: { INVOICE: { phone: false }, ESTIMATE: { logo: false } }, paymentInstructions: "IBAN 123", futureField: { keep: true },
    };
    const web = prefsFromShared(stored);
    expect(web.invoiceTemplate).toBe("compact");
    expect(web.paperSize).toBe("letter");
    expect(web.docOptions?.ESTIMATE?.logo).toBe(false);
    const back = prefsToShared({ ...web, taxLabel: "Sales tax" }, web._raw);
    expect(back.futureField).toEqual({ keep: true });
    expect(back.invoiceColor).toBe("#1F3A5F");
    expect(back.estimateColor).toBe("#5B2A6B");
    expect(back.docOptions).toEqual(stored.docOptions);
    expect(back.paymentInstructions).toBe("IBAN 123");
    expect(back.taxLabel).toBe("Sales tax");
  });

  it("does not invent style fields a device never set", () => {
    const back = prefsToShared(prefsFromShared({ currency: "USD" }), { currency: "USD", docOptions: { INVOICE: { logo: false } } });
    expect(back.docOptions).toEqual({ INVOICE: { logo: false } }); // kept from the stored copy
    expect(Object.keys(prefsToShared(prefs, undefined))).not.toContain("invoiceTemplate");
  });

  it("keeps the signature and logo the phone saved", () => {
    const stored = { logoUri: "https://x.test/logo.png", businessName: "Acme", email: "", phone: "", address: "", taxId: "", website: "", signature: { strokes: [[[0, 0], [1, 1]]], aspect: 2 }, extra: 1 };
    const web = businessFromShared(stored);
    expect(web.signature?.aspect).toBe(2);
    expect(web.logoUri).toBe("https://x.test/logo.png");
    const back = businessToShared({ ...web, name: "Acme 2" }, web._raw);
    expect(back.signature).toEqual(stored.signature);
    expect(back.logoUri).toBe("https://x.test/logo.png");
    expect(back.extra).toBe(1);
    // a file path on a phone is not shown on the web
    expect(businessFromShared({ ...stored, logoUri: "file:///data/logo.jpg" }).logoUri).toBeNull();
    // drawing a new one on the web replaces it, removing it clears it
    expect(businessToShared({ ...web, signature: null }, web._raw).signature).toBeNull();
  });
});

describe("signature pad", () => {
  it("normalises strokes to 0..1 and trims the margins", () => {
    const ink = strokesToInk([[[100, 50], [200, 150]], [[150, 100]]])!;
    expect(ink.strokes[0][0]).toEqual([0, 0]);
    expect(ink.strokes[0][1]).toEqual([1, 1]);
    expect(ink.aspect).toBe(1 > 0.8 ? 1 : 0.8);
    expect(strokesToInk([])).toBeNull();
  });
});

describe("customer avatar rule", () => {
  it("uses the company logo for company emails or websites, not for personal mailboxes", () => {
    expect(businessDomain("sam@gmail.com")).toBeNull();
    expect(businessDomain("sam@acme.io")).toBe("acme.io");
    expect(businessDomain(undefined, "https://www.shop.example/about")).toBe("shop.example");
    expect(customerAvatarSources("Sam", "sam@acme.io")[0].logo).toBe(true);
    const personal = customerAvatarSources("Sam", "sam@gmail.com");
    expect(personal).toHaveLength(1);
    expect(personal[0].logo).toBe(false);
    expect(personal[0].url).toContain("seed=sam");
  });
});
