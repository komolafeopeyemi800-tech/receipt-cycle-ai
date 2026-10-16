import type { BusinessProfile, SalesCustomer } from "../sales/setupData";
import { calculateInvoiceTotals, type InvoiceDraft } from "./model";
import { buildDocument, type DocKind } from "../documents/layout";
import { makeDocInput } from "../documents/input";
import { getDocumentStyle } from "../documents/styleStore";
import { layoutToPdfBytes, readJpeg, writePdf } from "../documents/pdfWriter";

/** The logo the PDF can embed (a JPEG file on this phone), shown the same way in the preview. */
export function documentLogo(business: BusinessProfile) {
  const jpeg = readJpeg(business.logoUri);
  return jpeg && business.logoUri ? { uri: business.logoUri, width: jpeg.width, height: jpeg.height } : null;
}

export function invoiceShareSummary(draft: InvoiceDraft, customer: SalesCustomer, currency: string) {
  const totals = calculateInvoiceTotals(draft);
  return `${draft.invoiceNumber} for ${customer.name}\nTotal: ${currency} ${totals.total.toFixed(2)}\nDue: ${draft.dueDate}`;
}

/**
 * Builds the PDF a person shares. The look always comes from their saved Invoice / Estimate style settings
 * (layout, colour, paper, what to show, payment details, signature): there is no way to ask for a different one,
 * and it throws instead of quietly using a generic look if those settings have not loaded yet.
 */
export function createInvoicePdf(draft: InvoiceDraft, business: BusinessProfile, customer: SalesCustomer, currency: string, label: DocKind = "INVOICE") {
  const style = getDocumentStyle(label);
  const layout = buildDocument(makeDocInput({ kind: label, draft, business, customer, currency, style, logo: documentLogo(business) }));
  const bytes = layoutToPdfBytes(layout, business.logoUri);
  return writePdf(bytes, label === "ESTIMATE" ? "Estimates" : "Invoices", draft.invoiceNumber);
}
