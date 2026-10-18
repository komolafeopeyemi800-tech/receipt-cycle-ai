export type WorkflowLineItem = {
  label: string;
  quantity: number;
  amount: number;
};

export type WorkflowDocument = {
  kind: "invoice" | "estimate";
  number: string;
  status: "partially_paid" | "sent";
  customer: string;
  title: string;
  issueDate: string;
  dueLabel: string;
  lineItems: WorkflowLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  paid?: number;
  balance?: number;
  asset: string;
};

/**
 * Synthetic records for the homepage workflow demo.
 *
 * These values are deliberately fictional and safe to show in public marketing.
 * Keep this module aligned with the fields supported by the receipt review,
 * invoice, estimate, and payment workspaces.
 */
export const homeWorkflowDemo = {
  receipt: {
    merchant: "Oak Street Grill",
    displayDate: "Oct 17, 2026",
    date: "2026-10-17",
    time: "12:42 PM",
    category: "Meals",
    currency: "USD",
    paymentMethod: "Visa •••• 2841",
    lineItems: [
      { label: "Grilled chicken sandwich", quantity: 1, amount: 10.49 },
      { label: "Seasoned fries", quantity: 1, amount: 4.29 },
      { label: "Iced tea", quantity: 1, amount: 2.49 },
    ],
    subtotal: 17.27,
    tax: 1.43,
    tip: 3,
    total: 21.7,
    confidence: 98,
    asset: "/landing/home/workflow/oak-street-grill-receipt.svg",
  },
  invoice: {
    kind: "invoice",
    number: "INV-2026-014",
    status: "partially_paid",
    customer: "Sample Client LLC",
    title: "Website refresh",
    issueDate: "Oct 17, 2026",
    dueLabel: "Due Nov 16, 2026",
    lineItems: [
      { label: "Design and development", quantity: 1, amount: 1250 },
      { label: "Content handoff", quantity: 1, amount: 280 },
    ],
    subtotal: 1530,
    tax: 122.4,
    total: 1652.4,
    paid: 800,
    balance: 852.4,
    asset: "/landing/home/workflow/sample-invoice.svg",
  } satisfies WorkflowDocument,
  estimate: {
    kind: "estimate",
    number: "EST-2026-009",
    status: "sent",
    customer: "Sample Client LLC",
    title: "Launch support package",
    issueDate: "Oct 17, 2026",
    dueLabel: "Valid until Nov 16, 2026",
    lineItems: [
      { label: "Launch setup", quantity: 1, amount: 980 },
      { label: "Revision allowance", quantity: 3, amount: 80 },
    ],
    subtotal: 1220,
    tax: 97.6,
    total: 1317.6,
    asset: "/landing/home/workflow/sample-estimate.svg",
  } satisfies WorkflowDocument,
} as const;

export const homeWorkflowStages = [
  { id: "capture", label: "Capture", detail: "Receipt image added" },
  { id: "extract", label: "Review", detail: "Details extracted for review" },
  { id: "organize", label: "Organize", detail: "Expense saved with its evidence" },
  { id: "act", label: "Use", detail: "Ready for budgets and reports" },
] as const;

