/** Shared transaction shape for UI lists (Convex-backed web app). */

export interface Transaction {
  id: string;
  workspace?: "personal" | "business";
  amount: number;
  type: string;
  category: string;
  merchant: string | null;
  date: string;
  description: string | null;
  payment_method: string | null;
  accountId?: string | null;
  tags: string[] | null;
  is_recurring: boolean | null;
  receipt_url: string | null;
  receipt_data: unknown;
  created_at: string;
  updated_at: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  /** `(income - expenses) / income × 100` for the period; null when income is zero. */
  savingsRate: number | null;
  transactionCount: number;
  categoryBreakdown: { category: string; amount: number; count: number }[];
}
