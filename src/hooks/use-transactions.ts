import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  category: string;
  merchant: string | null;
  date: string;
  description: string | null;
  payment_method: string | null;
  tags: string[] | null;
  is_recurring: boolean | null;
  receipt_url: string | null;
  receipt_data: any;
  created_at: string;
  updated_at: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
  transactionCount: number;
  categoryBreakdown: { category: string; amount: number; count: number }[];
}

export const useTransactions = (dateRange?: { start: string; end: string }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (dateRange?.start) {
        query = query.gte('date', dateRange.start);
      }
      if (dateRange?.end) {
        query = query.lte('date', dateRange.end);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setTransactions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user, dateRange?.start, dateRange?.end]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const summary: TransactionSummary = {
    totalIncome: transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    netBalance: 0,
    savingsRate: 0,
    transactionCount: transactions.length,
    categoryBreakdown: [],
  };

  summary.netBalance = summary.totalIncome - summary.totalExpenses;
  summary.savingsRate = summary.totalIncome > 0 
    ? (summary.netBalance / summary.totalIncome) * 100 
    : 0;

  // Calculate category breakdown
  const categoryMap = new Map<string, { amount: number; count: number }>();
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const existing = categoryMap.get(t.category) || { amount: 0, count: 0 };
      categoryMap.set(t.category, {
        amount: existing.amount + t.amount,
        count: existing.count + 1,
      });
    });

  summary.categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.amount - a.amount);

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
    await fetchTransactions();
  };

  return {
    transactions,
    summary,
    loading,
    error,
    refetch: fetchTransactions,
    deleteTransaction,
  };
};

// Hook to get recent transactions (last 7 days)
export const useRecentTransactions = (limit = 10) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);

      setTransactions(data || []);
      setLoading(false);
    };

    fetch();
  }, [user, limit]);

  return { transactions, loading };
};

// Get monthly summary for the current month
export const useMonthlyTransactions = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  return useTransactions({ start: startOfMonth, end: endOfMonth });
};
