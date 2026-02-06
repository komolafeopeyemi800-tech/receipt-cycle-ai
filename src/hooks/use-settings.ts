import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserSettings {
  currency: string;
  dateFormat: string;
  taxRate: number;
  billReminders: boolean;
  spendingAlerts: boolean;
  weeklySummary: boolean;
}

const defaultSettings: UserSettings = {
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  taxRate: 8.5,
  billReminders: true,
  spendingAlerts: true,
  weeklySummary: false,
};

export const useSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);

  const updateSetting = useCallback(async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: 'Setting updated',
      description: `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} has been updated.`,
    });
  }, [toast]);

  const exportData = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Not signed in',
        description: 'Please sign in to export your data',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const exportData = {
        exportedAt: new Date().toISOString(),
        userId: user.id,
        email: user.email,
        transactionCount: transactions?.length || 0,
        transactions: transactions || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-cycle-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export complete',
        description: `Downloaded ${transactions?.length || 0} transactions.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      toast({
        title: 'Export failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const deleteAccount = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Not signed in',
        description: 'Please sign in to delete your account',
        variant: 'destructive',
      });
      return;
    }

    // For now, show a message - actual deletion would need admin API
    toast({
      title: 'Account deletion requested',
      description: 'Please contact support to complete account deletion.',
    });
  }, [user, toast]);

  return {
    settings,
    loading,
    updateSetting,
    exportData,
    deleteAccount,
  };
};
