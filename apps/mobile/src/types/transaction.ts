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
  created_at: string;
  updated_at: string;
};

export type ScannedExtracted = {
  merchant_name?: string;
  total_amount?: number;
  date?: string;
  /** Time as printed on receipt, e.g. 14:32 or 2:32 PM */
  time?: string;
  payment_method?: string;
  category?: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
  /** OpenAI / vision: receipt vs other */
  document_type?: string;
  detected_languages?: string[];
  tags?: string[];
  /** Plain-text receipt-style preview from model */
  formatted_receipt_text?: string;
  ocr_confidence?: string;
  currency?: string;
};
