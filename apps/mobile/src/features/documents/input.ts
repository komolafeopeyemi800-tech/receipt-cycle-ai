import type { InvoiceDraft } from "../invoices/model";
import type { BusinessProfile, SalesCustomer } from "../sales/setupData";
import type { DocInput, DocKind } from "./layout";
import type { ResolvedStyle } from "./styleStore";

/**
 * The ONE place that turns a document plus the person's saved style into what gets drawn.
 * The on-screen preview and the PDF both call this, so what you see is exactly what is shared.
 */
export function makeDocInput(a: {
  kind: DocKind;
  draft: InvoiceDraft;
  business: BusinessProfile;
  customer: SalesCustomer;
  currency: string;
  style: ResolvedStyle;
  logo: DocInput["logo"];
}): DocInput {
  return {
    kind: a.kind,
    template: a.style.template,
    accent: a.style.accent,
    paper: a.style.paper,
    draft: a.draft,
    business: a.business,
    customer: a.customer,
    currency: a.currency,
    formatDate: a.style.formatDate,
    signature: a.business.signature ?? null,
    logo: a.logo,
    options: a.style.options,
    paymentInstructions: a.style.paymentInstructions,
  };
}
