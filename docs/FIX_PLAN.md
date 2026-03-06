# 📋 خطة الإصلاح الشاملة
## Al-Zahra Smart ERP

**تاريخ الإنشاء:** 26 فبراير 2026  
**الإصدار:** 1.0  
**الجودة الحالية:** 68/100  
**الهدف:** 90+/100

---

## 📊 ملخص الوضع الراهن

| الفئة | الحالية | الهدف | الفجوة |
|-------|--------|-------|--------|
| TypeScript Strict | 55% | 85%+ | 30% |
| Error Handling | 45% | 80%+ | 35% |
| Accessibility | 55% | 80%+ | 25% |
| Documentation | 45% | 75%+ | 30% |
| Testing | 25% | 60%+ | 35% |

---

## 🏆 المرحلة 1: الإصلاحات الحرجة (الأسبوع 1)

### 1.1 إصلاح Bug Debounce ✅ مُنجز

| الملف | السطر | الإصلاح |
|------|-------|---------|
| `src/features/sales/hooks/useProductSearch.ts` | 33-39 | `useState` → `useEffect` |

### 1.2 إنشاء Error Boundary ✅ مُنجز

| الملف | الوظيفة |
|------|---------|
| `src/core/components/ErrorBoundary.tsx` | التقاط أخطاء React |

### 1.3 إصلاح معالج الأخطاء المركزي

#### الملفات المطلوب تعديلها:

| # | الملف | المشكلة | الإصلاح |
|---|------|--------|---------|
| 1 | `src/features/sales/hooks.ts:62` | `onError: (error: any)` | استخدام `useErrorHandler` |
| 2 | `src/features/purchases/hooks.ts:66,90` | `onError: (err: any)` | استخدام `useErrorHandler` |
| 3 | `src/features/expenses/hooks.ts:104,118` | `onError: (err: any)` | استخدام `useErrorHandler` |
| 4 | `src/features/customers/hooks.ts:103,116` | `onError: (err: any)` | استخدام `useErrorHandler` |
| 5 | `src/features/accounting/hooks/useJournals.ts:58` | `onError: (error: any)` | استخدام `useErrorHandler` |
| 6 | `src/features/accounting/hooks/useAccounts.ts:50,64,78,93` | `onError: (err: any)` | استخدام `useErrorHandler` |

#### الكود المطلوب:

```typescript
// قبل
onError: (error: any) => {
  showToast(error.message, 'error');
}

// بعد
onError: (error: Error) => {
  const appError = toAppError(error);
  showToast(appError.message, 'error');
}
```

---

## 🔧 المرحلة 2: إزالة `any` (الأسبوع 1-2)

### 2.1 dashboard/services

| # | الملف | عدد `any` | الإصلاح |
|---|------|----------|---------|
| 1 | `service.ts` | 12 | إضافة أنواع للـ data processing |
| 2 | `dashboardStats.ts` | 10 | إضافة أنواع للإحصائيات |
| 3 | `dashboardInsights.ts` | 8 | إضافة أنواع للتحليلات |

#### مثال الإصلاح:

```typescript
// قبل
invoicesData.filter((i: any) => i.type === 'sale')

// بعد
interface Invoice {
  id: string;
  type: 'sale' | 'purchase' | 'return_sale' | 'return_purchase';
  issue_date: string;
  total_amount: number;
}
invoicesData.filter((i: Invoice) => i.type === 'sale')
```

### 2.2 API Files

| # | الملف | المشكلة |
|---|------|---------|
| 1 | `src/features/expenses/api.ts` | `as any` في استعلامات Supabase |
| 2 | `src/features/purchases/api.ts` | `as any` في استعلامات Supabase |
| 3 | `src/features/sales/api.ts` | `as any` في استعلامات Supabase |

#### إصلاح api.ts:

```typescript
// قبل
const { data, error } = await (supabase.from('invoices') as any)
  .select('*')
  .eq('company_id', companyId);

// بعد
const { data, error } = await supabase
  .from<Invoice>('invoices')
  .select('*')
  .eq('company_id', companyId);
```

### 2.3 Components

| # | الملف | المشكلة | الإصلاح |
|---|------|--------|---------|
| 1 | `InvoiceRow.tsx` | `any` في onUpdate | إضافة نوع للـ callback |
| 2 | `ProductSearch.tsx` | `any` في handleSelect | استخدام ProductSearchResult |
| 3 | Table Components | `any[]` في Props | إضافة نوع للـ TableProps |

---

## ⚡ المرحلة 3: تحسين الأداء (الأسبوع 2)

### 3.1 تطبيق Pagination

#### الملفات المطلوب تعديلها:

| # | المكون | الملف |
|---|--------|------|
| 1 | InvoiceListView | `src/features/sales/components/list/InvoiceListView.tsx` |
| 2 | PurchasesTable | `src/features/purchases/components/PurchasesTable.tsx` |
| 3 | CustomerList | `src/features/customers/components/CustomerList.tsx` |

#### الكود:

```typescript
import { useServerPagination } from '@/hooks/useServerPagination';

// قبل
const { data: invoices } = useQuery(['invoices'], fetchInvoices);

// بعد
const { data: invoices, pagination, setPage, setLimit } = useServerPagination(
  fetchInvoices,
  { queryKey: ['invoices'], initialParams: { page: 1, limit: 20 } }
);
```

### 3.2 Lazy Loading

#### المكونات المطلوب تحميلها كسولاً:

| # | المكون | الملف |
|---|--------|------|
| 1 | AI Components | `src/features/ai/components/*` |
| 2 | Reports | `src/features/accounting/components/reports/*` |
| 3 | Charts | `src/features/dashboard/components/charts/*` |

```typescript
// قبل
import { HeavyComponent } from './HeavyComponent';

// بعد
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

### 3.3 React.memo للجداول

```typescript
const InvoiceRow = React.memo<InvoiceRowProps>(({ invoice }) => {
  return <tr>...</tr>;
}, (prevProps, nextProps) => {
  return prevProps.invoice.id === nextProps.invoice.id &&
         prevProps.invoice.status === nextProps.invoice.status;
});
```

---

## ♿ المرحلة 4: تحسين Accessibility (الأسبوع 3)

### 4.1 إضافة ARIA Labels

```typescript
// قبل
<button>...</button>
<input type="text" />

// بعد
<button aria-label="إضافة فاتورة جديدة">...</button>
<input 
  type="text" 
  aria-label="اسم العميل"
  aria-required="true"
/>
```

### 4.2 إدارة Focus

```typescript
// Focus after modal open
useEffect(() => {
  if (isOpen) {
    firstInputRef.current?.focus();
  }
}, [isOpen]);

// Focus trap in modal
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeModal();
  }
};
```

---

## 🧪 المرحلة 5: إضافة Tests (الأسبوع 3-4)

### 5.1 هيكل الاختبارات

```
src/
├── __tests__/
│   ├── core/
│   │   ├── utils.test.ts
│   │   └── currencyUtils.test.ts
│   ├── features/
│   │   ├── sales/
│   │   ├── purchases/
│   │   └── accounting/
│   └── hooks/
│       ├── useErrorHandler.test.ts
│       └── useServerPagination.test.ts
```

### 5.2 مثال اختبار

```typescript
import { renderHook, act } from '@testing-library/react';
import { useServerPagination } from '../useServerPagination';

const mockFetch = async (params) => ({
  data: [{ id: '1' }],
  total: 1,
  page: params.page,
  limit: params.limit,
  totalPages: 1
});

test('should pagination change page', async () => {
  const { result } = renderHook(() => 
    useServerPagination(mockFetch)
  );

  expect(result.current.pagination.page).toBe(1);

  act(() => {
    result.current.setPage(2);
  });

  expect(result.current.pagination.page).toBe(2);
});
```

---

## 📚 المرحلة 6: التوثيق (الأسبوع 4)

### 6.1 الملفات المطلوب توثيقها

| # | الملف | نوع التوثيق |
|---|------|------------|
| 1 | README.md | مشروع |
| 2 | src/core/types/common.ts | API |
| 3 | src/hooks/useServerPagination.ts | Hook |
| 4 | src/core/hooks/useErrorHandler.ts | Hook |
| 5 | src/core/permissions/index.ts | نظام الصلاحيات |

---

## 📅 الجدول الزمني التفصيلي

| اليوم | المهمة | الملفات |
|-------|--------|--------|
| **الأسبوع 1** | | |
| اليوم 1 | Error Boundaries + useErrorHandler | 10+ ملفات |
| اليوم 2 | إزالة `any` من dashboard services | 3 ملفات |
| اليوم 3 | إزالة `any` من APIs | 3 ملفات |
| اليوم 4 | إزالة `any` من Components | 5 ملفات |
| اليوم 5 | مراجعة ومراجعة | - |
| **الأسبوع 2** | | |
| اليوم 6 | Pagination - InvoiceList | 1 ملف |
| اليوم 7 | Pagination - Purchases/Customers | 2 ملفات |
| اليوم 8 | Lazy Loading - AI Components | 5 ملفات |
| اليوم 9 | React.memo للجداول | 5 ملفات |
| اليوم 10 | مراجعة | - |
| **الأسبوع 3** | | |
| اليوم 11 | Accessibility - ARIA Labels | 10 ملفات |
| اليوم 12 | Accessibility - Focus Management | 5 ملفات |
| اليوم 13 | Jest Setup + اول اختبار | - |
| اليوم 14 | Unit Tests - Utils | 3 ملفات |
| اليوم 15 | مراجعة | - |
| **الأسبوع 4** | | |
| اليوم 16 | Unit Tests - Hooks | 3 ملفات |
| اليوم 17 | Integration Tests | 2 ملفات |
|اليوم 18 | التوثيق - README | - |
| اليوم 19 | التوثيق - API Docs | - |
| اليوم 20 | Final Review | - |

---

## ✅ قائمة المراجعة النهائية

### TypeScript
- [ ] لا يوجد `any` في الكود
- [ ] جميع الـ types مُعرفة
- [ ] strict mode مُفعل

### Error Handling
- [ ] Error Boundary يُغلاف التطبيق
- [ ] useErrorHandler في جميع الـ hooks
- [ ] رسائل خطأ واضحة

### Performance
- [ ] Pagination على جميع القوائم
- [ ] Lazy Loading للمكونات الثقيلة
- [ ] React.memo للجداول

### Accessibility
- [ ] ARIA Labels على جميع المكونات
- [ ] Keyboard Navigation يعمل
- [ ] Color Contrast meets WCAG

### Testing
- [ ] Unit Tests للـ utils
- [ ] Unit Tests للـ hooks
- [ ] Integration Tests للـ flows

### Documentation
- [ ] README محدث
- [ ] API Documentation موجودة
- [ ] Component Examples موجودة

---

## 📈 الأهداف النهائية

| المقياس | قبل | بعد |
|--------|-----|-----|
| TypeScript | 55% | 85% |
| Error Handling | 45% | 80% |
| Accessibility | 55% | 80% |
| Documentation | 45% | 75% |
| Testing | 25% | 60% |
| **الجودة الإجمالية** | **68/100** | **90+/100** |

---

*تم إنشاء هذه الخطة بواسطة Kilo Code*
*26 فبراير 2026*
