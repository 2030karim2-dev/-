import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://esm.sh/openai@4.26.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Max-Age': '86400',
}

// Validate required fields
function validateRequest(body: any) {
  const { prompt, messages } = body;
  if (!prompt && (!messages || messages.length === 0)) {
    return { valid: false, error: 'Missing required field: prompt or messages' };
  }
  if (prompt && typeof prompt !== 'string') {
    return { valid: false, error: 'prompt must be a string' };
  }
  if (messages && !Array.isArray(messages)) {
    return { valid: false, error: 'messages must be an array' };
  }
  return { valid: true };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify Authentication using Supabase Auth getUser check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'Unauthorized: Missing Authorization header',
        code: 'AUTH_MISSING'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized: Invalid or expired JWT token',
        code: 'AUTH_INVALID',
        details: authError?.message
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse Request Body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({
        error: 'Invalid JSON in request body',
        code: 'INVALID_BODY'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Validate Request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({
        error: validation.error,
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, messages, model, systemInstruction, temperature, maxTokens, jsonMode } = body;

    // 4. Setup AI Providers
    const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GEMINI_KEY") || Deno.env.get("GOOGLE_API_KEY");

    if (!openrouterApiKey && !geminiApiKey) {
      return new Response(JSON.stringify({
        error: 'Server Error: Neither OPENROUTER_API_KEY nor GEMINI_API_KEY is configured in Supabase Edge Secrets',
        code: 'CONFIG_ERROR'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Construct Messages
    const finalMessages = messages || [];
    if (prompt) {
      if (systemInstruction) {
        finalMessages.push({ role: 'system', content: systemInstruction });
      }
      finalMessages.push({ role: 'user', content: prompt });
    }

    // 6. Execute AI Generation
    if (openrouterApiKey) {
      const openai = new OpenAI({
        apiKey: openrouterApiKey,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://alzhra-erp.vercel.app",
          "X-Title": "Al Zhra ERP Secure Proxy",
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const response = await openai.chat.completions.create({
          model: model || "google/gemini-2.5-flash",
          messages: finalMessages,
          temperature: temperature ?? 0.1,
          max_tokens: maxTokens ?? 1500,
          response_format: jsonMode ? { type: "json_object" } : undefined
        }, { signal: controller.signal });

        clearTimeout(timeoutId);

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        clearTimeout(timeoutId);

        // Handle specific OpenRouter errors
        if (error.status === 402) {
          return new Response(JSON.stringify({
            error: 'Insufficient funds in OpenRouter account',
            code: 'INSUFFICIENT_FUNDS',
            details: error.message
          }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (error.status === 429) {
          return new Response(JSON.stringify({
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT',
            details: error.message
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        throw error;
      }
    } else {
      // Direct Google Gemini API Fallback
      let geminiModel = model || "gemini-2.5-flash";
      if (geminiModel.startsWith("google/")) {
        geminiModel = geminiModel.replace("google/", "");
      }
      
      const contents = finalMessages.map((m: any) => {
        let role = m.role;
        if (role === 'assistant') role = 'model';
        if (role === 'system') role = 'user';
        return {
          role: role,
          parts: [{ text: m.content || '' }]
        };
      });

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
      
      const geminiBody: any = {
        contents: contents,
        generationConfig: {
          temperature: temperature ?? 0.1,
          maxOutputTokens: maxTokens ?? 1500,
        }
      };

      if (systemInstruction) {
        geminiBody.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      if (jsonMode) {
        geminiBody.generationConfig.responseMimeType = "application/json";
      }

      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(geminiBody)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
      }

      const geminiData = await response.json();
      const contentText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const mappedResponse = {
        choices: [
          {
            message: {
              role: "assistant",
              content: contentText
            },
            finish_reason: "stop",
            index: 0
          }
        ],
        usage: {
          prompt_tokens: geminiData.usageMetadata?.promptTokenCount || 0,
          completion_tokens: geminiData.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: geminiData.usageMetadata?.totalTokenCount || 0
        }
      };

      return new Response(JSON.stringify(mappedResponse), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error("AI Proxy Error:", error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
