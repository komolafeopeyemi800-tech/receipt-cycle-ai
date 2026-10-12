/** Convex client shape (matches convex transactions list return) */
export type DocTx = {
  id: string;
  workspace?: string;
  amount: number;
  type: string;
  category: string;
  merchant: string | null;
  date: string;
  description: string | null;
  payment_method: string | null;
  /** Linked account; balance updated on create/delete */
  accountId: string | null;
  tags: string[] | null;
  is_recurring: boolean | null;
  receipt_url: string | null;
  receipt_data: unknown;
  evidence_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type ScannedExtracted = {
  transaction_type?: "expense" | "income";
  merchant_name?: string;
  total_amount?: number;
  subtotal?: number | null;
  tax_amount?: number | null;
  date?: string;
  /** Time as printed on receipt, e.g. 14:32 or 2:32 PM */
  time?: string;
  payment_method?: string;
  category?: string;
  merchant_address?: string;
  receipt_number?: string;
  country?: string;
  card_type?: string;
  card_last4?: string;
  description?: string;
  taxes?: Array<{ type?: string; amount?: number; registration_number?: string }>;
  items?: Array<{ name: string; quantity: number; unit_price?: number; price: number; total?: number; category?: string }>;
  /** OpenAI / vision: receipt vs other */
  document_type?: string;
  detected_languages?: string[];
  tags?: string[];
  /** Plain-text receipt-style preview from model */
  formatted_receipt_text?: string;
  ocr_confidence?: string;
  currency?: string;
};
