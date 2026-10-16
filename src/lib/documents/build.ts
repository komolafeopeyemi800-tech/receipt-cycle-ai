/**
 * Builds the printed invoice / estimate for the web with the SAME layout engine the phone app uses
 * (apps/mobile/src/features/documents/layout.ts, a pure TypeScript file that produces positioned primitives),
 * so the preview, the print-out and the phone's PDF agree. Settings come from the shared `invoice_settings`
 * and `business_profile` records.
 */
import {
  buildDocument,
  type DocInput,
  type DocKind,
  type DocLayout,
  type SignatureInk,
} from "../../../apps/mobile/src/features/documents/layout";
import { resolveDocumentStyle } from "../../../apps/mobile/src/features/documents/styleStore";
import type { InvoiceDraft } from "../../../apps/mobile/src/features/invoices/model";
import type { InvoiceSettings } from "../../../apps/mobile/src/features/sales/setupData";
import type {
  BusinessProfile,
  DesktopCustomer,
  DesktopEstimate,
  DesktopInvoice,
  InvoicePreferences,
} from "@/contexts/DesktopBusinessContext";

export type { DocKind, DocLayout, SignatureInk };
export type DocLogo = { uri: string; width: number; height: number };

export type DocContext = {
  customers: DesktopCustomer[];
  business: BusinessProfile;
  prefs: InvoicePreferences;
  currency: string;
  formatDate: (ymd: string) => string;
  /** The logo with its measured size, when the person has one that can be shown. */
  logo?: DocLogo | null;
};

const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
type Raw = Record<string, unknown>;
const rawOf = (doc: { _raw?: Raw }): Raw => doc._raw ?? {};

/** Payment-term labels such as "Net 30"; anything longer on an estimate is free text that belongs in the notes. */
const isTermsLabel = (value: string) => /^(due on receipt|net\s*\d+)$/i.test(value.trim());

/** The settings object the phone's style resolver understands, taken from the web's copy of `invoice_settings`. */
export function settingsFromPrefs(prefs: InvoicePreferences): InvoiceSettings {
  return {
    currency: prefs.currency,
    dateFormat: prefs.dateFormat,
    invoicePrefix: prefs.prefix,
    defaultTaxRate: `${prefs.taxRate}%`,
    taxLabel: prefs.taxLabel,
    paymentTerms: prefs.paymentTerms,
    defaultNotes: prefs.notes,
    invoiceTemplate: prefs.invoiceTemplate,
    invoiceColor: prefs.invoiceColor,
    estimateTemplate: prefs.estimateTemplate,
    estimateColor: prefs.estimateColor,
    paperSize: prefs.paperSize,
    docOptions: prefs.docOptions,
    paymentInstructions: prefs.paymentInstructions,
  };
}

type Lines = DesktopInvoice["items"];
const toLines = (items: Lines) =>
  items.map((i) => ({ id: i.id, name: i.name, description: i.description, quantity: Number(i.quantity) || 0, rate: Number(i.rate) || 0 }));

export function invoiceAsDraft(invoice: DesktopInvoice, prefs: InvoicePreferences): InvoiceDraft {
  const r = rawOf(invoice);
  const percent = (invoice.discountPct ?? 0) > 0 || !((invoice.discountFixed ?? 0) > 0);
  return {
    invoiceNumber: invoice.number,
    title: invoice.title ?? "",
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    customerId: invoice.customerId || null,
    items: toLines(invoice.items),
    discountType: percent ? "percentage" : "fixed",
    discountValue: percent ? invoice.discountPct ?? 0 : invoice.discountFixed ?? 0,
    taxRate: invoice.taxPct ?? 0,
    taxLabel: str(r.taxLabel, prefs.taxLabel || "Tax"),
    shipping: invoice.shipping ?? 0,
    notes: invoice.notes ?? "",
    terms: str(r.terms, prefs.paymentTerms),
    signatureEnabled: r.signatureEnabled === true,
    signatureText: str(r.signatureText),
    attachment: null,
    recurringEnabled: false,
    recurrenceFrequency: "monthly",
    recurrenceStartDate: invoice.issueDate,
    automatedReminders: false,
  };
}

export function estimateAsDraft(estimate: DesktopEstimate, prefs: InvoicePreferences): InvoiceDraft {
  const r = rawOf(estimate);
  const percent = (estimate.discountPct ?? 0) > 0 || !((estimate.discountFixed ?? 0) > 0);
  const terms = str(estimate.terms);
  // The web keeps one free-text "notes & terms" box; short payment-term labels stay terms, longer text prints as notes.
  const label = isTermsLabel(terms) ? terms : "";
  const notes = str(r.notes) || (label ? "" : terms);
  return {
    invoiceNumber: estimate.number,
    title: estimate.title ?? "",
    issueDate: estimate.issueDate,
    dueDate: estimate.validUntil,
    customerId: estimate.customerId || null,
    items: toLines(estimate.items),
    discountType: percent ? "percentage" : "fixed",
    discountValue: percent ? estimate.discountPct ?? 0 : estimate.discountFixed ?? 0,
    taxRate: estimate.taxPct ?? 0,
    taxLabel: str(r.taxLabel, prefs.taxLabel || "Tax"),
    shipping: estimate.shipping ?? 0,
    notes,
    terms: label,
    signatureEnabled: r.customerSignatureEnabled === true,
    signatureText: str(r.signatureText),
    attachment: null,
    recurringEnabled: false,
    recurrenceFrequency: "monthly",
    recurrenceStartDate: estimate.issueDate,
    automatedReminders: false,
  };
}

/** Everything the layout engine needs for one document, honouring the saved style and "what to show" switches. */
export function buildDocInput(kind: DocKind, doc: DesktopInvoice | DesktopEstimate, ctx: DocContext): DocInput {
  const style = resolveDocumentStyle(kind, settingsFromPrefs(ctx.prefs), ctx.formatDate);
  const draft = kind === "INVOICE" ? invoiceAsDraft(doc as DesktopInvoice, ctx.prefs) : estimateAsDraft(doc as DesktopEstimate, ctx.prefs);
  const c = ctx.customers.find((row) => row.id === doc.customerId);
  const b = ctx.business;
  return {
    kind,
    template: style.template,
    accent: style.accent,
    paper: style.paper,
    draft,
    business: {
      logoUri: b.logoUri ?? null,
      businessName: b.name,
      email: b.email,
      phone: b.phone,
      address: b.address,
      taxId: b.taxId,
      website: b.website,
      signature: b.signature ?? null,
    },
    customer: {
      id: c?.id ?? "",
      name: c?.name || c?.company || "Customer",
      businessName: c?.company ?? "",
      email: c?.email ?? "",
      phone: c?.phone ?? "",
      billingAddress: c?.address ?? "",
      taxId: "",
      notes: "",
      status: c?.status ?? "active",
      createdAt: "",
    },
    currency: ctx.currency,
    formatDate: ctx.formatDate,
    signature: b.signature ?? null,
    logo: ctx.logo ?? null,
    options: style.options,
    paymentInstructions: style.paymentInstructions,
  };
}

export function buildWebDocument(kind: DocKind, doc: DesktopInvoice | DesktopEstimate, ctx: DocContext): DocLayout {
  return buildDocument(buildDocInput(kind, doc, ctx));
}

/** A logo can only be shown when it is an embedded image or a web address (a file on the phone cannot be reached from here). */
export const showableLogo = (uri: string | null | undefined) => (uri && /^(https?:|data:image\/)/.test(uri) ? uri : null);
