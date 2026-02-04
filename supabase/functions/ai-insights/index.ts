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

    const { transactions, type = 'summary' } = await req.json();

    if (!transactions || !Array.isArray(transactions)) {
      return new Response(
        JSON.stringify({ error: 'Transactions array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompts: Record<string, string> = {
      summary: `Analyze these transactions and provide a brief spending summary with:
1. Total spending by category (as percentages)
2. Top 3 spending areas
3. Comparison to typical spending patterns
4. One key insight about their habits

Respond in JSON format:
{
  "total_spent": number,
  "by_category": {"category": percentage},
  "top_areas": ["area1", "area2", "area3"],
  "insight": "string",
  "health_score": 1-100
}`,

      recommendations: `Based on these transactions, provide 3-5 personalized money-saving recommendations:
1. Identify potential unnecessary expenses
2. Find duplicate or overlapping subscriptions
3. Suggest alternatives for high-cost categories
4. Provide a potential monthly savings estimate

Respond in JSON format:
{
  "recommendations": [
    {"title": "...", "description": "...", "potential_savings": number, "priority": "high|medium|low"}
  ],
  "total_potential_savings": number
}`,

      money_leaks: `Identify money leaks from these transactions:
1. Recurring small purchases that add up
2. Subscriptions or memberships
3. Impulse purchases patterns
4. Hidden fees or charges

Respond in JSON format:
{
  "leaks": [
    {"type": "...", "description": "...", "monthly_cost": number, "suggestion": "..."}
  ],
  "total_monthly_leaks": number
}`,

      budget: `Based on spending patterns in these transactions, suggest an optimal monthly budget:
1. Recommended allocation by category
2. Savings target
3. Areas to reduce
4. Areas where current spending is healthy

Respond in JSON format:
{
  "recommended_budget": {"category": amount},
  "total_budget": number,
  "savings_target": number,
  "reduce_in": ["category1"],
  "healthy_spending": ["category2"]
}`,
    };

    const prompt = prompts[type] || prompts.summary;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { 
            role: 'system', 
            content: 'You are a financial analysis AI. Analyze transaction data and provide insights in the requested JSON format. Be precise with numbers and practical with advice.' 
          },
          { 
            role: 'user', 
            content: `${prompt}\n\nTransactions:\n${JSON.stringify(transactions, null, 2)}` 
          },
        ],
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

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';

    // Try to parse JSON from the response
    let parsedData = null;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    } catch (e) {
      console.log('Could not parse JSON from response, returning raw content');
    }

    return new Response(
      JSON.stringify({
        success: true,
        type,
        data: parsedData,
        raw_response: parsedData ? undefined : content,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI insights error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
