import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://esm.sh/openai@4.26.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse Request Body
    const { prompt, messages, model, systemInstruction, temperature, maxTokens, jsonMode } = await req.json();
    
    // 3. Setup OpenRouter Client
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server Error: OPENROUTER_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://alzhra-erp.vercel.app",
        "X-Title": "Al Zhra ERP Secure Proxy",
      }
    });

    // 4. Construct Messages
    const finalMessages = messages || [];
    if (prompt) {
      if (systemInstruction) {
        finalMessages.push({ role: 'system', content: systemInstruction });
      }
      finalMessages.push({ role: 'user', content: prompt });
    }

    // 5. Execute AI Generation
    const response = await openai.chat.completions.create({
      model: model || "google/gemini-2.0-flash",
      messages: finalMessages,
      temperature: temperature ?? 0.1,
      max_tokens: maxTokens ?? 1500,
      response_format: jsonMode ? { type: "json_object" } : undefined
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("AI Proxy Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
