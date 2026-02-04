import { useState, useCallback } from 'react';
import { ChatMessage, streamChat, getInsights, InsightResult } from '@/services/ai';
import { useToast } from '@/hooks/use-toast';

export const useAIChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = useCallback(async (
    content: string,
    context?: { transactions?: any[]; summary?: any }
  ) => {
    const userMessage: ChatMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = '';

    try {
      await streamChat({
        messages: [...messages, userMessage],
        context,
        onDelta: (chunk) => {
          assistantContent += chunk;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant') {
              return prev.map((m, i) => 
                i === prev.length - 1 ? { ...m, content: assistantContent } : m
              );
            }
            return [...prev, { role: 'assistant', content: assistantContent }];
          });
        },
        onDone: () => setIsLoading(false),
      });
    } catch (err) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Chat failed';
      toast({
        title: 'AI Chat Error',
        description: message,
        variant: 'destructive',
      });
    }
  }, [messages, toast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
};

export const useAIInsights = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<InsightResult | null>(null);
  const { toast } = useToast();

  const fetchInsights = useCallback(async (
    transactions: any[],
    type: 'summary' | 'recommendations' | 'money_leaks' | 'budget' = 'summary'
  ) => {
    setIsLoading(true);
    
    try {
      const result = await getInsights(transactions, type);
      setInsights(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get insights';
      toast({
        title: 'Insights Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    insights,
    isLoading,
    fetchInsights,
  };
};
