import { calculateInvoiceTotals, type SavedInvoice } from "../invoices/model";

export type PaymentMethod = "Cash" | "Bank Transfer" | "Card" | "Mobile Money";
export type PaymentStatus = "received" | "partial" | "refunded";

export type PaymentInvoice = {
  invoiceNumber: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  status: "open" | "overdue" | "partially_paid";
  preview: boolean;
};

export type PaymentDraft = {
  invoiceNumber: string | null;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  accountId: string | null;
  accountName: string;
  note: string;
};

export type SavedPayment = PaymentDraft & {
  id: string;
  receiptNumber: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  invoiceTotal: number;
  previousPaid: number;
  remainingBalance: number;
  reference: string;
  status: PaymentStatus;
  transactionId: string;
  createdAt: string;
};

export type PaymentListPreview = {
  id: string;
  receiptNumber: string;
  invoiceNumber: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  status: PaymentStatus;
};

export const paymentInvoicePreview: PaymentInvoice[] = [
  { invoiceNumber: "INV-2026-001", customerId: "customer-bright", customerName: "Bright Co", customerEmail: "team@brightco.com", customerAddress: "456 Innovation Drive\nSan Francisco, CA 94107", issueDate: "2026-04-05", dueDate: "2026-04-30", subtotal: 12500, taxAmount: 1000, total: 13500, amountPaid: 0, status: "open", preview: true },
  { invoiceNumber: "INV-2026-002", customerId: "customer-acme", customerName: "Acme Corp", customerEmail: "acme@corp.com", customerAddress: "123 Market Street\nSan Francisco, CA 94103", issueDate: "2026-04-02", dueDate: "2026-04-28", subtotal: 8000, taxAmount: 0, total: 8000, amountPaid: 0, status: "open", preview: true },
  { invoiceNumber: "INV-2026-003", customerId: "customer-global", customerName: "Global Tech", customerEmail: "contact@globaltech.com", customerAddress: "12 Innovation Drive\nSan Jose, CA 95110", issueDate: "2026-04-01", dueDate: "2026-04-25", subtotal: 5750, taxAmount: 0, total: 5750, amountPaid: 0, status: "overdue", preview: true },
  { invoiceNumber: "INV-2026-004", customerId: null, customerName: "Sunrise Bakery", customerEmail: "hello@sunrisebakery.com", customerAddress: "88 Sunrise Avenue", issueDate: "2026-03-29", dueDate: "2026-04-20", subtotal: 3200, taxAmount: 0, total: 3200, amountPaid: 0, status: "overdue", preview: true },
  { invoiceNumber: "INV-2026-005", customerId: null, customerName: "Whole Foods Market", customerEmail: "", customerAddress: "1234 Market Street\nSan Francisco, CA 94103", issueDate: "2026-03-27", dueDate: "2026-04-18", subtotal: 4800, taxAmount: 0, total: 4800, amountPaid: 0, status: "overdue", preview: true },
  { invoiceNumber: "INV-2026-006", customerId: null, customerName: "Green Valley Ltd", customerEmail: "accounts@greenvalley.com", customerAddress: "24 Green Valley Road", issueDate: "2026-03-25", dueDate: "2026-04-15", subtotal: 6600, taxAmount: 0, total: 6600, amountPaid: 0, status: "overdue", preview: true },
];

export const paymentListPreview: PaymentListPreview[] = [
  { id: "payment-preview-1", receiptNumber: "RCPT-2026-0013", invoiceNumber: "INV-2026-003", customerName: "Acme Corp", paymentDate: "2026-04-12", amount: 5000, status: "received" },
  { id: "payment-preview-2", receiptNumber: "RCPT-2026-0012", invoiceNumber: "INV-2026-001", customerName: "Bright Co", paymentDate: "2026-04-11", amount: 2500, status: "partial" },
  { id: "payment-preview-3", receiptNumber: "RCPT-2026-0011", invoiceNumber: "INV-2026-004", customerName: "Global Tech", paymentDate: "2026-04-10", amount: 8000, status: "received" },
  { id: "payment-preview-4", receiptNumber: "RCPT-2026-0010", invoiceNumber: "INV-2026-002", customerName: "Sunrise Bakery", paymentDate: "2026-04-09", amount: 1200, status: "refunded" },
  { id: "payment-preview-5", receiptNumber: "RCPT-2026-0009", invoiceNumber: "INV-2026-005", customerName: "Whole Foods Market", paymentDate: "2026-04-08", amount: 3250, status: "received" },
];

export const paymentPreviewMetrics = { received: 28450, refunded: 1200 };

export function todayYmd() { return new Date().toISOString().slice(0, 10); }

export function createPaymentDraft(invoiceNumber?: string): PaymentDraft {
  return { invoiceNumber: invoiceNumber ?? null, amount: 0, paymentDate: todayYmd(), method: "Bank Transfer", accountId: null, accountName: "", note: "" };
}

export function localInvoiceToPaymentInvoice(invoice: SavedInvoice): PaymentInvoice {
  const amountPaid = Math.min(invoice.total, Math.max(0, invoice.amountPaid ?? 0));
  const totals = calculateInvoiceTotals(invoice);
  return {
    invoiceNumber: invoice.invoiceNumber, customerId: invoice.customerId, customerName: invoice.customerName, customerEmail: "", customerAddress: "",
    issueDate: invoice.issueDate, dueDate: invoice.dueDate, subtotal: totals.subtotal, taxAmount: totals.taxAmount, total: invoice.total, amountPaid,
    status: invoice.status === "overdue" ? "overdue" : amountPaid > 0 ? "partially_paid" : "open", preview: false,
  };
}

export function nextReceiptNumber(payments: SavedPayment[]) {
  const year = new Date().getFullYear();
  const values = [...paymentListPreview.map((item) => item.receiptNumber), ...payments.map((item) => item.receiptNumber)].map((id) => Number(id.match(/(\d+)$/)?.[1] ?? 0));
  return `RCPT-${year}-${String(Math.max(0, ...values) + 1).padStart(4, "0")}`;
}

export function paymentReference(method: PaymentMethod) {
  const prefix = method === "Bank Transfer" ? "TRF" : method === "Mobile Money" ? "MOB" : method === "Card" ? "CRD" : "CSH";
  return `${prefix}${Date.now().toString().slice(-9)}`;
}
