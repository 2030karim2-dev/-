// fetch-exchange-rates-aden/index.ts
// جلب أسعار صرف من API عام وحفظها بصيغة 1/rate (معدل التحويل إلى العملة الأساسية SAR)
// مثال: إذا كان 1 ريال سعودي = 410 ريال يمني، فالمعدل المحفوظ = 1/410 = 0.002439...

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const company_id: string | undefined = body?.company_id;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // استخراج المستخدم الحالي من Authorization header
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id ?? null;
    }

    // ==========================================
    // الخطوة 1: جلب أسعار الصرف من API مجاني
    // نستخدم open.er-api.com مع SAR كعملة أساسية
    // ==========================================
    let apiRates: Record<string, number> = {};
    let fetchSuccess = false;

    try {
      const ratesResponse = await fetch('https://open.er-api.com/v6/latest/SAR', {
        signal: AbortSignal.timeout(10000)
      });

      if (ratesResponse.ok) {
        const ratesData = await ratesResponse.json();
        if (ratesData?.result === 'success' && ratesData?.rates) {
          apiRates = ratesData.rates;
          fetchSuccess = true;
          console.log('[ExchangeRates] Successfully fetched rates from open.er-api.com');
        }
      }
    } catch (fetchError) {
      console.warn('[ExchangeRates] Primary API failed, trying fallback:', fetchError);
    }

    // Fallback: إذا فشل الـ API الأساسي جرب exchangerate-api
    if (!fetchSuccess) {
      try {
        const fallbackRes = await fetch('https://api.exchangerate-api.com/v4/latest/SAR', {
          signal: AbortSignal.timeout(8000)
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData?.rates) {
            apiRates = fallbackData.rates;
            fetchSuccess = true;
            console.log('[ExchangeRates] Fetched from fallback API');
          }
        }
      } catch (fallbackError) {
        console.warn('[ExchangeRates] Fallback API also failed:', fallbackError);
      }
    }

    if (!fetchSuccess || Object.keys(apiRates).length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'فشل جلب أسعار الصرف من جميع المصادر. يرجى المحاولة لاحقاً أو إدخال الأسعار يدوياً.'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // الخطوة 2: جلب العملات المسجلة في النظام
    // ==========================================
    const { data: currencies, error: currError } = await adminClient
      .from('supported_currencies')
      .select('code, is_base');

    if (currError) {
      throw new Error(`فشل جلب العملات: ${currError.message}`);
    }

    const nonBaseCurrencies = (currencies || []).filter(c => !c.is_base);

    if (nonBaseCurrencies.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'لا توجد عملات غير أساسية مسجلة', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // الخطوة 3: حساب المعدلات وحفظها
    //
    // المعادلة: rate_to_base = 1 / market_rate
    //
    // مثال: 1 ريال سعودي (SAR) = 410 ريال يمني (YER)
    // إذن: market_rate لـ YER = 410 (كمية YER لكل SAR)
    // rate_to_base لـ YER = 1 / 410 = 0.002439...
    // المعنى: لتحويل مبلغ بالريال اليمني إلى ريال سعودي × 0.002439
    // ==========================================
    const today = new Date().toISOString().split('T')[0];
    const updates: Array<{ currency: string; market_rate: number; rate_to_base: number }> = [];
    const errors: string[] = [];

    for (const currency of nonBaseCurrencies) {
      // market_rate = كم وحدة من هذه العملة تساوي 1 SAR
      const marketRate = apiRates[currency.code];

      if (!marketRate || marketRate <= 0) {
        errors.push(`لا يوجد سعر للعملة ${currency.code} في API`);
        console.warn(`[ExchangeRates] No rate found for ${currency.code}`);
        continue;
      }

      // التطبيق المطلوب: rate_to_base = 1 / market_rate
      const rateToBase = parseFloat((1 / marketRate).toFixed(10));

      updates.push({ currency: currency.code, market_rate: marketRate, rate_to_base: rateToBase });

      // حفظ في قاعدة البيانات فقط إذا تم تمرير company_id
      if (company_id) {
        const { error: insertError } = await adminClient
          .from('exchange_rates')
          .insert({
            company_id,
            currency_code: currency.code,
            rate_to_base: rateToBase,
            effective_date: today,
            created_by: userId
          });

        if (insertError) {
          errors.push(`فشل حفظ سعر ${currency.code}: ${insertError.message}`);
          console.error(`[ExchangeRates] Insert error for ${currency.code}:`, insertError);
        } else {
          console.log(`[ExchangeRates] Saved ${currency.code}: market=${marketRate}, stored=${rateToBase}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: updates.length,
        base_currency: 'SAR',
        effective_date: today,
        rates: updates,
        formula: '1 / market_rate',
        formula_example: 'إذا 1 SAR = 410 YER، فالمخزون = 1/410 = 0.002439',
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    console.error('[ExchangeRates] Unhandled error:', message);

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
