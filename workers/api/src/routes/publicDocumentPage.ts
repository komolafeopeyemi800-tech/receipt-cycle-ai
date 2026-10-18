/**
 * The customer-facing page behind a public invoice / estimate link.
 *
 * It is drawn by the SAME layout engine the phone's PDF and the web preview use (apps/mobile/src/features/documents),
 * with the owner's saved style (template, colour, paper, what to show, payment details), so the page a customer opens,
 * prints or saves as PDF is the document the owner designed. Nothing here has its own layout.
 */
import { makeDocInput } from "../../../../apps/mobile/src/features/documents/input";
import { buildDocument, type DocKind } from "../../../../apps/mobile/src/features/documents/layout";
import { resolveDocumentStyle } from "../../../../apps/mobile/src/features/documents/styleStore";
import { estimateAsInvoiceDraft, type EstimateDraft } from "../../../../apps/mobile/src/features/estimates/model";
import type { InvoiceDraft } from "../../../../apps/mobile/src/features/invoices/model";
import { formatDateYmd, type DateFormatId } from "../../../../apps/mobile/src/lib/preferences";
import type { BusinessProfile, InvoiceSettings, SalesCustomer } from "../../../../apps/mobile/src/features/sales/setupData";
import { layoutToSvgPages } from "../../../../src/lib/documents/svgPages";

type Raw = Record<string, any>;

const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

/** Settings may name the date style as an id ("us") or as a pattern ("MM/DD/YYYY"). */
function dateFormatId(value: unknown): DateFormatId {
  const v = String(value ?? "").toLowerCase();
  if (v === "us" || v.startsWith("mm")) return "us";
  if (v === "eu" || v.startsWith("dd")) return "eu";
  return "iso";
}

const text = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const number = (value: unknown, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

function toBusiness(raw: Raw | null | undefined): BusinessProfile {
  const b = raw ?? {};
  const logo = text(b.logoUri);
  return {
    logoUri: /^(https?:|data:image\/)/.test(logo) ? logo : null,
    businessName: text(b.businessName) || text(b.name),
    email: text(b.email), phone: text(b.phone), address: text(b.address), taxId: text(b.taxId), website: text(b.website),
    signature: b.signature && Array.isArray(b.signature.strokes) ? b.signature : null,
  };
}

function toCustomer(raw: Raw | null | undefined, doc: Raw): SalesCustomer {
  const c = raw ?? {};
  return {
    id: text(c.id), name: text(c.name) || text(c.company) || text(doc.customerName) || "Customer", businessName: text(c.businessName) || text(c.company),
    email: text(c.email), phone: text(c.phone), billingAddress: text(c.billingAddress) || text(c.address), taxId: "", notes: "", status: "active", createdAt: "",
  };
}

function toDraft(kind: DocKind, doc: Raw): InvoiceDraft {
  const items = (Array.isArray(doc.items) ? doc.items : []).map((item: Raw, index: number) => ({
    id: text(item.id, String(index)), name: text(item.name) || text(item.description) || "Item", description: text(item.name) ? text(item.description) : "",
    quantity: number(item.quantity, 1), rate: number(item.rate),
  }));
  if (kind === "ESTIMATE") {
    return estimateAsInvoiceDraft({ ...doc, items, attachments: Array.isArray(doc.attachments) ? doc.attachments : [], estimateNumber: text(doc.estimateNumber), estimateDate: text(doc.estimateDate) || text(doc.issueDate), validUntil: text(doc.validUntil) || text(doc.dueDate), notes: text(doc.notes), terms: text(doc.terms), taxLabel: text(doc.taxLabel), customerSignatureEnabled: doc.customerSignatureEnabled === true, signatureText: text(doc.signatureText) } as unknown as EstimateDraft);
  }
  return {
    invoiceNumber: text(doc.invoiceNumber), title: text(doc.title), issueDate: text(doc.issueDate), dueDate: text(doc.dueDate), customerId: text(doc.customerId) || null, items,
    discountType: doc.discountType === "fixed" ? "fixed" : "percentage", discountValue: number(doc.discountValue), taxRate: number(doc.taxRate), taxLabel: text(doc.taxLabel),
    shipping: number(doc.shipping), notes: text(doc.notes), terms: text(doc.terms), signatureEnabled: doc.signatureEnabled === true, signatureText: text(doc.signatureText),
    attachment: null, recurringEnabled: false, recurrenceFrequency: "monthly", recurrenceStartDate: text(doc.issueDate), automatedReminders: false,
  };
}

export type PublicSnapshot = { document?: Raw; business?: Raw | null; settings?: Raw | null; customer?: Raw | null };

/** The complete page for a public link. */
export function renderPublicDocumentPage(kind: "invoice" | "estimate", snapshot: PublicSnapshot, fallbackNumber: string): string {
  const docKind: DocKind = kind === "invoice" ? "INVOICE" : "ESTIMATE";
  const doc = snapshot.document ?? {};
  const settings = { currency: "USD", dateFormat: "iso", invoicePrefix: "INV", defaultTaxRate: "", taxLabel: "", paymentTerms: "", defaultNotes: "", ...(snapshot.settings ?? {}) } as InvoiceSettings;
  const fmt = dateFormatId(settings.dateFormat);
  const formatDate = (ymd: string) => formatDateYmd(ymd, fmt);
  const style = resolveDocumentStyle(docKind, settings, formatDate);
  const business = toBusiness(snapshot.business);
  const draft = toDraft(docKind, doc);
  if (!draft.invoiceNumber) draft.invoiceNumber = fallbackNumber;
  const logo = business.logoUri ? { uri: business.logoUri, width: 1, height: 1 } : null;
  const layout = buildDocument(makeDocInput({ kind: docKind, draft, business, customer: toCustomer(snapshot.customer, doc), currency: settings.currency || "USD", style, logo }));
  const title = `${kind === "invoice" ? "Invoice" : "Estimate"} ${draft.invoiceNumber}`;
  const sheets = layoutToSvgPages(layout).map((svg) => `<section class="sheet">${svg}</section>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(title)}</title><style>
@page{size:${layout.w}pt ${layout.h}pt;margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;padding:0}
body{background:#eef1f3;font:15px system-ui,-apple-system,sans-serif;color:#102a2a}
.sheet{width:min(${layout.w}pt,calc(100vw - 24px));aspect-ratio:${layout.w} / ${layout.h};margin:16px auto;background:#fff;box-shadow:0 8px 30px rgba(16,42,42,.14);overflow:hidden}
.sheet svg{display:block;width:100%;height:100%}
.rc-doc-hint{display:none}
.actions{text-align:center;margin:20px 12px 28px}
.actions button{border:0;border-radius:10px;background:#0f766e;color:#fff;padding:12px 22px;font-weight:800;font-size:15px;cursor:pointer}
@media print{body{background:#fff}.sheet{width:${layout.w}pt;height:${layout.h}pt;aspect-ratio:auto;margin:0;box-shadow:none;page-break-after:always;break-after:page}.sheet:last-of-type{page-break-after:auto;break-after:auto}.actions{display:none}}
</style></head><body>${sheets}<div class="actions"><button onclick="window.print()">Print or save PDF</button></div></body></html>`;
}
