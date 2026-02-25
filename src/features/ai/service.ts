
import { aiApi } from './api';
import { FinancialDataSnapshot, AIInsight, InventoryDataSnapshot, InventoryAIInsight } from './types';

export const aiService = {
  /**
   * توليد تحليل عميق وشامل للوضع المالي للمنشأة
   * Generates a deep, comprehensive financial analysis using Gemini 1.5 Pro
   */
  generateReportAnalysis: async (data: FinancialDataSnapshot): Promise<AIInsight> => {
    // Construct a rich, context-aware prompt
    const prompt = `
      Act as an expert Chief Financial Officer (CFO) for an automotive spare parts business. 
      Analyze the following financial snapshot critically:

      ### 1. Profitability & Margins
      - Revenue: ${data.revenue.toLocaleString()} SAR
      - Expenses: ${data.expenses.toLocaleString()} SAR
      - Net Profit: ${data.netProfit.toLocaleString()} SAR
      - Gross Margin: ${data.grossMargin.toFixed(1)}%
      - Net Margin: ${data.netMargin.toFixed(1)}%
      - Revenue Growth (vs last period): ${data.growth_metrics.revenue_growth > 0 ? '+' : ''}${data.growth_metrics.revenue_growth.toFixed(1)}%
      - Expense Growth (vs last period): ${data.growth_metrics.expense_growth.toFixed(1)}%

      ### 2. Expense Breakdown (Top 3)
      ${data.topExpenses.map(e => `- ${e.name}: ${e.amount.toLocaleString()} SAR`).join('\n')}

      ### 3. Liquidity & Debt Position
      - Cash on Hand (Est.): ${data.debt_metrics.cash_on_hand.toLocaleString()} SAR
      - Total Receivables (Money owed to us): ${data.debt_metrics.total_receivables.toLocaleString()} SAR
      - Total Payables (Money we owe): ${data.debt_metrics.total_payables.toLocaleString()} SAR

      ### 4. Inventory Health
      - Total Inventory Valuation: ${data.inventory_metrics.total_valuation.toLocaleString()} SAR
      - Low Stock Items (Reorder needed): ${data.inventory_metrics.low_stock_count} Items

      ---

      ### YOUR MISSION:
      Provide a strategic financial assessment in strictly valid JSON format.
      
      Output JSON Structure:
      {
        "title": "Short, punchy title for the report (Arabic)",
        "summary": "2-3 sentences executive summary of the financial health (Arabic)",
        "health_score": number (0-100 based on margins, liquidity, and growth),
        "risk_analysis": [
          { "risk": "Description of risk (Arabic)", "severity": "low" | "medium" | "high" | "critical" }
        ],
        "opportunities": [
          { "opportunity": "Description of opportunity (Arabic)", "impact": "low" | "medium" | "high" }
        ],
        "anomalies": [ "List strings of any detected anomalies (e.g. high expenses vs low revenue) (Arabic)" ],
        "recommendations": [ "3 specific, actionable steps (Arabic)" ]
      }

      CRITICAL INSTRUCTIONS:
      - Respond ONLY in valid JSON. No markdown formatting.
      - Ensure "health_score" is a number between 0 and 100.
      - If Net Margin is negative, health_score must be below 50.
      - If Expenses > Revenue, flag it as a critical risk.
      - If Low Stock Items > 10, flag it as a medium/high risk depending on revenue impact.
    `;

    try {
      const result = await aiApi.analyzeFinancials(prompt);

      // Clean the result (remove markdown code blocks if any)
      const cleanedResult = result?.replace(/```json/g, '').replace(/```/g, '').trim();

      if (!cleanedResult) throw new Error("Empty response from AI");

      const parsed: AIInsight = JSON.parse(cleanedResult);

      return {
        ...parsed,
        last_updated: new Date().toISOString()
      };

    } catch (e: any) {
      console.error("AI Analysis Failed:", e);

      let errorTitle = "تعذر التحليل الذكي";
      let errorSummary = "واجه النظام صعوبة في إنشاء التحليل.";
      let recommendations = ["حاول تحديث الصفحة"];

      const errorMessage = e?.message || JSON.stringify(e);

      if (errorMessage.includes("API_KEY") || errorMessage.includes("مفقود") || errorMessage.includes("API key not valid") || errorMessage.includes("invalid_api_key")) {
        errorTitle = "مفتاح API مفقود أو غير صالح";
        errorSummary = "لم يتم تهيئة مفتاح الذكاء الاصطناعي بشكل صحيح. تحقق من OpenRouter أو Gemini.";
        recommendations = ["تأكد من إعداد VITE_OPENROUTER_API_KEY أو VITE_GEMINI_API_KEY في ملف .env", "تحقق من صلاحية المفتاح في openrouter.ai أو Google AI Studio"];
      } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("Network")) {
        errorTitle = "خطأ في الاتصال";
        errorSummary = "تعذر الوصول إلى خوادم Google AI. يرجى التحقق من اتصال الإنترنت.";
        recommendations = ["تأكد من استقرار اتصال الإنترنت", "تحقق من عدم وجود جدار حماية يمنع الاتصال"];
      } else if (errorMessage.includes("JSON")) {
        errorTitle = "خطأ في معالجة البيانات";
        errorSummary = "استلم النظام رداً غير صالح من الذكاء الاصطناعي.";
      } else if (errorMessage.includes("model not found") || errorMessage.includes("404")) {
        errorTitle = "خطأ في تهيئة النموذج";
        errorSummary = "نموذج الذكاء الاصطناعي المطلوب غير متاح حالياً.";
      }

      return {
        title: errorTitle,
        summary: errorSummary,
        health_score: 0,
        risk_analysis: [
          { risk: errorTitle, severity: "critical" }
        ],
        opportunities: [],
        anomalies: [],
        recommendations: recommendations,
        last_updated: new Date().toISOString()
      };
    }
  },

  /**
   * توليد تحليل أداء ومخاطر المخزون الذكي
   * Generates smart inventory insights using Gemini
   */
  generateInventoryAnalysis: async (data: InventoryDataSnapshot): Promise<InventoryAIInsight> => {
    const prompt = `
      Act as an expert Supply Chain & Inventory Manager for an automotive spare parts business. 
      Analyze the following inventory performance snapshot critically:

      ### 1. Overall Health
      - Total Valuation: ${data.total_valuation.toLocaleString()} SAR
      - Total Unique Products: ${data.total_products}
      - Total Items in Stock: ${data.total_qty}
      - Low Stock Items: ${data.low_stock_count}
      - Out of Stock Items: ${data.out_of_stock_count}

      ### 2. ABC Classification Value
      - Class A Items: ${data.abc_summary.a_items}
      - Class B Items: ${data.abc_summary.b_items}
      - Class C Items: ${data.abc_summary.c_items}

      ### 3. Top Moving Products (Last Period)
      ${data.top_moving.map(p => `- ${p.name}: ${p.qtySold} sold (Revenue: ${p.revenue.toLocaleString()} SAR)`).join('\n')}

      ### 4. Critical Alerts (Stock out risk)
      ${data.critical_alerts.map(p => `- ${p.name}: ${p.stock} left, runs out in ${p.days_remaining} days (Velocity: ${p.velocity.toFixed(2)}/day)`).join('\n')}

      ### 5. Stagnant Inventory (Dead Stock risk)
      ${data.stagnant_items.map(p => `- ${p.name}: ${p.stock} units, stagnant for ${p.days_stagnant} days`).join('\n')}

      ---

      ### YOUR MISSION:
      Provide a strategic inventory assessment in strictly valid JSON format.
      
      Output JSON Structure:
      {
        "title": "Short, punchy title for the inventory insight (Arabic)",
        "summary": "2-3 sentences executive summary of the inventory health (Arabic)",
        "health_score": number (0-100 based on stock balance, stagnant stats, and out-of-stock risk),
        "risk_analysis": [
          { "risk": "Description of risk (Arabic)", "severity": "low" | "medium" | "high" | "critical" }
        ],
        "opportunities": [
          { "opportunity": "Description of opportunity (Arabic)", "impact": "low" | "medium" | "high" }
        ],
        "anomalies": [ "List strings of any detected anomalies (e.g. fast moving items running out) (Arabic)" ],
        "recommendations": [ "3 specific, actionable steps (Arabic)" ]
      }

      CRITICAL INSTRUCTIONS:
      - Respond ONLY in valid JSON. No markdown formatting.
      - Focus specifically on inventory. Do not give general financial advice unless tied to trapped cash in inventory.
      - Ensure "health_score" is a number between 0 and 100.
      - If Out of Stock items are high or Top Moving products are critically low on stock, lower the health score.
      - If dead stock (stagnant) makes up a huge portion of inventory, flag it as a critical risk.
    `;

    try {
      const result = await aiApi.analyzeFinancials(prompt); // Re-using analyzeFinancials endpoint as it's the exact same prompt structure

      // Clean the result
      const cleanedResult = result?.replace(/```json/g, '').replace(/```/g, '').trim();
      if (!cleanedResult) throw new Error("Empty response from AI");

      const parsed: InventoryAIInsight = JSON.parse(cleanedResult);

      return {
        ...parsed,
        last_updated: new Date().toISOString()
      };

    } catch (e: any) {
      console.error("Inventory AI Analysis Failed:", e);

      return {
        title: "غير قادر على تحليل المخزون",
        summary: "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي لإنشاء تحليل ذكي للمخزون.",
        health_score: 0,
        risk_analysis: [{ risk: "تعذر توليد التحليل", severity: "critical" }],
        opportunities: [],
        anomalies: [],
        recommendations: ["يرجى التأكد من اتصال الإنترنت وإعدادات مفتاح AI"],
        last_updated: new Date().toISOString()
      };
    }
  },

  /**
   * ملخص يومي ذكي
   */
  generateDailySummary: async (context: string): Promise<string> => {
    const prompt = `أنشئ ملخصاً يومياً مختصراً (4 نقاط) لحالة الجعفري لقطع غيار السيارات:\n${context}\nالتاريخ: ${new Date().toLocaleDateString('ar-SA')}\nاكتب بإيموجي واحد لكل نقطة. لا JSON.`;
    try {
      return await aiApi.analyzeFinancials(prompt);
    } catch {
      return '⚠️ تعذر إنشاء الملخص';
    }
  },

  /**
   * اقتراح التسعير الذكي
   */
  generateSmartPricing: async (product: { name: string; purchasePrice: number; currentPrice: number; avgSales: number }): Promise<{ suggestedPrice: number; reason: string }> => {
    const prompt = `أنت خبير تسعير قطع غيار سيارات في الجعفري.
المنتج: ${product.name}
سعر الشراء: ${product.purchasePrice}
السعر الحالي: ${product.currentPrice}
متوسط المبيعات الشهري: ${product.avgSales} وحدة

اقترح سعر بيع مثالي. رد بـ JSON فقط:
{"suggestedPrice": number, "reason": "سبب مختصر بالعربي"}`;

    try {
      const result = await aiApi.analyzeFinancials(prompt);
      const cleaned = result.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { suggestedPrice: product.currentPrice, reason: 'تعذر التحليل' };
    }
  },

  /**
   * توقع المبيعات
   */
  generateSalesForecast: async (monthlySales: { month: string; total: number }[]): Promise<{ forecast: number; trend: string; tips: string[] }> => {
    const prompt = `أنت محلل مبيعات خبير في قطع غيار السيارات (الجعفري).
بيانات المبيعات الشهرية:
${monthlySales.map(m => `${m.month}: ${m.total.toLocaleString()}`).join('\n')}

توقع مبيعات الشهر القادم. رد بـ JSON فقط:
{"forecast": number, "trend": "صاعد|هابط|مستقر", "tips": ["نصيحة1", "نصيحة2"]}`;

    try {
      const result = await aiApi.analyzeFinancials(prompt);
      const cleaned = result.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { forecast: 0, trend: 'مستقر', tips: ['تعذر التحليل'] };
    }
  },

  /**
   * اقتراح طلبات شراء ذكية
   */
  generateSmartPurchaseOrders: async (lowStockItems: { name: string; current: number; minStock: number; avgMonthlyUsage: number }[]): Promise<{ items: { name: string; suggestedQty: number; priority: string }[]; summary: string }> => {
    const prompt = `أنت مدير مشتريات خبير في الجعفري لقطع غيار السيارات.
المنتجات المنخفضة المخزون:
${lowStockItems.map(i => `${i.name}: متوفر ${i.current}، الحد الأدنى ${i.minStock}، الاستهلاك الشهري ~${i.avgMonthlyUsage}`).join('\n')}

اقترح كميات شراء مثالية. رد بـ JSON فقط:
{"items": [{"name": "اسم", "suggestedQty": number, "priority": "عاجل|متوسط|منخفض"}], "summary": "ملخص مختصر"}`;

    try {
      const result = await aiApi.analyzeFinancials(prompt);
      const cleaned = result.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { items: [], summary: 'تعذر التحليل' };
    }
  },

  /**
   * كشف الفواتير المشبوهة
   */
  analyzeInvoiceSuspicion: async (invoice: { number: string; total: number; itemCount: number; customerName: string; customerDebt: number; avgInvoiceTotal: number }): Promise<{ riskLevel: 'low' | 'medium' | 'high'; alerts: string[] }> => {
    const prompt = `أنت مدقق مالي خبير في الجعفري لقطع غيار السيارات.
حلل هذه الفاتورة:
رقم الفاتورة: ${invoice.number}
الإجمالي: ${invoice.total.toLocaleString()}
عدد الأصناف: ${invoice.itemCount}
العميل: ${invoice.customerName}
ديون العميل الحالية: ${invoice.customerDebt.toLocaleString()}
متوسط الفواتير السابقة: ${invoice.avgInvoiceTotal.toLocaleString()}

هل هناك ما يثير الشبهة؟ رد بـ JSON فقط:
{"riskLevel": "low|medium|high", "alerts": ["تنبيه1..."]}`;

    try {
      const result = await aiApi.analyzeFinancials(prompt);
      const cleaned = result.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { riskLevel: 'low', alerts: [] };
    }
  },

  /**
   * التنبؤ بنفاد المخزون
   */
  predictStockDepletion: async (products: { name: string; currentStock: number; avgDailySales: number }[]): Promise<{ items: { name: string; daysLeft: number; urgency: string }[] }> => {
    const prompt = `أنت خبير إدارة مخزون قطع غيار سيارات في الجعفري.
المنتجات:
${products.map(p => `${p.name}: مخزون ${p.currentStock}، متوسط البيع اليومي ${p.avgDailySales.toFixed(1)}`).join('\n')}

احسب عدد الأيام المتبقية قبل نفاد كل منتج. رد بـ JSON فقط:
{"items": [{"name": "اسم", "daysLeft": number, "urgency": "حرج|تحذير|آمن"}]}`;

    try {
      const result = await aiApi.analyzeFinancials(prompt);
      return JSON.parse(result.replace(/```json|```/g, '').trim());
    } catch {
      return { items: products.map(p => ({ name: p.name, daysLeft: p.avgDailySales > 0 ? Math.round(p.currentStock / p.avgDailySales) : 999, urgency: 'آمن' })) };
    }
  },

  /**
   * تصنيف العملاء الذكي
   */
  segmentCustomers: async (customers: { name: string; totalPurchases: number; lastPurchaseDate: string; invoiceCount: number; balance: number }[]): Promise<{ segments: { name: string; segment: string; recommendation: string }[] }> => {
    const prompt = `أنت خبير علاقات عملاء في الجعفري لقطع غيار السيارات.
صنف هؤلاء العملاء:
${customers.slice(0, 20).map(c => `${c.name}: إجمالي مشتريات ${c.totalPurchases.toLocaleString()}, آخر شراء ${c.lastPurchaseDate}, عدد فواتير ${c.invoiceCount}, رصيد ${c.balance.toLocaleString()}`).join('\n')}

التصنيفات: VIP (شراء عالي ومتكرر), معرض للانسحاب (لم يشترِ منذ فترة), جديد (أقل من 3 فواتير), عادي
رد بـ JSON فقط:
{"segments": [{"name": "اسم", "segment": "VIP|معرض للانسحاب|جديد|عادي", "recommendation": "توصية مختصرة"}]}`;

    try {
      const result = await aiApi.analyzeFinancials(prompt);
      return JSON.parse(result.replace(/```json|```/g, '').trim());
    } catch {
      return { segments: [] };
    }
  },

  /**
   * اقتراح بيع إضافي (Cross-sell)
   */
  suggestCrossSell: async (currentItems: string[]): Promise<{ suggestions: { name: string; reason: string }[] }> => {
    const prompt = `أنت خبير مبيعات قطع غيار سيارات في الجعفري.
العميل يشتري حالياً: ${currentItems.join('، ')}

ما المنتجات الإضافية التي قد يحتاجها؟ (بناءً على خبرتك في قطع الغيار)
مثال: من يشتري فلتر زيت غالباً يحتاج زيت محرك.
رد بـ JSON فقط (3 اقتراحات كحد أقصى):
{"suggestions": [{"name": "اسم المنتج", "reason": "سبب مختصر"}]}`;

    try {
      const result = await aiApi.analyzeFinancials(prompt);
      return JSON.parse(result.replace(/```json|```/g, '').trim());
    } catch {
      return { suggestions: [] };
    }
  },

  /**
   * تقييم الموردين بالذكاء الاصطناعي
   */
  rateSuppliers: async (suppliers: { name: string; totalPurchases: number; avgDeliveryDays: number; returnRate: number; balance: number }[]): Promise<{ ratings: { name: string; score: number; strengths: string; weaknesses: string }[] }> => {
    const prompt = `أنت خبير مشتريات في الجعفري لقطع غيار السيارات.
قيّم هؤلاء الموردين:
${suppliers.slice(0, 15).map(s => `${s.name}: مشتريات ${s.totalPurchases.toLocaleString()}, متوسط التسليم ${s.avgDeliveryDays} يوم, معدل الإرجاع ${s.returnRate}%, رصيد ${s.balance.toLocaleString()}`).join('\n')}

أعط كل مورد نقاط من 10. رد بـ JSON فقط:
{"ratings": [{"name": "اسم", "score": number, "strengths": "نقاط قوة", "weaknesses": "نقاط ضعف"}]}`;

    try {
      const result = await aiApi.analyzeFinancials(prompt);
      return JSON.parse(result.replace(/```json|```/g, '').trim());
    } catch {
      return { ratings: [] };
    }
  },

  /**
   * تحويل أمر نصي إلى بيانات فاتورة
   */
  parseInvoiceCommand: async (command: string): Promise<{ customerName: string; items: { name: string; quantity: number; price: number }[]; paymentMethod: string }> => {
    const prompt = `أنت نظام معالجة أوامر الفوترة في الجعفري لقطع غيار السيارات.
حول هذا الأمر النصي إلى بيانات فاتورة:
"${command}"

أمثلة:
- "فاتورة لأحمد: 3 فلتر زيت بـ 25، 2 بطارية بـ 200" → محمول على الأصناف
- "بيع 5 شمعات إشعال بسعر 15 ريال نقداً" → بدون اسم عميل

رد بـ JSON فقط:
{"customerName": "اسم العميل أو فارغ", "items": [{"name": "اسم المنتج", "quantity": number, "price": number}], "paymentMethod": "cash|credit"}`;

    try {
      const result = await aiApi.analyzeFinancials(prompt);
      return JSON.parse(result.replace(/```json|```/g, '').trim());
    } catch {
      return { customerName: '', items: [], paymentMethod: 'cash' };
    }
  },

  /**
   * تقرير مخصص بالأمر النصي
   */
  generateCustomReport: async (question: string, context: string): Promise<string> => {
    const prompt = `أنت محلل مالي خبير في الجعفري لقطع غيار السيارات.
البيانات المتاحة:
${context}

سؤال المستخدم: "${question}"

أنشئ تقريراً مختصراً وعملياً بالعربية مع أرقام وإحصائيات. استخدم إيموجي باعتدال. لا JSON.`;

    try {
      return await aiApi.analyzeFinancials(prompt);
    } catch {
      return '⚠️ تعذر إنشاء التقرير';
    }
  },

  /**
   * اقتراح القيود المحاسبية
   */
  suggestJournalEntry: async (description: string, amount: number): Promise<{ debitAccount: string; creditAccount: string; explanation: string }> => {
    const prompt = `أنت محاسب قانوني خبير في الجعفري لقطع غيار السيارات.
اقترح القيد المحاسبي المناسب:
الوصف: "${description}"
المبلغ: ${amount.toLocaleString()}

الحسابات الشائعة: الصندوق، البنك، المبيعات، المشتريات، الذمم المدينة، الذمم الدائنة، مصروفات الإيجار، مصروفات الرواتب، المخزون، رأس المال

رد بـ JSON فقط:
{"debitAccount": "الحساب المدين", "creditAccount": "الحساب الدائن", "explanation": "شرح مختصر"}`;

    try {
      const result = await aiApi.analyzeFinancials(prompt);
      return JSON.parse(result.replace(/```json|```/g, '').trim());
    } catch {
      return { debitAccount: '', creditAccount: '', explanation: 'تعذر التحليل' };
    }
  },

  /**
   * ملخص صباحي لـ WhatsApp
   */
  generateMorningBrief: async (context: string): Promise<string> => {
    const prompt = `أنت المساعد الذكي للجعفري لقطع غيار السيارات.
أنشئ ملخصاً صباحياً مختصراً مناسباً للإرسال عبر واتساب.
البيانات:
${context}
التاريخ: ${new Date().toLocaleDateString('ar-SA')}

التنسيق المطلوب:
- عنوان مع إيموجي
- 4-5 نقاط مختصرة
- خاتمة تحفيزية
- لا JSON — نص عادي فقط`;

    try {
      return await aiApi.analyzeFinancials(prompt);
    } catch {
      return '⚠️ تعذر إنشاء الملخص الصباحي';
    }
  },

  /**
   * مؤشر صحة الأعمال (0-100)
   */
  calculateBusinessHealth: async (data: { revenue: number; expenses: number; netProfit: number; receivables: number; payables: number; liquidity: number; lowStockCount: number; totalProducts: number }): Promise<{ score: number; grade: string; factors: { name: string; impact: string; score: number }[]; advice: string }> => {
    const prompt = `أنت محلل أعمال خبير في الجعفري لقطع غيار السيارات.
أعط تقييماً شاملاً لصحة الأعمال من 0 إلى 100:
الإيرادات: ${data.revenue.toLocaleString()}
المصروفات: ${data.expenses.toLocaleString()}
صافي الربح: ${data.netProfit.toLocaleString()}
ديون العملاء: ${data.receivables.toLocaleString()}
التزامات الموردين: ${data.payables.toLocaleString()}
السيولة: ${data.liquidity.toLocaleString()}
منتجات منخفضة المخزون: ${data.lowStockCount} من ${data.totalProducts}

رد بـ JSON فقط:
{"score": number, "grade": "ممتاز|جيد جداً|جيد|مقبول|ضعيف", "factors": [{"name": "اسم العامل", "impact": "إيجابي|سلبي", "score": number}], "advice": "نصيحة واحدة أهم"}`;

    try {
      const result = await aiApi.analyzeFinancials(prompt);
      return JSON.parse(result.replace(/```json|```/g, '').trim());
    } catch {
      return { score: 50, grade: 'مقبول', factors: [], advice: 'تعذر التحليل' };
    }
  },

  /**
   * كشف الشذوذ في المعاملات
   */
  detectAnomalies: async (transactions: { type: string; amount: number; date: string; description: string }[]): Promise<{ anomalies: { description: string; amount: number; reason: string; severity: string }[] }> => {
    const prompt = `أنت مدقق مالي خبير في الجعفري لقطع غيار السيارات.
حلل هذه المعاملات الأخيرة وابحث عن أي شذوذ (مبالغ غير عادية، أنماط مشبوهة):
${transactions.slice(0, 20).map(t => `${t.type}: ${t.amount.toLocaleString()} - ${t.description} (${t.date})`).join('\n')}

رد بـ JSON فقط:
{"anomalies": [{"description": "وصف", "amount": number, "reason": "سبب الشبهة", "severity": "عالي|متوسط|منخفض"}]}`;

    try {
      const result = await aiApi.analyzeFinancials(prompt);
      return JSON.parse(result.replace(/```json|```/g, '').trim());
    } catch {
      return { anomalies: [] };
    }
  },

  /**
   * تحليل السوق والمنافسة
   */
  analyzeMarketPosition: async (data: { topProducts: string[]; avgMargin: number; monthlyRevenue: number }): Promise<{ insights: string[]; opportunities: string[]; threats: string[] }> => {
    const prompt = `أنت خبير سوق قطع غيار السيارات في المنطقة العربية.
بيانات الجعفري لقطع غيار السيارات:
أكثر المنتجات مبيعاً: ${data.topProducts.join('، ')}
هامش الربح المتوسط: ${data.avgMargin.toFixed(1)}%
الإيراد الشهري: ${data.monthlyRevenue.toLocaleString()}

حلل الوضع التنافسي مقارنة بسوق قطع الغيار. رد بـ JSON فقط:
{"insights": ["ملاحظة1", "ملاحظة2"], "opportunities": ["فرصة1"], "threats": ["تهديد1"]}`;

    try {
      const result = await aiApi.analyzeFinancials(prompt);
      return JSON.parse(result.replace(/```json|```/g, '').trim());
    } catch {
      return { insights: [], opportunities: [], threats: [] };
    }
  },
};
