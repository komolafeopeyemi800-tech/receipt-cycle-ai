import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://tkbbupvauzmrvgpvkdlq.supabase.co";

export interface OCRResult {
  success: boolean;
  raw_data?: {
    markdown: string;
    chunks: Array<{
      id: string;
      type: string;
      markdown: string;
      grounding: {
        left: number;
        top: number;
        right: number;
        bottom: number;
        page: number;
      };
    }>;
    metadata: {
      page_count: number;
      credit_usage: number;
      filename: string;
    };
  };
  extracted_data?: {
    merchant_name: string;
    total_amount: number;
    subtotal?: number;
    tax_amount?: number;
    date?: string;
    payment_method?: string;
    category?: string;
    items?: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    currency?: string;
  };
  visual_grounding?: Array<{
    id: string;
    type: string;
    text: string;
    position: any;
  }>;
  error?: string;
}

export const scanReceipt = async (file: File): Promise<OCRResult> => {
  const formData = new FormData();
  formData.append('document', file);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/scan-receipt`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to scan receipt');
  }

  return response.json();
};

export const scanReceiptFromUrl = async (url: string): Promise<OCRResult> => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/scan-receipt`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ document_url: url }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to scan receipt');
  }

  return response.json();
};

export const uploadReceiptToStorage = async (file: File, userId: string): Promise<string> => {
  const fileName = `${userId}/${Date.now()}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(fileName, file);

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('receipts')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};
