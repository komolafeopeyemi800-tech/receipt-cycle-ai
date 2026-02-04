import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { messages, type = 'chat', context } = await req.json();

    // System prompts based on type
    const systemPrompts: Record<string, string> = {
      chat: `You are a helpful financial assistant for Receipt Cycle, an AI-powered expense tracking app. 
You help users understand their spending patterns, provide budgeting advice, and answer questions about their finances.
Be friendly, concise, and provide actionable insights. When discussing money, be specific with numbers and percentages.
If the user provides transaction data, analyze it and provide insights.`,
      
      recommendation: `You are a financial advisor AI for Receipt Cycle. Analyze the user's spending data and provide:
1. Spending pattern insights
2. Money-saving recommendations
3. Budget optimization tips
4. Potential money leaks or subscriptions to review
Be specific with numbers and actionable with suggestions.`,
      
      categorize: `You are a transaction categorization assistant. Based on the merchant name and transaction details, 
suggest the most appropriate category from: Food & Dining, Shopping, Transportation, Entertainment, Bills, Health, Education, Other.
Also suggest relevant tags. Respond in JSON format: {"category": "...", "tags": [...], "confidence": 0.0-1.0}`,
    };

    const systemPrompt = systemPrompts[type] || systemPrompts.chat;
    
    // Add context if provided (like transaction history)
    let contextMessage = '';
    if (context) {
      if (context.transactions) {
        contextMessage = `\n\nUser's recent transaction data:\n${JSON.stringify(context.transactions, null, 2)}`;
      }
      if (context.summary) {
        contextMessage += `\n\nSpending summary:\n${JSON.stringify(context.summary, null, 2)}`;
      }
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt + contextMessage },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Stream the response
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
