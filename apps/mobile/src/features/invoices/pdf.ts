import type { BusinessProfile, SalesCustomer } from "../sales/setupData";
import { calculateInvoiceTotals, type InvoiceDraft } from "./model";
import { buildDocument, type DocKind, type DocTemplate, type PaperSize, DEFAULT_ACCENT } from "../documents/layout";
import { getDocumentStyle } from "../documents/styleStore";
import { layoutToPdfBytes, readJpeg, writePdf } from "../documents/pdfWriter";

export type DocumentStyle = { template: DocTemplate; accent: string; paper: PaperSize; formatDate?: (ymd: string) => string };
export const DEFAULT_DOCUMENT_STYLE: DocumentStyle = { template: "standard", accent: DEFAULT_ACCENT, paper: "a4" };

/** The logo the PDF can embed (a JPEG file on this phone), shown the same way in the preview. */
export function documentLogo(business: BusinessProfile) {
  const jpeg = readJpeg(business.logoUri);
  return jpeg && business.logoUri ? { uri: business.logoUri, width: jpeg.width, height: jpeg.height } : null;
}

export function invoiceShareSummary(draft: InvoiceDraft, customer: SalesCustomer, currency: string) {
  const totals = calculateInvoiceTotals(draft);
  return `${draft.invoiceNumber} for ${customer.name}
Total: ${currency} ${totals.total.toFixed(2)}
Due: ${draft.dueDate}`;
}

export function createInvoicePdf(draft: InvoiceDraft, business: BusinessProfile, customer: SalesCustomer, currency: string, label: DocKind = "INVOICE", style: DocumentStyle = getDocumentStyle(label)) {
  const layout = buildDocument({
    kind: label, template: style.template, accent: style.accent, paper: style.paper, draft, business, customer, currency,
    formatDate: style.formatDate ?? ((ymd) => ymd), signature: business.signature ?? null, logo: documentLogo(business),
  });
  const bytes = layoutToPdfBytes(layout, business.logoUri);
  return writePdf(bytes, label === "ESTIMATE" ? "Estimates" : "Invoices", draft.invoiceNumber);
}
