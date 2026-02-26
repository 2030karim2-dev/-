export const documentAiService = {
  /**
   * تحليل المستند واستخراج كافة التفاصيل بما في ذلك المورد والشركة الصانعة
   */
  parseDocument: async (file: File, type: 'invoice' | 'inventory') => {
    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) throw new Error("مفتاح OpenRouter مفقود. أضف المفتاح في ملف .env");

      // تحويل الصورة إلى Data URL ليتعرف عليها OpenRouter
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const systemInstruction = type === 'invoice'
        ? `You are an expert OCR and data entry system for auto parts invoices. 
           Analyze this invoice and extract EVERY SINGLE ITEM in the table. 
           
           CRITICAL RULES for each item:
           - name: COMBINE the "Description" column AND the "Car Model" column together into ONE field.
             Example: If Description="Radiator Coolant Hose" and Car Model="Toyota Hilux 1994-2008", 
             then name="Radiator Coolant Hose - Toyota Hilux 1994-2008".
             This is ESSENTIAL — the car model MUST be part of the name.
           - partNumber: The PART No. or OEM reference number (e.g. CLIENT'S No or PART No column).
           - brand: The BRAND column value (e.g. Neutral, RAM, EEP, etc.). Always include this field.
           - quantity: The QTY number.
           - unitPrice: The PRICE per unit (numeric value only, no currency symbols).
           
           Also, identify the supplierName (Seller Name / اسم المورد).
           
           CURRENCY DETECTION:
           - If prices show the ¥ symbol or are labeled "RMB" or "CNY" or "Yuan", set currency to "CNY".
           - If prices show $ or labeled "USD", set currency to "USD". 
           - If prices show ر.س or labeled "SAR", set currency to "SAR".
           - Otherwise detect from context.
           
           Return ONLY a valid JSON object:
           {
             "currency": "CNY",
             "supplierName": "Supplier Name",
             "items": [
                { "name": "Description - Car Model", "partNumber": "...", "brand": "...", "quantity": 0, "unitPrice": 0 }
             ]
           }`
        : `You are an inventory auditor. Extract EVERY product from this list.
           Include: name, partNumber, brand, stock_quantity, cost_price.
           Return ONLY a JSON object with "items" array.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Al-Zahra Smart ERP',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001', // Using gemini via openrouter to bypass direct IP blocking
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemInstruction },
            {
              role: 'user',
              content: [
                { type: "text", text: "Extract all items, brands, and supplier info. Return valid JSON only." },
                { type: "image_url", image_url: { url: base64Image } }
              ]
            }
          ],
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `OpenRouter Error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "{}";

      const result = JSON.parse(text);

      return {
        items: result.items || [],
        currency: result.currency || 'SAR',
        supplierName: result.supplierName || ''
      };

    } catch (error: unknown) {
      const err = error as Error;
      console.error("AI Parsing Error:", error);
      throw new Error(`فشل في تحليل المستند: ${err.message}. يرجى التأكد من وضوح الصورة.`);
    }
  }
};