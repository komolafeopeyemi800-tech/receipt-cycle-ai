import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LANDING_AI_API_KEY = Deno.env.get('LANDING_AI_API_KEY');
    if (!LANDING_AI_API_KEY) {
      throw new Error('LANDING_AI_API_KEY is not configured');
    }

    const contentType = req.headers.get('content-type') || '';
    let imageData: Blob | null = null;
    let imageUrl: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await req.formData();
      const file = formData.get('document') as File;
      if (file) {
        imageData = file;
      }
      imageUrl = formData.get('document_url') as string;
    } else if (contentType.includes('application/json')) {
      // Handle base64 or URL
      const body = await req.json();
      if (body.document_url) {
        imageUrl = body.document_url;
      } else if (body.document_base64) {
        // Convert base64 to blob
        const base64Data = body.document_base64.replace(/^data:image\/\w+;base64,/, '');
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        imageData = new Blob([binaryData], { type: 'image/jpeg' });
      }
    }

    if (!imageData && !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'No document provided. Please provide a file or URL.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Parse the document with Landing AI
    const parseFormData = new FormData();
    if (imageData) {
      parseFormData.append('document', imageData, 'receipt.jpg');
    } else if (imageUrl) {
      parseFormData.append('document_url', imageUrl);
    }
    parseFormData.append('model', 'dpt-2-latest');

    console.log('Calling Landing AI Parse API...');
    const parseResponse = await fetch('https://api.va.landing.ai/v1/ade/parse', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LANDING_AI_API_KEY}`,
      },
      body: parseFormData,
    });

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      console.error('Landing AI Parse error:', parseResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `OCR parsing failed: ${parseResponse.status}`, details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parseResult = await parseResponse.json();
    console.log('Parse result received:', JSON.stringify(parseResult).substring(0, 500));

    // Step 2: Extract structured data using Landing AI Extract API
    const extractSchema = {
      type: "object",
      properties: {
        merchant_name: { type: "string", description: "The store or merchant name" },
        total_amount: { type: "number", description: "The total amount on the receipt" },
        subtotal: { type: "number", description: "The subtotal before tax" },
        tax_amount: { type: "number", description: "The tax amount" },
        date: { type: "string", description: "The transaction date in YYYY-MM-DD format" },
        payment_method: { type: "string", description: "The payment method used (cash, credit, debit, etc.)" },
        category: { type: "string", description: "Suggested category (Food & Dining, Shopping, Transportation, Entertainment, Bills, Health, Education, Other)" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              quantity: { type: "number" },
              price: { type: "number" }
            }
          },
          description: "List of items on the receipt"
        },
        currency: { type: "string", description: "The currency code (USD, EUR, etc.)" }
      },
      required: ["merchant_name", "total_amount"]
    };

    console.log('Calling Landing AI Extract API...');
    const extractResponse = await fetch('https://api.va.landing.ai/v1/ade/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LANDING_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        markdown: parseResult.markdown,
        chunks: parseResult.chunks,
        schema: extractSchema,
      }),
    });

    if (!extractResponse.ok) {
      const errorText = await extractResponse.text();
      console.error('Landing AI Extract error:', extractResponse.status, errorText);
      // Return parse result even if extract fails
      return new Response(
        JSON.stringify({
          success: true,
          raw_data: parseResult,
          extracted_data: null,
          error: 'Extraction failed, returning raw data',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extractResult = await extractResponse.json();
    console.log('Extract result:', JSON.stringify(extractResult));

    // Return combined result with visual grounding
    return new Response(
      JSON.stringify({
        success: true,
        raw_data: {
          markdown: parseResult.markdown,
          chunks: parseResult.chunks,
          metadata: parseResult.metadata,
        },
        extracted_data: extractResult,
        visual_grounding: parseResult.chunks?.map((chunk: any) => ({
          id: chunk.id,
          type: chunk.type,
          text: chunk.markdown,
          position: chunk.grounding,
        })) || [],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scan receipt error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
