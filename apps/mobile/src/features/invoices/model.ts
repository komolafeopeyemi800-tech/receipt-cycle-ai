import type { SalesStatus } from "../../types/sales";
import type { InvoiceSettings, SalesCustomer } from "../sales/setupData";

export type InvoiceStatus = Extract<SalesStatus, "draft" | "sent" | "paid" | "partially_paid" | "overdue">;
export type DiscountType = "percentage" | "fixed";

export type InvoiceLineItem = {
  id: string;
  catalogItemId?: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
};

export type InvoiceAttachment = {
  name: string;
  uri: string;
  mimeType: string;
};

export type InvoiceDraft = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  customerId: string | null;
  items: InvoiceLineItem[];
  discountType: DiscountType;
  discountValue: number;
  taxRate: number;
  taxLabel: string;
  shipping: number;
  notes: string;
  terms: string;
  signatureEnabled: boolean;
  signatureText: string;
  attachment: InvoiceAttachment | null;
};

export type SavedInvoice = InvoiceDraft & {
  customerName: string;
  status: InvoiceStatus;
  total: number;
  updatedAt: string;
  sentAt?: string;
  amountPaid?: number;
};

export type InvoiceListPreview = {
  invoiceNumber: string;
  customerName: string;
  issuedAt: string;
  amount: number;
  status: InvoiceStatus;
};

/** Worksheet-only examples. Local invoices are stored separately and are always shown first. */
export const invoiceListPreview: InvoiceListPreview[] = [
  { invoiceNumber: "INV-2026-006", customerName: "Acme Corp", issuedAt: "2026-10-24", amount: 2500, status: "draft" },
  { invoiceNumber: "INV-2026-005", customerName: "Bright Co", issuedAt: "2026-10-22", amount: 1200, status: "draft" },
  { invoiceNumber: "INV-2026-004", customerName: "XYZ Media", issuedAt: "2026-10-20", amount: 3600, status: "sent" },
  { invoiceNumber: "INV-2026-003", customerName: "Global Tech", issuedAt: "2026-10-18", amount: 850, status: "paid" },
  { invoiceNumber: "INV-2026-002", customerName: "Luna Studio", issuedAt: "2026-10-15", amount: 4200, status: "overdue" },
  { invoiceNumber: "INV-2026-001", customerName: "Maple & Co", issuedAt: "2026-10-10", amount: 950, status: "paid" },
];

/** Stable id shared by every device: the invoice number (unique per workspace). */
export const invoiceSyncId = (invoice: Pick<SavedInvoice, "invoiceNumber">) => `inv:${invoice.invoiceNumber}`;

export function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysYmd(ymd: string, days: number) {
  const date = new Date(`${ymd}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parsePercent(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function nextInvoiceNumber(prefix: string, saved: SavedInvoice[]) {
  const year = new Date().getFullYear();
  const numbers = saved.map((item) => item.invoiceNumber).map((id) => Number(id.match(/(\d+)$/)?.[1] ?? 0));
  const next = Math.max(0, ...numbers) + 1;
  return `${prefix.trim().toUpperCase() || "INV"}-${year}-${String(next).padStart(3, "0")}`;
}

export function paymentTermsDays(terms: string) {
  if (terms === "Due on receipt") return 0;
  const days = Number(terms.match(/\d+/)?.[0] ?? 30);
  return Number.isFinite(days) ? days : 30;
}

export function createInvoiceDraft(settings: InvoiceSettings, saved: SavedInvoice[]): InvoiceDraft {
  const issueDate = todayYmd();
  return {
    invoiceNumber: nextInvoiceNumber(settings.invoicePrefix, saved),
    issueDate,
    dueDate: addDaysYmd(issueDate, paymentTermsDays(settings.paymentTerms)),
    customerId: null,
    items: [],
    discountType: "percentage",
    discountValue: 0,
    taxRate: parsePercent(settings.defaultTaxRate),
    taxLabel: settings.taxLabel || "Sales Tax",
    shipping: 0,
    notes: settings.defaultNotes,
    terms: settings.paymentTerms,
    signatureEnabled: false,
    signatureText: "",
    attachment: null,
  };
}

export function calculateInvoiceTotals(draft: InvoiceDraft) {
  const subtotal = draft.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const discountAmount = Math.min(subtotal, draft.discountType === "percentage" ? subtotal * Math.max(0, draft.discountValue) / 100 : Math.max(0, draft.discountValue));
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxable * Math.max(0, draft.taxRate) / 100;
  const total = taxable + taxAmount + Math.max(0, draft.shipping);
  return { subtotal, discountAmount, taxable, taxAmount, total };
}

export function createSavedInvoice(draft: InvoiceDraft, customer: SalesCustomer, status: InvoiceStatus): SavedInvoice {
  return {
    ...draft,
    items: draft.items.map((item) => ({ ...item })),
    customerName: customer.name,
    status,
    total: calculateInvoiceTotals(draft).total,
    updatedAt: new Date().toISOString(),
    ...(status === "sent" ? { sentAt: new Date().toISOString() } : {}),
  };
}
