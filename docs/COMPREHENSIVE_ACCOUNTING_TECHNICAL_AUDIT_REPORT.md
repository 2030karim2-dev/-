# تقرير المراجعة الشاملة والمحاسبية والتقنية
# Comprehensive Accounting and Technical Audit Report
## نظام الزهراء سمارت ERP - Al-Zahra Smart ERP

**تاريخ التقرير:** 2026-03-07  
**حالة المراجعة:** مراجعة معمقة وشاملة  
**نطاق المراجعة:** جميع الوحدات والمحاسبات والتقارير

---

# الملخص التنفيذي

تم إجراء مراجعة شاملة لنظام ERP من جميع الجوانب المحاسبية والتقنية. يتضمن هذا التقرير تحليلاً مفصلاً لتدفق البيانات المالية، ودقة العمليات الحسابية، وصحة القيود المحاسبية، وسلامة التقارير المالية. تم اكتشاف عدةIssues critical تحتاج إلى معالجة فورية.

---

# القسم الأول: المشاكل الحرجة (Critical Issues)

## 1. خطأ في حساب ضريبة القيمة المضافة - التكرار المزدوج

**الموقع:** [`src/features/sales/store.ts:206-213`](src/features/sales/store.ts:206)

**الوصف:**
 يتم حساب الضريبة مرتين في سلة المبيعات. الكود يقوم بـ:
```typescript
// السطر 206-213
const afterDiscount = lineSub - lineDiscount;

// Tax: only if globally enabled AND column shown
if (taxEnabled && state.showTax) {
  const itemTaxRate = Number(item.tax) > 0 ? Number(item.tax) : defaultTaxRate;
  const lineTax = afterDiscount * (itemTaxRate / 100);
  taxAmount += lineTax;
}
```

**المشكلة:** الضريبة تُحسب فقط عند تفعيل `showTax` AND `taxEnabled`، لكن في places أخرى قد تُحسب بشكل مختلف.

**التأثير:**
- إذا كان `showTax = false` لكن `taxEnabled = true`، لن تُحسب الضريبة مطلقاً
- إذا كان `showTax = true` و `taxEnabled = true`، ستُحسب الضريبة بشكل صحيح
- هذا يؤدي إلى عدم تناسق في حساب الضريبة بين الفواتير المختلفة

**التوصية:**
```typescript
calculateTotals: () => {
  set(state => {
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    const { taxEnabled, defaultTaxRate, discountEnabled } = useTaxDiscountStore.getState();

    state.items.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const lineSub = qty * price;
      subtotal += lineSub;

      // FIX: Discount always applied if enabled, regardless of showDiscount
      const lineDiscount = discountEnabled ? (Number(item.discount) || 0) : 0;
      discountAmount += lineDiscount;

      const afterDiscount = lineSub - lineDiscount;

      // FIX: Tax always calculated if enabled, regardless of showTax
      if (taxEnabled) {
        const itemTaxRate = Number(item.tax) > 0 ? Number(item.tax) : defaultTaxRate;
        const lineTax = afterDiscount * (itemTaxRate / 100);
        taxAmount += lineTax;
      }
    });

    const totalAmount = subtotal - discountAmount + taxAmount;

    return {
      summary: { subtotal, taxAmount, discountAmount, totalAmount }
    };
  });
}
```

---

## 2. خطأ في تحويل العملات - معكوس العمليات

**الموقع:** [`src/features/sales/store.ts:115-117`](src/features/sales/store.ts:115)

**الوصف:**
 عمليات تحويل العملات معكوسة. عندما يكون `exchangeOperator = 'divide'`، يجب قسمة المبلغ على سعر الصرف، لكن الكود يضرب:

```typescript
const convertedPrice = state.exchangeOperator === 'divide'
  ? basePrice * state.exchangeRate  // خطأ: يجب أن يكون /
  : basePrice / state.exchangeRate; // خطأ: يجب أن يكون *
```

**التأثير:**
- جميع أسعار الصرف ستكون معكوسة
- مثال: إذا كان سعر الصرف 3.75 SAR/USD، سيتم حساب 100 USD × 3.75 = 375 SAR بدلاً من 375 SAR ÷ 3.75 = 100 SAR

**التوصية:**
```typescript
const convertedPrice = state.exchangeOperator === 'divide'
  ? basePrice / state.exchangeRate  // صحيح: قسمة للحصول على العملة الأجنبية
  : basePrice * state.exchangeRate; // صحيح: ضرب للتحويل للعملة الأساسية
```

**ملاحظة:** يجب أيضاً مراجعة [`src/core/utils/currencyUtils.ts:96-98`](src/core/utils/currencyUtils.ts:96) حيث نفس المشكلة.

---

## 3. خطأ في حساب متوسط التكلفة المرجح (WAC)

**الموقع:** [`src/features/inventory/services/costingService.ts:9-22`](src/features/inventory/services/costingService.ts:9)

**الوصف:**
 دالة حساب متوسط التكلفة تستخدم `Math.max(0, ...)` الذي قد يجعل الكميات السالبة تصبح صفر، مما يؤدي إلى تجاهل المخزون السلبي:

```typescript
calculateNewAverageCost: (
  currentStock: number,
  currentAvgCost: number,
  newQty: number,
  newUnitPrice: number
): number => {
  const totalCurrentValue = Math.max(0, currentStock) * currentAvgCost;
  const totalNewValue = newQty * newUnitPrice;
  const totalQty = Math.max(0, currentStock) + newQty;  // خطأ هنا
  ...
}
```

**التأثير:**
- لا يمكن حساب متوسط التكلفة بشكل صحيح إذا كان المخزون الحالي سالباً (مبيعات تتجاوز المخزون)
- فقدان معلومات التكلفة التاريخية

**التوصية:**
```typescript
calculateNewAverageCost: (
  currentStock: number,
  currentAvgCost: number,
  newQty: number,
  newUnitPrice: number
): number => {
  // Allow negative stock but track it properly
  const totalCurrentValue = currentStock * currentAvgCost;
  const totalNewValue = newQty * newUnitPrice;
  const totalQty = currentStock + newQty;

  if (totalQty <= 0) return newUnitPrice;

  const newWac = (totalCurrentValue + totalNewValue) / totalQty;
  return Number(newWac.toFixed(4));
}
```

---

## 4. عدم توازن الميزانية العمومية في التقارير

**الموقع:** [`src/features/reports/service.ts:101-103`](src/features/reports/service.ts:101)

**الوصف:**
 حساب إجمالي المطلوبات وحقوق الملكية لا يستخدم `Math.abs()` بشكل صحيح:

```typescript
const totalAssets = assets.reduce((s: number, a) => s + a.netBalance, 0);
const totalLiabilities = Math.abs(liabilities.reduce((s: number, a) => s + a.netBalance, 0));
const totalEquity = Math.abs(equity.reduce((s: number, a) => s + a.netBalance, 0)) + netProfit;
```

**المشكلة:**
- الأصول: قد تكون سالبة في حالات معينة (مخصص إهلاك)
- المطلوبات: دائماً سالبة في النظام الحالي (الائتمان)
- حقوق الملكية: قد تكون سالبة (خسائر متراكمة)

**التأثير:**
- عدم توازن المعادلة المحاسبية: الأصول ≠ المطلوبات + الملكية
- تقارير مالية غير دقيقة

**التوصية:**
```typescript
getBalanceSheet: async (companyId: string) => {
  const accounts: TrialBalanceItem[] = await reportsService.getTrialBalance(companyId);
  const assets = accounts.filter((a) => a.type === 'asset');
  const liabilities = accounts.filter((a) => a.type === 'liability');
  const equity = accounts.filter((a) => a.type === 'equity');

  // Compute net profit
  const revenues = accounts.filter((a) => a.type === 'revenue');
  const expenses = accounts.filter((a) => a.type === 'expense');
  const totalRevenues = revenues.reduce((s: number, a) => s + Math.abs(a.netBalance), 0);
  const totalExpenses = expenses.reduce((s: number, a) => s + Math.abs(a.netBalance), 0);
  const netProfit = totalRevenues - totalExpenses;

  // FIX: Use proper sign handling based on account type
  const totalAssets = assets.reduce((s: number, a) => s + (a.netBalance >= 0 ? a.netBalance : 0), 0);
  const totalLiabilities = Math.abs(liabilities.reduce((s: number, a) => s + (a.netBalance <= 0 ? a.netBalance : 0), 0));
  const totalEquity = equity.reduce((s: number, a) => s + (a.netBalance >= 0 ? a.netBalance : 0), 0) + netProfit;

  return {
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabEquity: totalLiabilities + totalEquity
  };
}
```

---

# القسم الثاني: المشاكل العالية (High Priority Issues)

## 5. عدم وجود ترحيل محاسبي للمرتجعات

**الموقع:** [`src/features/sales/service.ts:62-64`](src/features/sales/service.ts:62)

**الوصف:**
 عند إنشاء مرتجع مبيعات، لا يتم إنشاء قيد محاسبي معاكس:

```typescript
if (payload.type === 'return_sale') {
  return await salesApi.commitReturnRPC(companyId, userId, payload);
}
```

**التأثير:**
- لا يتم ترحيل قيد معاكس للفاتورة الأصلية
- عدم توازن دفتر الأستاذ
- خطأ في تقارير الميزانية العمومية

**التوصية:**
 يجب أن يقوم RPC `commit_sale_return` بإنشاء قيود معاكسة:
- مدين: حساب المخزون (تكلفة البضاعة المرتجعة)
- مدين: حساب ضريبة القيمة المضافة (إدخال الضريبة)
- دائن: حساب المبيعات
- دائن: حساب الصندوق/البنك

---

## 6. عدم وجود ترحيل للمصروفات في دفتر الأستاذ

**الموقع:** [`src/features/expenses/service.ts:34-50`](src/features/expenses/service.ts:34)

**الوصف:**
 المصروفات تُنشأ عبر RPC لكنها قد لا تتراكم بشكل صحيح في دفتر الأستاذ:

```typescript
processNewExpense: async (formData: ExpenseFormData, companyId: string, userId: string) => {
  const { error } = await expensesApi.createExpenseRPC(companyId, userId, formData);
  if (error) throw error;
  // لا يتم التحقق من إنشاء القيد المحاسبي
}
```

**التأثير:**
- عدم وجود مسار تدقيق كامل
- صعوبة تتبع المصروفات في دفتر الأستاذ العام

**التوصية:**
 إضافة تحقق من إنشاء القيد المحاسبي المرتبط بالمصروف.

---

## 7. خطأ في حساب رصيد الحسابات في دفتر الأستاذ

**الموقع:** [`src/features/accounting/services/reportService.ts:26-28`](src/features/accounting/services/reportService.ts:26)

**الوصف:**
 حساب الرصيد التراكمي يستخدم `+=` بدون تحديد ما إذا كان الحساب مديناً أم دائناً:

```typescript
let balance = 0;
return (data || []).map((line) => {
  balance += (Number(line.debit_amount) || 0) - (Number(line.credit_amount) || 0);
  return {
    ...
    balance,
  };
});
```

**التأثير:**
- الرصيد قد يكون سالباً حتى للحسابات المدينة (الأصول)
- خطأ في تحديد طبيعة الحساب (مدين/دائن)

**التوصية:**
```typescript
getLedger: async (companyId: string, accountId: string, fromDate?: string, toDate?: string) => {
  // Get account type first
  const { data: account } = await supabase.from('accounts').select('type').eq('id', accountId).single();
  const accountType = account?.type;

  let balance = 0;
  return (data || []).map((line) => {
    if (accountType === 'asset' || accountType === 'expense') {
      // Debit increases, Credit decreases
      balance += (Number(line.debit_amount) || 0) - (Number(line.credit_amount) || 0);
    } else {
      // Credit increases, Debit decreases
      balance += (Number(line.credit_amount) || 0) - (Number(line.debit_amount) || 0);
    }
    return { ...line, balance };
  });
}
```

---

## 8. عدم التحقق من صحة ارقام الحسابات في القيود

**الموقع:** [`src/core/validators/accounting.ts:9-11`](src/core/validators/accounting.ts:9)

**الوصف:**
 التحقق يسمح بـ 0 لكل من المدين والدائن:

```typescript
}).refine(data => (data.debit > 0 && data.credit === 0) || (data.credit > 0 && data.debit === 0), {
  message: "يجب أن يكون السطر إما مديناً أو دائناً فقط",
});
```

**المشكلة:** إذا كان كلاهما 0، لن يمرر التحقق، لكن إذا كان أحدهما 0 والآخر 0، لن يمر أيضاً.

**التأثير:**
- قد يتم إنشاء سطور صفرية في القيود
- هدر مساحة في قاعدة البيانات

**التوصية:**
```typescript
export const journalLineSchema = z.object({
  account_id: z.string().uuid(),
  debit: z.number().min(0),
  credit: z.number().min(0),
  description: z.string().optional(),
}).refine(data => {
  // Must have either debit OR credit, but not both and not zero
  const hasDebit = data.debit > 0;
  const hasCredit = data.credit > 0;
  return (hasDebit && !hasCredit) || (!hasDebit && hasCredit);
}, {
  message: "يجب أن يكون السطر إما مديناً أو دائناً فقط",
});
```

---

# القسم الثالث: المشاكل المتوسطة (Medium Priority Issues)

## 9. عدم استخدام Decimal.js في العمليات الحسابية للواجهة

**الموقع:** [`src/features/sales/store.ts:187-221`](src/features/sales/store.ts:187)

**الوصف:**
 يتم استخدام JavaScript floating-point math مباشرة دون استخدام Decimal.js:

```typescript
state.items.forEach(item => {
  const qty = Number(item.quantity) || 0;
  const price = Number(item.price) || 0;
  const lineSub = qty * price;  // Floating point error
  subtotal += lineSub;
  ...
});
```

**التأثير:**
- أخطاء التقريب في الحسابات المالية
- تراكم الفروقات الصغيرة على مدى عدة عمليات

**التوصية:**
 استخدام Decimal.js أوcents المحول:
```typescript
// Use cents to avoid floating point errors
const lineSub = Math.round(qty * price * 100) / 100;
```

---

## 10. عدم التحقق من صحة أسعار الصرف

**الموقع:** [`src/features/sales/api.ts:68-69`](src/features/sales/api.ts:68)

**الوصف:**
 لا يتم التحقق من صحة أسعار الصرف قبل إرسالها للـ RPC:

```typescript
...(payload.exchangeRate ? { p_exchange_rate: payload.exchangeRate } : {})
```

**التأثير:**
- قد يتم إرسال أسعار صرف = 0 أو سالبة
- أخطاء في التحويل

**التوصية:**
```typescript
const exchangeRate = Number(payload.exchangeRate);
if (isNaN(exchangeRate) || exchangeRate <= 0) {
  throw new Error('سعر الصرف غير صالح');
}
```

---

## 11. عدم تطابق أنواع الفواتير

**الموقع:** [`src/features/sales/types/domain.ts:70`](src/features/sales/types/domain.ts:70)

**الوصف:**
 تعريف أنواع الفواتير غير متسق:

```typescript
export type InvoiceType = 'sale' | 'sale_return' | 'purchase' | 'return_purchase';
```

لكن في places أخرى:
```typescript
// في api.ts
.in('type', ['sale', 'return_sale'])
```

**التأثير:**
- عدم توافق فيNames types
- صعوبة في الفلترة

**التوصية:**
 توحيد أنواع الفواتير في مكان واحد واستخدامها везاه.

---

## 12. عدم وجود ضريبة على مرتجع المبيعات

**الموقع:** [`src/features/sales/api.ts:77-96`](src/features/sales/api.ts:77)

**الوصف:**
 لا يتم تمرير نسبة الضريبة في مرتجع المبيعات:

```typescript
const rpcParams = {
  p_company_id: companyId,
  p_user_id: userId,
  p_party_id: payload.partyId,
  p_items: payload.items.map(i => ({ product_id: i.productId, quantity: i.quantity, unit_price: i.unitPrice })),
  // لا يوجد tax_rate
};
```

**التأثير:**
- لا يتم احتساب ضريبة القيمة المضافة للمرتجع
- خطأ في تقرير ضريبة القيمة المضافة

**التوصية:**
 إضافة tax_rate لكل item في المرتجع.

---

## 13. عدم ترحيل قيد للفاتورة النقدية في المشتريات

**الموقع:** [`src/features/purchases/services/purchaseAccounting.ts:20-30`](src/features/purchases/services/purchaseAccounting.ts:20)

**الوصف:**
 الكود يقول أن RPC يتعامل مع كل شيء، لكن لا يوجد تدقيق:

```typescript
handleNewPurchase: async (...) => {
  try {
    console.info('📦 Purchase accounting atomic RPC executed for:', invoiceId, 'Method:', data.paymentMethod);
    console.info('📋 The RPC commit_purchase_invoice already handled all accounting entries natively.');
    return; // لا يوجد تحقق حقيقي
  } catch (error: unknown) {
    console.error('❌ Error processing purchase accounting reference:', error);
    throw error;
  }
}
```

**التأثير:**
- لا يوجد تحقق من إنشاء القيود المحاسبية
- صعوبة التدقيق

**التوصية:**
 إضافة تحقق فعلي من إنشاء القيد المحاسبي.

---

## 14. عدم التحقق من الترحيل في النقدية (POS)

**الموقع:** [`src/features/pos/pages/POSPage.tsx:45-65`](src/features/pos/pages/POSPage.tsx:45)

**الوصف:**
```typescript
const handlePayConfirm = useCallback((method: 'cash' | 'card') => {
  processPayment({
    ...
    paymentMethod: method === 'card' ? 'credit' : 'cash',
    status: 'paid'
  }, {
    onSuccess: () => {
      setIsPaymentModalOpen(false);
      resetCart();
    }
  });
}, ...);
```

**التأثير:**
- لا يتم التحقق من نجاح العملية فعلياً
- قد تفشل العملية بدون إشعار المستخدم

**التوصية:**
 إضافة معالجة للخطأ في onFailure.

---

## 15. استخدام Math.random() في تقرير فروق العملات

**الموقع:** [`src/features/reports/service.ts:166`](src/features/reports/service.ts:166)

**الوصف:**
```typescript
unrealizedGain: 0 // ⚡ Previously Math.random() — now 0 until revaluation is implemented
```

**التأثير:**
- كان يُظهر أرقام عشوائية غير حقيقية
- تم إصلاحها مؤقتاً بـ 0

**التوصية:**
 تطوير ميزة تقييم فروق أسعار الصرف.

---

# القسم الرابع: المشاكل المنخفضة (Low Priority Issues)

## 16. عدم التحقق من الكميات السالبة

**الموقع:** [`src/features/inventory/services/valuationService.ts:9`](src/features/inventory/services/valuationService.ts:9)

**الوصف:**
```typescript
getTotalValueAtCost: (products: Product[]): number => {
  return products.reduce((sum, p) => sum + (p.stock_quantity * p.cost_price), 0);
}
```

**التأثير:**
- إذا كانت الكمية سالبة، ستقلل من قيمة المخزون
- لا يوجد warning للكميات السالبة

**التوصية:**
 إضافة تحقق وتحذير للكميات السالبة.

---

## 17. عدم وجود تاريخ انتهاء الصلاحية للقيود

**الموقع:** [`src/features/accounting/api/journalsApi.ts`](src/features/accounting/api/journalsApi.ts)

**الوصف:**
 لا يوجد تاريخ انتهاء صلاحية للقيود المحاسبية.

**التأثير:**
- قد تصبح القيود قديمة جداً
- صعوبة في التدقيق

**التوصية:**
 إضافة تاريخ انتهاء صلاحية للقيود.

---

## 18. عدم التحقق منCurrency Matching

**الموقع:** [`src/core/utils/accountRouting.ts:46-48`](src/core/utils/accountRouting.ts:46)

**الوصف:**
```typescript
const matchedChild = childAccounts.find(
  a => (a.currency_code || 'SAR') === currency
);
```

**التأثير:**
- إذا لم يتم العثور على حساب فرعي بالعملة المطلوبة، يستخدم الحساب الأب
- قد لا يتم التتبع الصحيح للعملات

**التوصية:**
 إضافة warning للمستخدم إذا لم يتم العثور على حساب بالعملة.

---

## 19. عدم وجود تكاليف إضافية في تفاصيل المنتج

**الموقع:** [`src/features/inventory/types.ts`](src/features/inventory/types.ts)

**الوصف:**
 لا يوجد حقل لتكلفة الشحن أو الضرائب في تكلفة المنتج.

**التأثير:**
- لا يتم احتساب التكلفة الكاملة للمنتج

**التوصية:**
 إضافة حقول للتكلفة الإضافية.

---

## 20. عدم التحقق من العمولات

**الموقع:** [`src/features/sales/types/domain.ts`](src/features/sales/types/domain.ts)

**الوصف:**
 لا يوجد حقل للعمولات في الفواتير.

**التأثير:**
- لا يمكن تتبع عمولات الموظفين
- صعوبة في حساب Net Profit

**التوصية:**
 إضافة حقول العمولات.

---

# القسم الخامس: تدفق البيانات المالية (Financial Data Flow)

## تدفق بيانات المبيعات:

```
1. إضافة منتج للسلة (addProductToCart)
   ↓
2. حساب المجاميع (calculateTotals)
   - Subtotal = الكمية × السعر
   - Discount = الخصم
   - Tax = الضريبة (بعد الخصم)
   - Total = Subtotal - Discount + Tax
   ↓
3. تأكيد الدفع (processPayment)
   ↓
4. RPC: commit_sales_invoice
   - إنشاء الفاتورة
   - خصم المخزون
   - إنشاء القيد المحاسبي
   ↓
5. التقارير
   - قائمة الدخل
   - الميزانية العمومية
   - التدفقات النقدية
```

## المشاكل المكتشفة في التدفق:

1. **حساب الضريبة:** يتم تطبيقه بشكل مشروط وليس دائماً
2. **تحويل العملات:** العمليات معكوسة
3. **المرتجعات:** لا تتراكم في دفتر الأستاذ

---

# القسم السادس: ملخص التوصيات

## Priority 1 (Critical) - يجب إصلاحها فوراً:

1. ✅ إصلاح حساب الضريبة (التكرار المزدوج)
2. ✅ إصلاح تحويل العملات (العمليات المعكوسة)
3. ✅ إصلاح حساب متوسط التكلفة
4. ✅ إصلاح توازن الميزانية العمومية

## Priority 2 (High) - يجب إصلاحها قريباً:

5. ✅ إضافة الترحيل المحاسبي للمرتجعات
6. ✅ التحقق من ترحيل المصروفات
7. ✅ إصلاح حساب الرصيد في دفتر الأستاذ
8. ✅ تحسين التحقق من صحة القيود

## Priority 3 (Medium) - يجب إصلاحها:

9. ✅ استخدام Decimal.js للحسابات
10. ✅ التحقق من أسعار الصرف
11. ✅ توحيد أنواع الفواتير
12. ✅ إضافة الضريبة للمرتجعات
13. ✅ التحقق من ترحيل المشتريات النقدية
14. ✅ معالجة أخطاء POS

## Priority 4 (Low) - تحسينات مستقبلية:

15. ✅ إصلاح تقرير فروق العملات
16. ✅ التعامل مع الكميات السالبة
17. ✅ إضافة تاريخ انتهاء القيود
18. ✅ Currency matching warning
19. ✅ تكاليف إضافية للمنتج
20. ✅ عمولات المبيعات

---

# القسم السابع: قواعد البيانات (Database Schema Issues)

## الجداول الرئيسية:

### invoices
- ✅ invoice_number: فريد
- ✅ total_amount: المبلغ الإجمالي
- ✅ currency_code: العملة
- ✅ exchange_rate: سعر الصرف

### invoice_items
- ✅ quantity: الكمية
- ✅ unit_price: سعر الوحدة
- ⚠️ لا يوجد tax_rate لكل صنف

### journal_entries
- ✅ entry_number: رقم القيد
- ✅ entry_date: تاريخ القيد
- ✅ status: حالة القيد

### journal_entry_lines
- ✅ account_id: معرف الحساب
- ✅ debit_amount: المبلغ المدين
- ✅ credit_amount: المبلغ الدائن
- ⚠️ لا يوجد رابط للضريبة

### accounts
- ✅ code: رقم الحساب
- ✅ type: نوع الحساب
- ✅ currency_code: العملة
- ⚠️ لا يوجد parent_id بشكل كامل

---

# الخاتمة

تم اكتشاف **20 Issue** في هذا النظام، منها **4 Issues حرجة** تتطلب معالجة فورية. النظام بشكل عام имеет хорошую структура لكن هناك several areas need improvement, especially in:

1.会计准确性 (Accounting Accuracy)
2.数据流完整性 (Data Flow Integrity)
3.错误处理 (Error Handling)
4.验证 (Validation)

التوصية الرئيسية هي:
- إصلاح الـ 4 Issues الحرجة فوراً
- إضافة اختبارات وحدة للحسابات المالية
- إضافة تدقيق (Audit Log) للعمليات الحساسة
- استخدام Decimal.js في جميع الحسابات المالية
