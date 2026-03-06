# خطة تحسين وإصلاح الأخطاء - Al-Zahra Smart ERP

**تاريخ الإنشاء:** 25 فبراير 2026
**الغرض:** معالجة جميع العيوب والثغرات والتناقضات والتكرارات والنواقص

---

## القسم الأول: إصلاح الأخطاء الحرجة

### 1.1 إصلاحات فورية (يوم واحد)

| # | المشكلة | الملف | الإصلاح | الحالة |
|---|--------|------|--------|--------|
| 1 | خطأ صياغة في Logger | `logger.ts:134` | ✅ تم الإصلاح | مكتمل |
| 2 | دالة غير مستوردة | `dashboardInsights.ts` | ✅ تم الإصلاح | مكتمل |

### 1.2 إصلاحات TypeScript (أسبوع واحد)

#### الهدف: إزالة `as any` من 200+ ملف

**الخطوة 1: تحديث أنواع قاعدة البيانات**
```bash
npx supabase gen types typescript --schema public > src/core/database.types.ts
```

**الخطوة 2: إزالة الـ Casts من الملفات الرئيسية**

| الملف | الإصلاح |
|------|--------|
| `dashboard/service.ts:47,58,73` | إزالة `(supabase.from(...) as any)` |
| `InvoiceListView.tsx:116` | إزالة `error as any` |
| `AIChatPanel.tsx` | إزالة `(window as any).SpeechRecognition` |

**الخطوة 3: التحقق من عمل البناء**
```bash
npm run build
```

---

## القسم الثاني: تحسينات Type Safety

### 2.1 توحيد واجهات المتاجر

| الملف | المشكلة | الحل |
|------|--------|------|
| `sales/store.ts` | لا يحتوي على `partNumber`, `brand` | إضافة الحقول |
| `purchases/store.ts` | يحتوي على `costPrice` | توحيد التسمية |

**الكود المقترح:**
```typescript
// src/features/sales/store.ts
export interface SalesCartItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  partNumber?: string;  // إضافة
  brand?: string;      // إضافة
  quantity: number;
  price: number;
  discount: number;
  tax: number;
}
```

---

## القسم الثالث: إزالة التكرارات

### 3.1 توحيد formatCurrency

**الموقع الحالي:**
- `core/utils.ts:10` ← يستخدم في معظم الملفات
- `core/utils/currencyUtils.ts:134` ← الإصدار الأفضل
- `data/dashboard.ts:256` ← إصدار قديم

**الحل:** الاحتفاظ بنسخة واحدة فقط

```typescript
// src/core/utils.ts
export { formatCurrency, formatNumber, toBaseCurrency, CURRENCY_SYMBOLS } from './utils/currencyUtils';
```

**ملف التحديث المطلوب:**
```bash
# تحديث جميع الاستيرادات
grep -r "from '../../../core/utils/currencyUtils'" src/ | head -20
```

### 3.2 إزالة toBase Wrappers

| الملف | الإصلاح |
|------|--------|
| `dashboard/service.ts:128` | استخدام `toBaseCurrency` مباشرة |
| `dashboardStats.ts:19` | استخدام `toBaseCurrency` مباشرة |
| `dashboardInsights.ts:20` | استخدام `toBaseCurrency` مباشرة |
| `sales/api.ts:128` | استخدام `toBaseCurrency` مباشرة |

### 3.3 إنشاء Barrel Exports

```typescript
// src/core/utils/index.ts
export * from './currencyUtils';
export * from './errorUtils';
export * from './logger';
export * from './invoiceExcelExporter';
export * from './pdfExporter';
export * from './zatca';
```

---

## القسم الرابع: تحسينات الأداء

### 4.1 إضافة Pagination

**الملفات المطلوب تعديلها:**
- `sales/api.ts` - `getInvoices()`
- `inventory/service.ts` - `getProducts()`
- `bonds/service.ts` - `fetchBonds()`

**مثال التنفيذ:**
```typescript
// استخدام useInfiniteQuery من TanStack Query
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['invoices', companyId],
  queryFn: ({ pageParam = 0 }) => 
    supabase
      .from('invoices')
      .select('*')
      .range(pageParam * 50, (pageParam + 1) * 50 - 1),
  getNextPageParam: (lastPage, pages) => 
    lastPage.length === 50 ? pages.length : undefined,
});
```

### 4.2 إضافة React.memo

```typescript
// مثال للجدول
import { memo } from 'react';

export const InvoiceTable = memo(function InvoiceTable({ 
  data, 
  onRowClick 
}: InvoiceTableProps) {
  // ... المكون
});
```

**الملفات المطلوب تعديلها:**
- `ExcelTable.tsx`
- `InvoiceListView.tsx`
- مكونات الجداول في `sales`, `inventory`, `accounting`

### 4.3 تحسين Dashboard

**الحالي:**
```typescript
// يجلب كل البيانات دفعة واحدة
Promise.all([invoices, expenses, products, ...])
```

**المحسن:**
```typescript
// تحميل البيانات حسب الحاجة
// Widget 1: إحصائيات سريعة (مخبأة)
// Widget 2: قائمة الفواتير (Lazy)
// Widget 3: المخزون (Lazy)
```

---

## القسم الخامس: تحسينات الأمان

### 5.1 تقوية كلمة المرور

**الملف:** [`src/features/auth/LoginPage.tsx`](src/features/auth/LoginPage.tsx)

```typescript
// إضافة minLength
<input
  type="password"
  minLength={8}
  pattern="^(?=.*[A-Z])(?=.*[0-9]).{8,}$"
  title="8 أحرف على الأقل، حرف كبير، رقم"
  // ...
/>
```

### 5.2 تفعيل Zod Validation

**الملفات المطلوب تعديلها:**
- نماذج المبيعات: `CreateInvoiceModal.tsx`
- نماذج المشتريات: `CreatePurchaseModal.tsx`
- نماذج المصروفات: `CreateExpenseModal.tsx`

```typescript
import { z } from 'zod';

const InvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  customerId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive(),
    price: z.number().nonnegative(),
  })).min(1),
  paymentMethod: z.enum(['cash', 'credit']),
});
```

---

## القسم السادس: معالجة النواقص الوظيفية

### 6.1 إضافة البحث العالمي

**الحالة:** `CommandPalette` موجود لكنه لأوامر فقط

**التطوير:** إضافة بحث في قاعدة البيانات

```typescript
// src/hooks/useGlobalSearch.ts
export const useGlobalSearch = (query: string) => {
  return useQuery({
    queryKey: ['globalSearch', query],
    queryFn: async () => {
      const [products, customers, invoices] = await Promise.all([
        supabase.from('products').select('*').ilike('name_ar', `%${query}%`),
        supabase.from('parties').select('*').ilike('name', `%${query}%`),
        supabase.from('invoices').select('*').ilike('invoice_number', `%${query}%`),
      ]);
      return { products: products.data, customers: customers.data, invoices: invoices.data };
    },
    enabled: query.length >= 2,
  });
};
```

### 6.2 تفعيل Audit Trail

**الملفات المطلوب تعديلها:**
- `sales/api.ts` - تسجيل عمليات الفواتير
- `purchases/api.ts` - تسجيل عمليات المشتريات
- `accounting/api.ts` - تسجيل القيود المحاسبية

```typescript
// مثال لـ RPC call
await supabase.rpc('insert_audit_log', {
  p_company_id: companyId,
  p_user_id: userId,
  p_action: 'create_invoice',
  p_entity_type: 'invoice',
  p_entity_id: invoiceId,
  p_details: { total: amount },
});
```

---

## القسم السابع: إعادة الهيكلة

### 7.1 الملفات الحرجة (الأسبوع 1-2)

| الملف | الحجم | الإجراء |
|------|-------|--------|
| `SalesAnalyticsView.tsx` | 31,739 حرف | تقسيم إلى مكونات |
| `settingsStore.ts` | 17,526 حرف | فصل الأنواع |
| `i18nStore.ts` | 19,337 حرف | نقل الترجمات لـ JSON |
| `inventory/service.ts` | 18,995 حرف | تقسيم الخدمات |

### 7.2 الملفات الكبيرة (الأسبوع 3-4)

| الملف | الإجراء |
|------|--------|
| `ExcelTable.tsx` | استخراج Hooks |
| `ExpensesPage.tsx` | تقسيم المكونات |
| `BackupPage.tsx` | تقسيم الأقسام |
| `PurchaseDetailsModal.tsx` | تقسيم المودال |

### 7.3 الملفات المتوسطة (الأسبوع 5-6)

- `AccountsTable.tsx`
- `JournalEntryRow.tsx`
- `TreasurySidebar.tsx`
- `CreatePaymentModal.tsx`

---

## القسم الثامن: خطة التنفيذ الزمنية

### المرحلة 1: الإصلاحات الفورية (الأسبوع 1)
| اليوم | المهمة |
|-------|--------|
| 1 | إزالة `as any` من dashboard/service.ts |
| 2 | إزالة `as any` من InvoiceListView.tsx |
| 3 | إنشاء barrel exports |
| 4 | توحيد formatCurrency |
| 5 | اختبار البناء |

### المرحلة 2: تحسينات Type Safety (الأسبوع 2-3)
| الأسبوع | المهمة |
|--------|--------|
| 2 | تحديث database.types.ts |
| 2 | توحيد واجهات المتاجر |
| 3 | إضافة Zod validation |

### المرحلة 3: تحسينات الأداء (الأسبوع 4-6)
| الأسبوع | المهمة |
|--------|--------|
| 4 | إضافة Pagination |
| 5 | إضافة React.memo |
| 6 | تحسين Dashboard |

### المرحلة 4: إعادة الهيكلة (الأسبوع 7-12)
| الأسبوع | المهمة |
|--------|--------|
| 7-8 | تقسيم الملفات الحرجة |
| 9-10 | تقسيم الملفات الكبيرة |
| 11-12 | تقسيم الملفات المتوسطة |

### المرحلة 5: تحسينات الأمان (الأسبوع 13-14)
| الأسبوع | المهمة |
|--------|--------|
| 13 | تقوية كلمة المرور |
| 14 | تفعيل Audit Trail |

---

## القسم التاسع: أوامر التنفيذ

```bash
# 1. التحقق من الأخطاء
npm run build

# 2. تشغيل التطوير
npm run dev

# 3. إنشاء فرع جديد
git checkout -b fix/remove-any-casts

# 4. بعد الإصلاح
git add .
git commit -m "fix: remove as any casts from dashboard service"

# 5. دمج في main
git checkout main
git merge fix/remove-any-casts
```

---

## القسم العاشر: قائمة التحقق

### قبل البدء:
- [ ] إنشاء نسخة احتياطية
- [ ] إنشاء فرع Git جديد
- [ ] تشغيل `npm run dev` للتأكد من عمل التطبيق

### أثناء التنفيذ:
- [ ] اختبار كل تغيير على حدة
- [ ] عدم تعديل أكثر من ملف واحد في كل commit
- [ ] تحديث الاستيرادات

### بعد الانتهاء:
- [ ] تشغيل `npm run build`
- [ ] اختبار جميع الصفحات
- [ ] مراجعة الكود

---

**نهاية الخطة**