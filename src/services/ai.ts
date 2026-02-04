const SUPABASE_URL = "https://tkbbupvauzmrvgpvkdlq.supabase.co";

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface InsightResult {
  success: boolean;
  type: string;
  data?: any;
  raw_response?: string;
  error?: string;
}

export const streamChat = async ({
  messages,
  type = 'chat',
  context,
  onDelta,
  onDone,
}: {
  messages: ChatMessage[];
  type?: 'chat' | 'recommendation' | 'categorize';
  context?: {
    transactions?: any[];
    summary?: any;
  };
  onDelta: (deltaText: string) => void;
  onDone: () => void;
}) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, type, context }),
  });

  if (!response.ok || !response.body) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to start chat stream');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = '';
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + '\n' + textBuffer;
        break;
      }
    }
  }

  // Final flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split('\n')) {
      if (!raw) continue;
      if (raw.endsWith('\r')) raw = raw.slice(0, -1);
      if (raw.startsWith(':') || raw.trim() === '') continue;
      if (!raw.startsWith('data: ')) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
};

export const getInsights = async (
  transactions: any[],
  type: 'summary' | 'recommendations' | 'money_leaks' | 'budget' = 'summary'
): Promise<InsightResult> => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-insights`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ transactions, type }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to get insights');
  }

  return response.json();
};

export const categorizeTransaction = async (
  merchantName: string,
  amount: number,
  description?: string
): Promise<{ category: string; tags: string[]; confidence: number }> => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      type: 'categorize',
      messages: [
        {
          role: 'user',
          content: `Categorize this transaction: Merchant: ${merchantName}, Amount: $${amount}${description ? `, Description: ${description}` : ''}`,
        },
      ],
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error('Failed to categorize transaction');
  }

  // Parse the streaming response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) fullContent += content;
      } catch { /* ignore */ }
    }
  }

  // Try to parse JSON from response
  try {
    const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch { /* ignore */ }

  // Default fallback
  return { category: 'Other', tags: [], confidence: 0.5 };
};
