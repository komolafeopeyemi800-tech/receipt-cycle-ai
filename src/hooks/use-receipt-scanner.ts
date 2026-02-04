import { useState, useCallback } from 'react';
import { scanReceipt, uploadReceiptToStorage, OCRResult } from '@/services/ocr';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useReceiptScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const scan = useCallback(async (file: File) => {
    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Scan the receipt with Landing AI
      const result = await scanReceipt(file);
      setScanResult(result);

      if (result.success && result.extracted_data) {
        toast({
          title: 'Receipt scanned successfully!',
          description: `Found: ${result.extracted_data.merchant_name || 'Unknown merchant'} - $${result.extracted_data.total_amount || 0}`,
        });

        // Upload to storage if user is logged in
        if (user) {
          try {
            const receiptUrl = await uploadReceiptToStorage(file, user.id);
            result.extracted_data = {
              ...result.extracted_data,
              receipt_url: receiptUrl,
            } as any;
          } catch (uploadError) {
            console.error('Failed to upload receipt:', uploadError);
          }
        }
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to scan receipt';
      setError(message);
      toast({
        title: 'Scan failed',
        description: message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsScanning(false);
    }
  }, [toast]);

  const reset = useCallback(() => {
    setScanResult(null);
    setError(null);
  }, []);

  return {
    scan,
    isScanning,
    scanResult,
    error,
    reset,
  };
};
