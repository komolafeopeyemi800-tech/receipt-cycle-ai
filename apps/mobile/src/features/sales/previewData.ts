import type { SalesStatus } from "../../types/sales";

/** Worksheet-only preview data. Replace this service boundary with the sales API in a later phase. */
export const salesDataMode = "preview" as const;

export type SalesInvoice = {
  id: string;
  customer: string;
  issuedAt: string;
  amount: number;
  status: Extract<SalesStatus, "draft" | "sent" | "paid" | "partially_paid" | "overdue">;
};

export type SalesEstimate = {
  id: string;
  customer: string;
  issuedAt: string;
  amount: number;
  status: Extract<SalesStatus, "draft" | "sent" | "accepted" | "expired">;
};

export type SalesPayment = {
  id: string;
  invoiceId: string;
  customer: string;
  paidAt: string;
  amount: number;
};

export const previewInvoices: SalesInvoice[] = [
  { id: "INV-2026-003", customer: "Walk-In Customer", issuedAt: "2026-09-14", amount: 36666, status: "paid" },
  { id: "INV-2026-002", customer: "ABC Consulting", issuedAt: "2026-09-14", amount: 36666, status: "sent" },
  { id: "INV-2026-001", customer: "Acme Corp", issuedAt: "2026-09-10", amount: 20000, status: "overdue" },
  { id: "INV-2026-000", customer: "XYZ Media", issuedAt: "2026-09-05", amount: 5500, status: "paid" },
  { id: "INV-2026-005", customer: "Bright Co", issuedAt: "2026-08-28", amount: 8750, status: "draft" },
];

export const previewEstimates: SalesEstimate[] = [
  { id: "EST-2026-002", customer: "XYZ Media", issuedAt: "2026-09-14", amount: 12500, status: "sent" },
  { id: "EST-2026-001", customer: "Acme Corp", issuedAt: "2026-09-10", amount: 8000, status: "accepted" },
  { id: "EST-2026-000", customer: "Bright Co", issuedAt: "2026-09-05", amount: 5250, status: "draft" },
  { id: "EST-2026-004", customer: "Global Tech", issuedAt: "2026-08-28", amount: 15000, status: "expired" },
];

export const previewPayments: SalesPayment[] = [
  { id: "PAY-2026-003", invoiceId: "INV-2026-003", customer: "Walk-In Customer", paidAt: "2026-09-14", amount: 36666 },
  { id: "PAY-2026-000", invoiceId: "INV-2026-000", customer: "XYZ Media", paidAt: "2026-08-30", amount: 5500 },
];

export const previewSalesMetrics = {
  outstanding: previewInvoices.filter((x) => x.status === "sent" || x.status === "overdue" || x.status === "partially_paid").reduce((sum, x) => sum + x.amount, 0),
  paidThisMonth: previewPayments.filter((x) => x.paidAt.startsWith("2026-09")).reduce((sum, x) => sum + x.amount, 0),
  overdue: previewInvoices.filter((x) => x.status === "overdue").reduce((sum, x) => sum + x.amount, 0),
  openEstimates: previewEstimates.filter((x) => x.status === "sent").reduce((sum, x) => sum + x.amount, 0),
};
