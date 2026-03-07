# تقرير المراجعة الشاملة والمحاسبية والتقنية - الإصدار المحدث
# Comprehensive Accounting and Technical Audit Report v3
## نظام الزهراء سمارت ERP - Al-Zahra Smart ERP

**تاريخ التقرير:** 2026-03-07  
**حالة المراجعة:** مراجعة معمقة وشاملة - الإصدار المحدث  
**نطاق المراجعة:** جميع الوحدات والمحاسبات والتقارير

---

# الملخص التنفيذي

تم إجراء مراجعة شاملة ودقيقة وعميق للتطبيق من جميع الجوانب المحاسبية والتقنية. يتضمن هذا التقرير تحليلاً مفصلاً لتدفق البيانات المالية، ودقة العمليات الحسابية، وصحة القيود المحاسبية، وسلامة التقارير المالية. تم اكتشاف عدةIssues critical تحتاج إلى معالجة فورية.

**ملاحظة هامة:** تم إصلاح بعض المشاكل التي تم تحديدها في المراجعة السابقة:
- ✅ تم إصلاح حساب رصيد دفتر الأستاذ (accounting/services/reportService.ts)
- ✅ تم إصلاح مشكلة Math.random() في تقرير فروق العملات
- ✅ تم تحسين أداء الميزانية العمومية

---

# القسم الأول: المشاكل الحرجة (Critical Issues)

## 1. خطأ في حساب ضريبة القيمة المضافة - التكرار المشروط

**الموقع:** 
- [`src/features/sales/store.ts:208-210`](src/features/sales/store.ts:208)
- [`src/features/purchases/store.ts:157-159`](src/features/purchases/store.ts:157)

**الوصف:**
 يتم حساب الضريبة والخصم بشكل مشروط - يجب أن يكونا enabled AND visible:

```typescript
// Sales store - السطر 208-210
if (taxEnabled && state.showTax) {
  const itemTaxRate = Number(item.tax) > 0 ? Number(item.tax) : defaultTaxRate;
  const lineTax = afterDiscount * (itemTaxRate / 100);
  taxAmount += lineTax;
}

// Purchases store - السطر 157-159
const discount = (discountEnabled && state.showDiscount) ? (Number(item.discount) || 0) : 0;
const tax = (taxEnabled && state.showTax) ? (afterDiscount * ((Number(item.tax) || 0) / 100)) : 0;
```

**المشكلة:**
- إذا كان `taxEnabled = true` لكن `showTax = false`، لن تُحسب الضريبة مطلقاً!
- هذا تصميم خاطئ - الضريبة يجب أن تُحتسب دائماً إذا كانت مفعلة، بغض النظر عن عرض العمود

**التأثير:**
- فواتير بدون ضريبة رغم تفعيلها في الإعدادات
- عدم تناسق في التقارير المالية
-_loss من الإيرادات الضريبية

**التوصية:**
```typescript
// يجب احتساب الضريبة والخصم دائماً إذا كانت مفعلة
const discount = discountEnabled ? (Number(item.discount) || 0) : 0;
const tax = taxEnabled ? (afterDiscount * ((Number(item.tax) || 0) / 100)) : 0;
```

---

## 2. خطأ في تحويل العملات في المبيعات

**الموقع:** [`src/features/sales/store.ts:115-117`](src/features/sales/store.ts:115)

**الوصف:**
 عمليات تحويل العملات معكوسة:

```typescript
const convertedPrice = state.exchangeOperator === 'divide'
  ? basePrice * state.exchangeRate  // خطأ: يجب أن يكون /
  : basePrice / state.exchangeRate; // خطأ: يجب أن يكون *
```

**المقارنة:**
- في `currencyUtils.ts`: multiply تعني rate × amount (صحيح)
- في `store.ts`: العمليات معكوسة (خطأ)

**التأثير:**
- جميع أسعار الصرف ستكون معكوسة
- مثال: إذا كان سعر الصرف 3.75 SAR/USD:
  - عند تحويل 100 USD: 100 × 3.75 = 375 SAR (صحيح) لكن الكود يحسب 375 ÷ 3.75 = 100 SAR (خطأ)

**التوصية:**
```typescript
const convertedPrice = state.exchangeOperator === 'divide'
  ? basePrice / state.exchangeRate  // تحويل من العملة الأساسية
  : basePrice * state.exchangeRate; // تحويل للعملة الأساسية
```

---

## 3. خطأ في حساب متوسط التكلفة المرجح (WAC)

**الموقع:** [`src/features/inventory/services/costingService.ts:9-22`](src/features/inventory/services/costingService.ts:9)

**الوصف:**
 دالة حساب متوسط التكلفة تستخدم `Math.max(0, ...)` الذي قد يجعل الكميات السالبة تصبح صفر:

```typescript
const totalCurrentValue = Math.max(0, currentStock) * currentAvgCost;
const totalQty = Math.max(0, currentStock) + newQty;
```

**التأثير:**
- لا يمكن حساب متوسط التكلفة بشكل صحيح إذا كان المخزون الحالي سالباً
- فقدان معلومات التكلفة التاريخية

**التوصية:**
```typescript
calculateNewAverageCost: (currentStock, currentAvgCost, newQty, newUnitPrice) => {
  const totalCurrentValue = currentStock * currentAvgCost;
  const totalNewValue = newQty * newUnitPrice;
  const totalQty = currentStock + newQty;

  if (totalQty <= 0) return newUnitPrice;

  const newWac = (totalCurrentValue + totalNewValue) / totalQty;
  return Number(newWac.toFixed(4));
}
```

---

## 4. عدم ترحيل القيود المحاسبية للمرتجعات

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
-_loss من الإيرادات (المرتجعات تقلل المبيعات)

**التوصية:**
 يجب أن يقوم RPC `commit_sale_return` بإنشاء قيود معاكسة:
- مدين: حساب المخزون (تكلفة البضاعة المرتجعة)
- مدين: حساب ضريبة القيمة المضافة (إدخال الضريبة)
- دائن: حساب المبيعات
- دائن: حساب الصندوق/البنك

---

## 5. عدم وجود ضريبة على مرتجع المبيعات

**الموقع:** [`src/features/sales/api.ts:77-96`](src/features/sales/api.ts:77)

**الوصف:**
 لا يتم تمرير نسبة الضريبة في مرتجع المبيعات:

```typescript
const rpcParams = {
  p_company_id: companyId,
  p_user_id: userId,
  p_party_id: payload.partyId,
  p_items: payload.items.map(i => ({ product_id: i.productId, quantity: i.quantity, unit_price: i.unitPrice })),
  // لا يوجد tax_rate!
};
```

**التأثير:**
- لا يتم احتساب ضريبة القيمة المضافة للمرتجع
- خطأ في تقرير ضريبة القيمة المضافة

**التوصية:**
 إضافة tax_rate لكل item في المرتجع.

---

# القسم الثاني: المشاكل العالية (High Priority Issues)

## 6. خطأ في تحويل العملات في المشتريات

**الموقع:** [`src/features/purchases/store.ts:122-123`](src/features/purchases/store.ts:122)

**الوصف:**
 لا يوجد `exchangeOperator` في المشتريات، يتم استخدام الضرب مباشرة:

```typescript
const rate = state.currency === 'SAR' ? 1 : state.exchangeRate;
const convertedCost = (product.cost_price || 0) * rate;
```

**المشكلة:**
- لا يوجد خيار للتحكم في طريقة التحويل
- افتراض أن التحويل دائماً بالضرب

**التأثير:**
- قد تكون التحويلات خاطئة للعملات المختلفة

**التوصية:**
 إضافة `exchangeOperator` للمشتريات كما في المبيعات.

---

## 7. ضعف التحقق من صحة القيود المحاسبية

**الموقع:** [`src/core/validators/accounting.ts:9-11`](src/core/validators/accounting.ts:9)

**الوصف:**
 التحقق يسمح بـ 0 لكل من المدين والدائن في حالات معينة:

```typescript
}).refine(data => (data.debit > 0 && data.credit === 0) || (data.credit > 0 && data.debit === 0), {
```

**المشكلة:**
- إذا كان كلاهما 0، لن يمرر التحقق، لكن إذا كان أحدهما 0 والآخر 0، لن يمر أيضاً
- يمكن إنشاء سطور صفرية في القيود

**التأثير:**
- هدر مساحة في قاعدة البيانات
- سطور غير مفيدة في القيود

**التوصية:**
```typescript
export const journalLineSchema = z.object({
  account_id: z.string().uuid(),
  debit: z.number().min(0),
  credit: z.number().min(0),
  description: z.string().optional(),
}).refine(data => {
  const hasDebit = data.debit > 0;
  const hasCredit = data.credit > 0;
  return (hasDebit && !hasCredit) || (!hasDebit && hasCredit);
}, {
  message: "يجب أن يكون السطر إما مديناً أو دائناً فقط",
});
```

---

## 8. عدم التحقق من نجاح العمليات في POS

**الموقع:** [`src/features/pos/pages/POSPage.tsx:45-65`](src/features/pos/pages/POSPage.tsx:45)

**الوصف:**
```typescript
const handlePayConfirm = useCallback((method: 'cash' | 'card') => {
  processPayment({...}, {
    onSuccess: () => {...}
    // لا يوجد onFailure!
  });
}, ...);
```

**التأثير:**
- لا يتم إشعار المستخدم عند فشل العملية
- قد تفشل العملية بدون علم المستخدم

**التوصية:**
 إضافة معالجة للخطأ في onFailure.

---

## 9. عدم التحقق من ترحيل المصروفات

**الموقع:** [`src/features/expenses/service.ts:34-50`](src/features/expenses/service.ts:34)

**الوصف:**
 لا يتم التحقق من إنشاء القيد المحاسبي للمصروفات:

```typescript
processNewExpense: async (formData, companyId, userId) => {
  const { error } = await expensesApi.createExpenseRPC(companyId, userId, formData);
  if (error) throw error;
  // لا يوجد تحقق من إنشاء القيد!
}
```

**التأثير:**
- عدم وجود مسار تدقيق كامل
- صعوبة تتبع المصروفات في دفتر الأستاذ

**التوصية:**
 إضافة تحقق من إنشاء القيد المحاسبي.

---

## 10. عدم التحقق من أسعار الصرف

**الموقع:** [`src/features/sales/api.ts:68-69`](src/features/sales/api.ts:68)

**الوصف:**
 لا يتم التحقق من صحة أسعار الصرف:

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

# القسم الثالث: المشاكل المتوسطة (Medium Priority Issues)

## 11. عدم استخدام Decimal.js في العمليات الحسابية

**الموقع:** [`src/features/sales/store.ts:187-221`](src/features/sales/store.ts:187)

**الوصف:**
 يتم استخدام JavaScript floating-point math مباشرة:

```typescript
const lineSub = qty * price;  // Floating point error
subtotal += lineSub;
```

**التأثير:**
- أخطاء التقريب في الحسابات المالية
- تراكم الفروقات الصغيرة على مدى عدة عمليات

**التوصية:**
```typescript
// Use cents to avoid floating point errors
const lineSub = Math.round(qty * price * 100) / 100;
```

---

## 12. عدم توافق أنواع الفواتير

**الموقع:** [`src/features/sales/types/domain.ts:70`](src/features/sales/types/domain.ts:70)

**الوصف:**
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
 توحيد أنواع الفواتير.

---

## 13. عدم التحقق من ترحيل المشتريات النقدية

**الموقع:** [`src/features/purchases/services/purchaseAccounting.ts:20-30`](src/features/purchases/services/purchaseAccounting.ts:20)

**الوصف:**
 الكود يقول أن RPC يتعامل مع كل شيء، لكن لا يوجد تحقق فعلي:

```typescript
handleNewPurchase: async (...) => {
  try {
    console.info('📦 Purchase accounting atomic RPC executed...');
    return; // لا يوجد تحقق حقيقي
  } catch (error) {
    console.error('❌ Error...');
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

## 14. عدم وجود تكاليف إضافية في تفاصيل المنتج

**الموقع:** [`src/features/inventory/types.ts`](src/features/inventory/types.ts)

**الوصف:**
 لا يوجد حقل لتكلفة الشحن أو الضرائب في تكلفة المنتج.

**التأثير:**
- لا يتم احتساب التكلفة الكاملة للمنتج

**التوصية:**
 إضافة حقول للتكلفة الإضافية.

---

## 15. عدم وجود عمولات في الفواتير

**الموقع:** [`src/features/sales/types/domain.ts`](src/features/sales/types/domain.ts)

**الوصف:**
 لا يوجد حقل للعمولات في الفواتير.

**التأثير:**
- لا يمكن تتبع عمولات الموظفين
- صعوبة في حساب Net Profit

**التوصية:**
 إضافة حقول العمولات.

---

# القسم الرابع: مشاكل تم إصلاحها (Previously Fixed Issues)

## 16. ✅ تم إصلاح: حساب رصيد دفتر الأستاذ

**الموقع:** [`src/features/accounting/services/reportService.ts:10-16`](src/features/accounting/services/reportService.ts:10)

**الحالة:** تم الإصلاح - الآن يتم جلب نوع الحساب لحساب الرصيد بشكل صحيح.

---

## 17. ✅ تم إصلاح: تقرير فروق العملات

**الموقع:** [`src/features/reports/service.ts:166`](src/features/reports/service.ts:166)

**الحالة:** تم الإصلاح - الآن يتم استخدام 0 بدلاً من Math.random().

---

## 18. ✅ تم إصلاح: الميزانية العمومية

**الموقع:** [`src/features/reports/service.ts:94-99`](src/features/reports/service.ts:94)

**الحالة:** تم الإصلاح - الآن يتم حساب صافي الربح بشكل مضمن inline.

---

# القسم الخامس: ملخص التوصيات حسب الأولوية

## Priority 1 (Critical) - يجب إصلاحها فوراً:

1. ✅ إصلاح حساب الضريبة (يجب أن تُحتسب دائماً إذا كانت مفعلة)
2. ✅ إصلاح تحويل العملات في المبيعات
3. ✅ إصلاح حساب متوسط التكلفة
4. ✅ إضافة الترحيل المحاسبي للمرتجعات
5. ✅ إضافة الضريبة للمرتجعات

## Priority 2 (High) - يجب إصلاحها قريباً:

6. ✅ إصلاح تحويل العملات في المشتريات (إضافة exchangeOperator)
7. ✅ تحسين التحقق من صحة القيود
8. ✅ معالجة أخطاء POS
9. ✅ التحقق من ترحيل المصروفات
10. ✅ التحقق من أسعار الصرف

## Priority 3 (Medium) - يجب إصلاحها:

11. ✅ استخدام Decimal.js للحسابات
12. ✅ توحيد أنواع الفواتير
13. ✅ التحقق من ترحيل المشتريات النقدية
14. ✅ إضافة تكاليف إضافية للمنتج
15. ✅ إضافة عمولات المبيعات

---

# القسم السادس: تدفق البيانات المالية

## تدفق بيانات المبيعات:

```
1. إضافة منتج للسلة (addProductToCart)
   ↓
2. حساب المجاميع (calculateTotals)
   - Subtotal = الكمية × السعر
   - Discount = الخصم (إذا enabled)
   - Tax = الضريبة (إذا enabled) ← مشكلة هنا!
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
   - قائمة الدخل ✓
   - الميزانية العمومية ✓
   - التدفقات النقدية ✓
```

---

# الخاتمة

تم اكتشاف **15 Issue** في هذا النظام، منها **5 Issues حرجة** تتطلب معالجة فورية.

**النظام بشكل عام لديه:**
- ✅ هيكل جيد للبيانات
- ✅ فصل جيد بين الوحدات
- ✅ استخدام RPC للعمليات الذرية
- ⚠️ بعض المشاكل في الحسابات المالية

**التوصيات الرئيسية:**
1. إصلاح الـ 5 مشاكل الحرجة فوراً
2. إضافة اختبارات وحدة للحسابات المالية
3. إضافة تدقيق (Audit Log) للعمليات الحساسة
4. استخدام Decimal.js في جميع الحسابات المالية
5. توحيد منطق حساب الضريبة والخصم في كلتا الوحدتين (المبيعات والمشتريات)
