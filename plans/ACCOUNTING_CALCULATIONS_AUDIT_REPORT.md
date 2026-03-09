# تقرير تدقيق الحسابات والعمليات المالية
# Comprehensive Accounting & Financial Calculations Audit Report

**تاريخ التدقيق:** 2026-03-09  
**نوع التدقيق:** Frontend Accounting Calculations & Financial Operations  
**حالة المشروع:** ERP System (Al-Zahra Smart ERP)

---

## الملخص التنفيذي

تم إجراء تدقيق شامل للعمليات الحسابية والمحاسبية في الواجهة الأمامية للتطبيق. النتائج الرئيسية:

- **إجمالي المشاكل المكتشفة:** 18 مشكلة
- **حرجة (Critical):** 4
- **عالية (High):** 6
- **متوسطة (Medium):** 5
- **منخفضة (Low):** 3

---

## القسم الأول: التحقق من صحة العمليات الحسابية

### المشكلة #1: عدم احتساب الضرائب في حساب الفواتير ⚠️ CRITICAL

**الموقع:**
- [`src/features/sales/store.ts`](src/features/sales/store.ts:188-212) - دالة `calculateTotals`

**الوصف:**
عند احتساب الإجماليات في نموذج المبيعات، لا يتم احتساب ضريبة القيمة المضافة (VAT). الكود الحالي:
```typescript
const totalAmount = subtotal - discountAmount;
```

يجب أن يكون:
```typescript
const taxAmount = (subtotal - discountAmount) * taxRate;
const totalAmount = subtotal - discountAmount + taxAmount;
```

**الخطورة:** عالية جداً - يؤدي إلى عدم احتساب الضرائب بشكل صحيح

**التأثير:** جميع الفواتير المباعة لا تتضمن ضرائب القيمة المضافة

**الحل المقترح:**
1. إضافة `taxRate` إلى `SalesSummary` interface
2. تحديث دالة `calculateTotals` لاحتساب الضرائب
3. إضافة اختيار نسبة الضريبة في واجهة المستخدم

---

### المشكلة #2: خطأ في حساب الخصم في POS ⚠️ HIGH

**الموقع:**
- [`src/features/sales/store.ts`](src/features/sales/store.ts:201-203)

**الوصف:**
الخصم يُطبق فقط عند تفعيل الخيارين معاً:
```typescript
const lineDiscount = (discountEnabled && state.showDiscount) ? (Number(item.discount) || 0) : 0;
```

هذا يعني أنه حتى لو كان الخصم مفعلاً في الإعدادات، يجب إظهار عمود الخصم يدوياً. هذا سلوك غير متوقع وقد يؤدي لنسيان تطبيق الخصومات.

**الخطورة:** متوسطة

**التأثير:** قد لا يتم تطبيق الخصومات في بعض الحالات

**الحل المقترح:**
فصل منطق الخصم - يجب أن يُطبق الخصم إذا كان `discountEnabled` في الإعدادات بغض النظر عن إظهار العمود

---

### المشكلة #3: خطأ في تحويل العملات ⚠️ CRITICAL

**الموقع:**
- [`src/features/sales/store.ts`](src/features/sales/store.ts:116-118)

**الوصف:**
معامل التحويل معكوس:
```typescript
const convertedPrice = state.exchangeOperator === 'divide'
    ? basePrice * state.exchangeRate   // خطأ
    : basePrice / state.exchangeRate;  // خطأ
```

يجب أن يكون العكس:
```typescript
const convertedPrice = state.exchangeOperator === 'divide'
    ? basePrice / state.exchangeRate   // صح
    : basePrice * state.exchangeRate; // صح
```

**الخطورة:** عالية جداً

**التأثير:** جميع أسعار المنتجات المعروضة بعملات أجنبية غير صحيحة

**الحل المقترح:**
تبديل العمليات في كود التحويل

---

## القسم الثاني: دقة عرض الأرقام والمبالغ المالية

### المشكلة #4: عدم تنسيق الأرقام في بعض المكونات ⚠️ MEDIUM

**الموقع:**
- [`src/features/sales/components/create/InvoiceRow.tsx`](src/features/sales/components/create/InvoiceRow.tsx:64)

**الوصف:**
```typescript
{((Number(item.quantity) * Number(item.price)) - (showDiscount ? Number(item.discount || 0) : 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
```

يستخدم `toLocaleString` مباشرة بدلاً من استخدام `formatCurrency` الموحد

**الخطورة:** منخفضة

**التأثير:** عدم اتساق في تنسيق الأرقام عبر التطبيق

**الحل المقترح:**
استخدام `formatCurrency` من [`src/core/utils/currencyUtils.ts`](src/core/utils/currencyUtils.ts) في جميع الأماكن

---

### المشكلة #5: استخدام `parseFloat` بدون تحقق ⚠️ HIGH

**الموقع:**
-多处文件中发现 (Multiple files)

**الوصف:**
في العديد من الأماكن يتم استخدام `parseFloat` مباشرة بدون تحقق من الصحة:
```typescript
onChange={(e) => onUpdate(index, 'price', parseFloat(e.target.value) || 0)}
```

هذا يسمح بإدخال قيم غير صالحة مثل `NaN` أو `Infinity`

**الخطورة:** عالية

**التأثير:** قد يؤدي لإدخال قيم غير صحيحة في الحسابات

**الحل المقترح:**
إنشاء دالة مساعدة `safeParseFloat` تستخدم `Decimal.js` للتحقق

---

## القسم الثالث: النماذج والتحقق من صحة البيانات

### المشكلة #6: عدم التحقق من الكميات السالبة ⚠️ HIGH

**الموقع:**
- [`src/features/sales/components/create/InvoiceRow.tsx`](src/features/sales/components/create/InvoiceRow.tsx:51)

**الوصف:**
حقل الكمية يسمح بأرقام سالبة:
```typescript
<input type="number" value={item.quantity || ''} onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
```

**الخطورة:** عالية

**التأثير:** يمكن إنشاء فواتير بكمية سالبة

**الحل المقترح:**
إضافة `min="0"` و `step="1"` وإضافة تحقق في الكود

---

### المشكلة #7: عدم التحقق من الأسعار السالبة ⚠️ HIGH

**الموقع:**
- [`src/features/sales/components/create/InvoiceRow.tsx`](src/features/sales/components/create/InvoiceRow.tsx:54)

**الوصف:**
حقل السعر يسمح بأرقام سالبة

**الخطورة:** عالية

**التأثير:** يمكن إنشاء فواتير بسعر سالب

**الحل المقترح:**
إضافة التحقق في الدالة `updateItem`

---

### المشكلة #8: التحقق من توازن القيد المحاسبي ضعيف ⚠️ MEDIUM

**الموقع:**
- [`src/features/accounting/components/journals/AddJournalEntryModal.tsx`](src/features/accounting/components/journals/AddJournalEntryModal.tsx:91)

**الوصف:**
```typescript
const isBalanced = Math.abs(difference) < 0.01 && totals.debit_amount > 0;
```

استخدام `0.01` كتحمل غير مناسب للعمليات المالية - يجب استخدام `SOX_BALANCE_TOLERANCE` المحدد في [`src/core/utils/decimalUtils.ts`](src/core/utils/decimalUtils.ts:44)

**الخطورة:** متوسطة

**التأثير:** قد يتم قبول قيود غير متوازنة بدقة

**الحل المقترح:**
استخدام `SOX_BALANCE_TOLERANCE` = 0.000001

---

## القسم الرابع: اختبارات السيناريوهات

### المشكلة #9: عدم معالجة حالة القسمة على صفر ⚠️ HIGH

**الموقع:**
- [`src/features/pos/components/PaymentModal.tsx`](src/features/pos/components/PaymentModal.tsx:23-24)

**الوصف:**
```typescript
const receivedNum = parseFloat(received) || 0;
const change = receivedNum - total;
```

لا يتم التحقق من أن `total` ليس صفراً قبل الحساب

**الخطورة:** متوسطة

**التأثير:** قد يظهر خطأ في حالة المبلغ الإجمالي صفر

**الحل المقترح:**
إضافة تحقق: `if (total <= 0) return;`

---

### المشكلة #10: عدم معالجة الأخطاء في العمليات الحسابية ⚠️ MEDIUM

**الموقع:**
- [`src/features/returns/components/ReturnsWizard.tsx`](src/features/returns/components/ReturnsWizard.tsx:156-162)

**الوصف:**
```typescript
const totalAmount = useMemo(() => {
    if (!selectedInvoice?.invoice_items) return 0;
    return selectedInvoice.invoice_items.reduce((sum: number, item: any) => {
        const qty = returnQuantities[item.id] || 0;
        return sum + (qty * item.unit_price);
    }, 0);
}, [selectedInvoice, returnQuantities]);
```

لا يوجد تحقق من أن `unit_price` رقم صحيح

**الخطورة:** متوسطة

**التأثير:** قد يظهر `NaN` في حالة بيانات تالفة

**الحل المقترح:**
استخدام `safeDecimal` من [`src/core/utils/decimalUtils.ts`](src/core/utils/decimalUtils.ts:60)

---

## القسم الخامس: التكامل بين الواجهة والخادم

### المشكلة #11: إرسال البيانات بدون تجميع على الواجهة ⚠️ CRITICAL

**الموقع:**
- [`src/features/sales/api.ts`](src/features/sales/api.ts:55-76)

**الوصف:**
عند إرسال الفاتورة، يتم إرسال الأصناف فقط:
```typescript
p_items: payload.items.map(i => ({ product_id: i.productId, quantity: i.quantity, unit_price: i.unitPrice }))
```

لا يتم إرسال المبالغ المحسوبة (الإجماليات والضرائب والخصومات) - يتم حسابها على الخادم

**الخطورة:** عالية (لكن قد يكون مقصوداً لأسباب أمنية)

**التأثير:** لا يوجد تحقق على客户端 من البيانات المرسلة

**الحل المقترح:**
1. إضافة hash للمبالغ المحسوبة على الواجهة
2. التحقق من صحتها على الخادم
3. استخدام [`generateCalculationHash`](src/core/utils/decimalUtils.ts:135) الموجود

---

### المشكلة #12: عدم التحقق من استجابة RPC ⚠️ HIGH

**الموقع:**
- [`src/features/sales/api.ts`](src/features/sales/api.ts:73-75)

**الوصف:**
```typescript
const { data: result, error } = await supabase.rpc('commit_sales_invoice', rpcParams);
if (error) throw parseError(error);
return result as unknown as InvoiceResponse;
```

لا يتم التحقق من أن `result` ليس `null` أو `undefined`

**الخطورة:** عالية

**التأثير:** قد تنجح العملية على الخادم لكن التطبيق يعتبرها فاشلة

**الحل المقترح:**
إضافة تحقق: `if (!result) throw new Error('لم يتم إنشاء الفاتورة');`

---

## القسم السادس: تجربة المستخدم

### المشكلة #13: أحجام الخطوط غير متسقة للأرقام ⚠️ LOW

**الموقع:**
-多处文件中发现 (Multiple files)

**الوصف:**
أحجام الخطوط للأرقام تختلف من مكون لآخر (text-sm, text-xs, text-lg)

**الخطورة:** منخفضة

**التأثير:** تجربة مستخدم غير متسقة

**الحل المقترح:**
تحديد معايير لتنسيق الأرقام المالية

---

### المشكلة #14: اتجاه النصوص المالية ⚠️ LOW

**الموقع:**
- [`src/features/sales/components/create/InvoiceTotals.tsx`](src/features/sales/components/create/InvoiceTotals.tsx:26)

**الوصف:**
```typescript
<span dir="ltr" className="text-sm font-bold font-mono text-gray-700 dark:text-slate-300">{formatCurrency(summary.subtotal, currency)}</span>
```

يستخدم `dir="ltr"` للتمويل مع أن الواجهة عربية

**الخطورة:** منخفضة

**التأثير:** عرض غير متسق للأرقام

**الحل المقترح:**
توحيد الاتجاه بناءً على العملة (USD يوضع قبل العدد، العملات العربية بعده)

---

## القسم السابع: الأداء

### المشكلة #15: إعادة حساب في كل إدخال ⚠️ MEDIUM

**الموقع:**
- [`src/features/sales/store.ts`](src/features/sales/store.ts:93-101)

**الوصف:**
```typescript
updateItem: (index, field, value) => {
    set(state => { /* update */ });
    get().calculateTotals(); // يتم استدعاؤها بعد كل تغيير
},
```

كل تغيير في أي حقل يؤدي لحساب كل الإجماليات

**الخطورة:** متوسطة

**التأثير:** قد يؤثر على الأداء مع عدد كبير من الأصناف

**الحل المقترح:**
استخدام `useMemo` أو `debounce` لإبطاء الحساب

---

### المشكلة #16: عدم استخدام Decimal.js في الواجهة ⚠️ HIGH

**الموقع:**
- [`src/features/sales/store.ts`](src/features/sales/store.ts:188-212)

**الوصف:**
على الرغم من وجود مكتبة [`decimalUtils.ts`](src/core/utils/decimalUtils.ts) التي تستخدم Decimal.js، إلا أنها غير مستخدمة في حسابات الواجهة

**الخطورة:** عالية

**التأثير:** مشاكل الدقة في العمليات الحسابية (Floating Point)

**الحل المقترح:**
استخدام `calculateInvoiceSummary` و `calculateLineItem` من [`src/core/utils/decimalUtils.ts`](src/core/utils/decimalUtils.ts:172)

---

## القسم الثامن: الأمان

### المشكلة #17: عدم التحقق من المدخلات المالية ⚠️ CRITICAL

**الموقع:**
- [`src/features/sales/components/create/InvoiceRow.tsx`](src/features/sales/components/create/InvoiceRow.tsx)
- [`src/features/pos/components/PaymentModal.tsx`](src/features/pos/components/PaymentModal.tsx)

**الوصف:**
لا توجد حدود قصوى للمدخلات المالية:
- لا يوجد `max` attribute
- لا يوجد تحقق من الحد الأقصى للمبلغ
- لا يوجد تحقق من عدد الأرقام العشرية

**الخطورة:** عالية

**التأثير:** قد يتم إدخال مبالغ ضخمة غير منطقية

**الحل المقترح:**
1. إضافة `maxLength` و `max` للحقول
2. التحقق من `Number.isFinite()` قبل الحساب
3. استخدام `safeDecimal` للتحويل

---

### المشكلة #18: عرض البيانات الحساسة ⚠️ LOW

**الموقع:**
- [`src/features/accounting/components/journals/AddJournalEntryModal.tsx`](src/features/accounting/components/journals/AddJournalEntryModal.tsx)

**الوصف:**
أرقام الحسابات والقيود المحاسبية معروضة بدون تشفير

**الخطورة:** منخفضة

**التأثير:** منخفض - البيانات في شبكة خاصة

**الحل المقترح:**
إضافة قناع للأرقام الحساسة إذا لزم الأمر

---

## التوصيات العامة

### أولوية الإصلاحات (Priority Fixes)

1. **الإصلاح الفوري:**
   - #1: إضافة احتساب الضرائب
   - #3: تصحيح تحويل العملات
   - #11: إرسال hash للمبالغ
   - #17: إضافة التحقق من المدخلات

2. **إصلاحات قصيرة المدى:**
   - #2: تحسين منطق الخصم
   - #5, #6, #7: إضافة التحقق من صحة المدخلات
   - #16: استخدام Decimal.js

3. **تحسينات مستقبلية:**
   - #4: توحيد تنسيق الأرقام
   - #13, #14: تحسين تجربة المستخدم
   - #15: تحسين الأداء

---

## ملحق A: الدوال المساعدة الموصى بها

```typescript
//_safeNumberInput.ts
import { safeDecimal } from '../core/utils/decimalUtils';

export const safeNumberInput = (value: string | number): number => {
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const validatePositiveNumber = (value: number): boolean => {
    return safeDecimal(value).greaterThan(0);
};

export const formatMoney = (amount: number, currency: string = 'SAR'): string => {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};
```

---

## ملحق B: قائمة الملفات المرجعية

| الملف | الغرض |
|-------|--------|
| [`src/core/utils/currencyUtils.ts`](src/core/utils/currencyUtils.ts) | عمليات تحويل العملات |
| [`src/core/utils/decimalUtils.ts`](src/core/utils/decimalUtils.ts) | العمليات الحسابية الدقيقة |
| [`src/features/sales/store.ts`](src/features/sales/store.ts) | حالة المبيعات |
| [`src/features/sales/api.ts`](src/features/sales/api.ts) | API المبيعات |
| [`src/features/accounting/components/journals/AddJournalEntryModal.tsx`](src/features/accounting/components/journals/AddJournalEntryModal.tsx) | نموذج القيد المحاسبي |
| [`src/features/returns/components/ReturnsWizard.tsx`](src/features/returns/components/ReturnsWizard.tsx) | معالج المرتجعات |

---

## الختام

يُظهر هذا التدقيق أن النظام يحتوي على عدة نقاط حرجة تتطلب اهتماماً فورياً، خاصة فيما يتعلق بحسابات الضرائب وتحويل العملات وأمن المدخلات المالية. نوصي بتطبيق الإصلاحات ذات الأولوية العالية في أقرب وقت ممكن لضمان دقة الحسابات المالية وسلامة البيانات.

**إعداد:** Kilo Code (Architect Mode)  
**تاريخ الإعداد:** 2026-03-09
