import type { InvoiceAttachment, InvoiceDraft, InvoiceLineItem, DiscountType } from "../invoices/model";
import { calculateInvoiceTotals, parsePercent, todayYmd, addDaysYmd } from "../invoices/model";
import type { InvoiceSettings, SalesCustomer } from "../sales/setupData";

export type EstimateStatus = "draft" | "sent" | "accepted" | "expired";

export type EstimateDraft = {
  estimateNumber: string;
  estimateDate: string;
  validUntil: string;
  customerId: string | null;
  reference: string;
  items: InvoiceLineItem[];
  discountType: DiscountType;
  discountValue: number;
  taxRate: number;
  taxLabel: string;
  notes: string;
  terms: string;
  validityDays: number;
  customerSignatureEnabled: boolean;
  signatureText: string;
  attachments: InvoiceAttachment[];
};

export type SavedEstimate = EstimateDraft & {
  customerName: string;
  status: EstimateStatus;
  total: number;
  updatedAt: string;
  acceptedAt?: string;
};

export const estimateListPreview = [
  { estimateNumber: "EST-2026-002", customerName: "Acme Corp", estimateDate: "2026-09-14", amount: 12500, status: "sent" as const },
  { estimateNumber: "EST-2026-001", customerName: "Whole Foods Market", estimateDate: "2026-09-10", amount: 8000, status: "accepted" as const },
  { estimateNumber: "EST-2026-004", customerName: "Bright Co", estimateDate: "2026-09-05", amount: 5250, status: "draft" as const },
  { estimateNumber: "EST-2026-003", customerName: "Global Tech", estimateDate: "2026-08-28", amount: 15000, status: "expired" as const },
  { estimateNumber: "EST-2026-005", customerName: "Sunrise Design", estimateDate: "2026-08-20", amount: 3200, status: "sent" as const },
  { estimateNumber: "EST-2026-006", customerName: "Maple Retail", estimateDate: "2026-08-12", amount: 6750, status: "draft" as const },
];

/** Stable id shared by every device: the estimate number (unique per workspace). */
export const estimateSyncId = (estimate: Pick<SavedEstimate, "estimateNumber">) => `est:${estimate.estimateNumber}`;

function nextEstimateNumber(saved: SavedEstimate[]) {
  const year = new Date().getFullYear();
  const values = saved.map((item) => item.estimateNumber).map((id) => Number(id.match(/(\d+)$/)?.[1] ?? 0));
  return `EST-${year}-${String(Math.max(0, ...values) + 1).padStart(3, "0")}`;
}

export function createEstimateDraft(settings: InvoiceSettings, saved: SavedEstimate[]): EstimateDraft {
  const estimateDate = todayYmd();
  return {
    estimateNumber: nextEstimateNumber(saved), estimateDate, validUntil: addDaysYmd(estimateDate, 30), customerId: null, reference: "", items: [],
    discountType: "percentage", discountValue: 0, taxRate: parsePercent(settings.defaultTaxRate), taxLabel: settings.taxLabel || "Sales Tax",
    notes: "Thank you for your consideration!", terms: "This estimate is valid for 30 days from the issue date. Prices are subject to change after this period.",
    validityDays: 30, customerSignatureEnabled: false, signatureText: "", attachments: [],
  };
}

export function estimateAsInvoiceDraft(estimate: EstimateDraft): InvoiceDraft {
  return {
    invoiceNumber: estimate.estimateNumber, issueDate: estimate.estimateDate, dueDate: estimate.validUntil, customerId: estimate.customerId,
    items: estimate.items, discountType: estimate.discountType, discountValue: estimate.discountValue, taxRate: estimate.taxRate, taxLabel: estimate.taxLabel,
    shipping: 0, notes: estimate.notes, terms: estimate.terms, signatureEnabled: estimate.customerSignatureEnabled, signatureText: estimate.signatureText,
    attachment: estimate.attachments[0] ?? null,
  };
}

export function calculateEstimateTotals(estimate: EstimateDraft) {
  return calculateInvoiceTotals(estimateAsInvoiceDraft(estimate));
}

export function createSavedEstimate(draft: EstimateDraft, customer: SalesCustomer, status: EstimateStatus): SavedEstimate {
  return { ...draft, items: draft.items.map((item) => ({ ...item })), attachments: draft.attachments.map((item) => ({ ...item })), customerName: customer.name, status, total: calculateEstimateTotals(draft).total, updatedAt: new Date().toISOString(), ...(status === "accepted" ? { acceptedAt: new Date().toISOString() } : {}) };
}

export function createAcceptedPreviewEstimate(customerId: string): SavedEstimate {
  const base: EstimateDraft = {
    estimateNumber: "EST-2026-001", estimateDate: "2026-09-10", validUntil: "2026-10-10", customerId, reference: "Website Project",
    items: [
      { id: "preview-web", name: "Website Design", description: "Custom responsive design", quantity: 1, rate: 2500 },
      { id: "preview-dev", name: "Development", description: "Frontend and backend development", quantity: 40, rate: 120 },
      { id: "preview-content", name: "Content Setup", description: "Page content and SEO setup", quantity: 8, rate: 85 },
    ],
    discountType: "percentage", discountValue: 0, taxRate: 0, taxLabel: "Sales Tax", notes: "Thank you for your consideration!",
    terms: "Net 30", validityDays: 30, customerSignatureEnabled: true, signatureText: "Customer approval", attachments: [],
  };
  return { ...base, customerName: "Acme Corp", status: "accepted", total: 8000, updatedAt: "2026-09-12T12:00:00.000Z", acceptedAt: "2026-09-12T12:00:00.000Z" };
}
