# خطة الإصلاح والتحسين الذكية (Smart Performance Fix Plan)

**الهدف:** تحسين أداء التطبيق بشكل جذري — تقليل وقت التحميل، استهلاك الذاكرة، وطلبات الشبكة  
**المدة المقترحة:** 3 أسابيع (21 يوم عمل)  
**الأولوية:** 🔴 حرج > 🟡 متوسط > 🟢 خفيف  

---

## 📊 هيكل الخطة

```
الأسبوع 1 (أيام 1-7)   → 🔴 المشاكل الحرجة — إصلاح فوري
الأسبوع 2 (أيام 8-14)  → 🟡 المشاكل المتوسطة — تحسين ملحوظ
الأسبوع 3 (أيام 15-21) → 🟢 المشاكل الخفيفة + المراقبة
```

---

# 🗓️ الأسبوع الأول: المشاكل الحرجة (Critical Fixes)

## اليوم 1-2: إعادة هيكلة Dashboard API 🔴

### المشكلة: 10 استعلامات متزامنة ثقيلة

**الإجراء 1.1 — إنشاء RPC موحد للوحة التحكم**

إنشاء دالة PostgreSQL جديدة في Supabase:

```sql
CREATE OR REPLACE FUNCTION get_dashboard_data(p_company_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT JSONB_BUILD_OBJECT(
    'summary', (SELECT JSONB_BUILD_OBJECT(
      'total_sales', COALESCE(SUM(CASE WHEN type = 'sale' THEN total_amount ELSE 0 END), 0),
      'total_purchases', COALESCE(SUM(CASE WHEN type = 'purchase' THEN total_amount ELSE 0 END), 0),
      'total_expenses', COALESCE((SELECT SUM(amount) FROM expenses WHERE company_id = p_company_id AND status != 'void'), 0),
      'total_debts', COALESCE((SELECT SUM(balance) FROM party_balances WHERE company_id = p_company_id AND type = 'customer' AND balance > 0), 0),
      'invoice_count', COUNT(*)
    ) FROM invoices WHERE company_id = p_company_id AND status != 'void'),
    'recent_invoices', (SELECT JSONB_AGG(row_to_json(t)) FROM (
      SELECT id, total_amount, issue_date, status, type, party_id
      FROM invoices WHERE company_id = p_company_id AND status != 'void'
      ORDER BY issue_date DESC LIMIT 100
    ) t),
    'recent_expenses', (SELECT JSONB_AGG(row_to_json(t)) FROM (
      SELECT id, amount, expense_date, description, status
      FROM expenses WHERE company_id = p_company_id AND status != 'void'
      ORDER BY expense_date DESC LIMIT 100
    ) t),
    'low_stock_count', (SELECT COUNT(*) FROM products p
      WHERE p.company_id = p_company_id AND p.status = 'active'
      AND (SELECT COALESCE(SUM(quantity), 0) FROM product_stock ps WHERE ps.product_id = p.id) <= p.min_stock_level)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

**الإجراء 1.2 — تعديل [`src/features/dashboard/api/index.ts`](src/features/dashboard/api/index.ts)**

```typescript
// قبل: 10 استعلامات
const batch1 = await Promise.all([...5 queries...]);
const batch2 = await Promise.all([...5 queries...]);

// بعد: استعلام RPC واحد
async fetchRawDashboardData(companyId: string, _dateLimit: string, signal?: AbortSignal) {
    const { data, error } = await supabase
        .rpc('get_dashboard_data', { p_company_id: companyId })
        .abortSignal(signal as any);
    
    if (error) throw error;
    return data;
}
```

**الإجراء 1.3 — زيادة `staleTime` في [`src/features/dashboard/hooks/index.ts`](src/features/dashboard/hooks/index.ts)**

```typescript
// قبل
staleTime: 5 * 60 * 1000, // 5 دقائق

// بعد
staleTime: 30 * 60 * 1000, // 30 دقيقة
```

**المخاطر:** قد يحتاج RPC إلى تعديل إذا تغير schema  
**التراجع:** العودة إلى الاستعلامات المنفصلة  
**مؤشر النجاح:** تقليل وقت تحميل Dashboard من 5-10 ثوانٍ إلى < 1 ثانية

---

## اليوم 3-4: دمج قنوات Realtime وإدارة دورة الحياة 🔴

### المشكلة: 4 قنوات منفصلة + عدم إغلاقها

**الإجراء 2.1 — إنشاء قناة مركزية واحدة**

تعديل [`src/lib/hooks/useRealtimeSync.ts`](src/lib/hooks/useRealtimeSync.ts):

```typescript
// إزالة الاشتراك في schema: 'public' بالكامل
// واستبداله بقائمة محددة من الجداول

const WATCHED_TABLES = [
    'invoices', 'invoice_items', 'products', 
    'product_stock', 'expenses', 'parties'
];

const channel = supabase.channel(channelId);

WATCHED_TABLES.forEach(table => {
    channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `company_id=eq.${companyId}` },
        (payload: any) => { /* invalidate */ }
    );
});
```

**الإجراء 2.2 — إزالة القنوات المنفصلة**

إزالة قنوات Realtime من:
- [`src/features/dashboard/hooks/useDashboard.ts`](src/features/dashboard/hooks/useDashboard.ts:129) — استبدال بـ `useRealtimeSync`
- [`src/features/inventory/hooks/useProductsPaginated.ts`](src/features/inventory/hooks/useProductsPaginated.ts:154) — استبدال بـ `useRealtimeSync`
- [`src/features/inventory/hooks/useProducts.ts`](src/features/inventory/hooks/useProducts.ts:26) — استبدال بـ `useRealtimeSync`

**الإجراء 2.3 — إدارة دورة الحياة الصحيحة**

```typescript
// استخدام useRef لمنع الاشتراك المزدوج في StrictMode
const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

useEffect(() => {
    if (!user?.company_id || channelRef.current) return;
    
    channelRef.current = supabase.channel(channelId);
    // ... تكوين القناة ...
    channelRef.current.subscribe();
    
    return () => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
    };
}, [user?.company_id]);
```

**المخاطر:** قد تفوت بعض التحديثات إذا تم إلغاء الاشتراك مبكراً  
**التراجع:** إعادة القنوات المنفصلة  
**مؤشر النجاح:** تقليل اتصالات WebSocket من 4+ إلى 1

---

## اليوم 5: توحيد نظام المزامنة 🔴

### المشكلة: نظاما مزامنة منفصلان (offlineQueueStore + syncStore)

**الإجراء 3.1 — إزالة النظام القديم**

حذف الملفات:
- [`src/core/services/offlineQueueStore.ts`](src/core/services/offlineQueueStore.ts) — بالكامل
- [`src/core/services/OfflineManager.tsx`](src/core/services/OfflineManager.tsx) — بالكامل

**الإجراء 3.2 — تحديث الاستيرادات**

تعديل [`src/index.tsx`](src/index.tsx):
```typescript
// قبل
import { OfflineManager } from './core/services/OfflineManager';

// بعد
// إزالة الاستيراد بالكامل
```

**الإجراء 3.3 — تقليل حجم IndexedDB Cache**

تعديل [`src/core/lib/react-query.tsx`](src/core/lib/react-query.tsx):
```typescript
// تقليل gcTime من 24 ساعة إلى ساعة واحدة
gcTime: 1000 * 60 * 60, // 1 hour بدلاً من 24 ساعة
```

**المخاطر:** فقدان بعض العمليات غير المتزامنة القديمة  
**التراجع:** إعادة الملفات المحذوفة  
**مؤشر النجاح:** تقليل حجم IndexedDB من غير محدود إلى < 50MB

---

## اليوم 6-7: تحسين ExcelTable 🔴

### المشكلة: مكون واحد بـ 25 prop و 7 hooks

**الإجراء 4.1 — تقسيم ExcelTable إلى مكونات أصغر**

```typescript
// ExcelTable.tsx → مكونات منفصلة
// 1. ExcelTableContainer.tsx — الحاوية الرئيسية
// 2. ExcelTableToolbar.tsx — شريط الأدوات (موجود)
// 3. ExcelTableHeader.tsx — رأس الجدول (موجود)
// 4. ExcelTableBody.tsx — جسم الجدول (موجود)
// 5. ExcelTablePagination.tsx — الترقيم (موجود)
// 6. ExcelTableStatusBar.tsx — شريط الحالة (موجود)
```

**الإجراء 4.2 — إضافة React.memo للمكونات الفرعية**

```typescript
const ExcelTableHeader = React.memo(({ columns, ... }: ExcelTableHeaderProps) => { ... });
const ExcelTableBody = React.memo(({ orderedData, ... }: ExcelTableBodyProps) => { ... });
const ExcelTablePagination = React.memo(({ ... }: ExcelTablePaginationProps) => { ... });
```

**الإجراء 4.3 — إزالة hooks غير المستخدمة**

```typescript
// إزالة useTableDrag إذا لم يكن enableDrag مفعّلاً
const { isDragging, position, handleTableDragStart } = useTableDrag({ 
    enableDrag, // ← إذا كان false، لا يتم إنشاء event listeners
    isZoomed, 
    tableWrapperRef 
});
```

**الإجراء 4.4 — إضافة Virtual Scrolling (اختياري للمرحلة الأولى)**

```bash
npm install @tanstack/react-virtual
```

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
    count: orderedData.length,
    getScrollElement: () => tableRef.current,
    estimateSize: () => 35, // ارتفاع الصف التقريبي
    overscan: 5,
});
```

**المخاطر:** تغيير كبير في مكون أساسي قد يؤثر على صفحات متعددة  
**التراجع:** الاحتفاظ بالنسخة القديمة كـ `ExcelTableLegacy`  
**مؤشر النجاح:** تقليل Re-renders من 10+ لكل تفاعل إلى 1-2

---

# 🗓️ الأسبوع الثاني: المشاكل المتوسطة (Medium Fixes)

## اليوم 8-9: توحيد استعلامات المنتجات 🟡

### المشكلة: 3 hooks مختلفة للمنتجات

**الإجراء 5.1 — إزالة `useProducts` القديم**

تعديل [`src/features/inventory/hooks/useProducts.ts`](src/features/inventory/hooks/useProducts.ts):
- إزالة `useProducts` hook
- الاحتفاظ بـ `useProductMutations` و `useMinimalProducts` و `useItemMovement`

**الإجراء 5.2 — تحديث جميع الاستيرادات**

استبدال `useProducts` بـ `useProductsPaginated` في جميع الملفات:
- [`src/features/inventory/InventoryPage.tsx`](src/features/inventory/InventoryPage.tsx)
- [`src/features/inventory/components/ProductExcelGrid.tsx`](src/features/inventory/components/ProductExcelGrid.tsx)
- أي ملف آخر يستخدم `useProducts`

**الإجراء 5.3 — توحيد query keys**

```typescript
// إنشاء query key factory موحد
export const productKeys = {
    all: ['products'] as const,
    paginated: (companyId: string, page: number, pageSize: number, search: string) => 
        ['products', 'paginated', companyId, page, pageSize, search] as const,
    search: (companyId: string, term: string) => 
        ['products', 'search', companyId, term] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
};
```

**المخاطر:** قد تفقد بعض الميزات التي تعتمد على `useProducts`  
**التراجع:** إعادة `useProducts` كـ `useProductsLegacy`  
**مؤشر النجاح:** تقليل استعلامات المنتجات المكررة

---

## اليوم 10-11: نقل المعالجة إلى الخادم 🟡

### المشكلة: معالجة 1000+ سجل في المتصفح

**الإجراء 6.1 — إنشاء RPC للتحليلات**

```sql
CREATE OR REPLACE FUNCTION get_dashboard_analytics(p_company_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT JSONB_BUILD_OBJECT(
    'sales_trend', (SELECT ...),
    'purchases_trend', (SELECT ...),
    'expenses_trend', (SELECT ...),
    'top_products', (SELECT JSONB_AGG(row_to_json(t)) FROM (
      SELECT product_id, SUM(quantity) as qty, SUM(total) as revenue
      FROM invoice_items ii
      JOIN invoices i ON i.id = ii.invoice_id
      WHERE i.company_id = p_company_id AND i.type = 'sale'
      GROUP BY product_id ORDER BY revenue DESC LIMIT 5
    ) t),
    'top_customers', (SELECT JSONB_AGG(row_to_json(t)) FROM (
      SELECT party_id, SUM(total_amount) as total, COUNT(*) as invoices
      FROM invoices WHERE company_id = p_company_id AND type = 'sale'
      GROUP BY party_id ORDER BY total DESC LIMIT 5
    ) t)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

**الإجراء 6.2 — إزالة المعالجة من الواجهة**

تعديل [`src/features/dashboard/hooks/index.ts`](src/features/dashboard/hooks/index.ts):
- إزالة `calculateDashboardStats` و `calculateDashboardInsights` من `useMemo`
- استبدالها باستدعاء RPC واحد

**الإجراء 6.3 — تبسيط `useDashboardMetrics`**

تعديل [`src/features/dashboard/hooks/useDashboardMetrics.ts`](src/features/dashboard/hooks/useDashboardMetrics.ts):
- إزالة `extractNumericValue` المعقدة
- استخدام القيم المرجعة من RPC مباشرة

**المخاطر:** قد لا تتطابق نتائج RPC تماماً مع المعالجة الحالية  
**التراجع:** الاحتفاظ بالمعالجة القديمة كـ fallback  
**مؤشر النجاح:** تقليل وقت معالجة Dashboard من 500ms إلى < 50ms

---

## اليوم 12-13: تقليل حجم localStorage 🟡

### المشكلة: 8 مخازن Zustand مع persist

**الإجراء 7.1 — دمج المخازن الصغيرة**

```typescript
// دمج themeStore + i18nStore + appearance في مخزن واحد
// src/core/store/preferencesStore.ts
export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set) => ({
            theme: 'light',
            lang: 'ar',
            fontSize: 'medium',
            // ... جميع تفضيلات المستخدم
        }),
        { name: 'alzhra-preferences' } // مخزن واحد بدلاً من 3
    )
);
```

**الإجراء 7.2 — تقليل عدد الإشعارات المحفوظة**

تعديل [`src/features/notifications/store.ts`](src/features/notifications/store.ts):
```typescript
// قبل
notifications: [newNotif, ...state.notifications].slice(0, 100)

// بعد
notifications: [newNotif, ...state.notifications].slice(0, 20)
```

**الإجراء 7.3 — استخدام sessionStorage للبيانات المؤقتة**

```typescript
// المخازن التي لا تحتاج إلى persistence
// useFeedbackStore → sessionStorage (الرسائل مؤقتة)
// useConnectionStore → لا حاجة للتخزين (حالة الاتصال实时)
```

**المخاطر:** فقدان بعض التفضيلات إذا تم الدمج بشكل خاطئ  
**التراجع:** إعادة كل مخزن منفصل  
**مؤشر النجاح:** تقليل حجم localStorage من ~2MB إلى < 200KB

---

## اليوم 14: إضافة Virtual Scrolling 🟡

### المشكلة: جداول بدون virtual scrolling

**الإجراء 8.1 — إضافة `@tanstack/react-virtual`**

```bash
npm install @tanstack/react-virtual
```

**الإجراء 8.2 — تطبيق Virtual Scrolling على ExcelTable**

تعديل [`src/ui/common/ExcelTable.tsx`](src/ui/common/ExcelTable.tsx):
```typescript
// إضافة virtualizer للجداول التي تحتوي على أكثر من 100 صف
const shouldVirtualize = orderedData.length > 100;

if (shouldVirtualize) {
    // استخدام virtualizer
    const virtualizer = useVirtualizer({
        count: orderedData.length,
        getScrollElement: () => tableRef.current,
        estimateSize: () => 35,
        overscan: 10,
    });
    
    // تصيير الصفوف المرئية فقط
    const virtualRows = virtualizer.getVirtualItems();
    // ...
}
```

**الإجراء 8.3 — تطبيق على القوائم الأخرى**

- [`src/features/inventory/components/ProductExcelGrid.tsx`](src/features/inventory/components/ProductExcelGrid.tsx)
- [`src/features/sales/components/list/InvoiceListView.tsx`](src/features/sales/components/list/InvoiceListView.tsx)

**المخاطر:** قد لا يعمل virtual scrolling بشكل جيد مع الجداول القابلة للتحرير  
**التراجع:** تعطيل virtual scrolling للجداول التي تحتوي على `onCellUpdate`  
**مؤشر النجاح:** تقليل عدد عناصر DOM من 1000+ إلى 30-40

---

# 🗓️ الأسبوع الثالث: المشاكل الخفيفة + المراقبة

## اليوم 15-16: تنظيف الملفات غير المستخدمة 🟢

### المشكلة: ملفات مكررة وغير مستخدمة

**الإجراء 9.1 — إزالة ملفات AI غير المستخدمة**

حذف:
- `src/features/ai/memoryService.ts`
- `src/features/ai/posService.ts`
- `src/features/ai/productLookupService.ts`
- `src/features/ai/store.ts`
- `src/features/ai/strictPrompts.ts`
- `src/features/ai/types.ts`
- `src/features/ai/useAIChat.ts`
- `src/features/ai/useSpeechRecognition.ts`
- `src/features/ai/vehicleKnowledge.ts`

**الإجراء 9.2 — دمج re-export files**

```typescript
// src/features/inventory/api/productsApi.ts → حذف
// src/features/inventory/api/warehouseApi.ts → حذف
// تحديث الاستيرادات لاستخدام src/core/database/api مباشرة
```

**الإجراء 9.3 — إزالة `useDashboard` القديم**

تعديل [`src/features/dashboard/hooks/useDashboard.ts`](src/features/dashboard/hooks/useDashboard.ts):
- إزالة جميع hooks غير المستخدمة
- الاحتفاظ فقط بـ `useDashboardAlerts` إذا كان مستخدماً

**المخاطر:** قد تكون بعض الملفات مستخدمة في أماكن غير متوقعة  
**التراجع:** إعادة الملفات المحذوفة  
**مؤشر النجاح:** تقليل عدد الملفات بمقدار 15-20 ملفاً

---

## اليوم 17-18: توحيد أنماط Debounce 🟢

### المشكلة: 3 أنماط مختلفة للبحث

**الإجراء 10.1 — إنشاء hook موحد للـ debounce**

```typescript
// src/lib/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    
    return debouncedValue;
}
```

**الإجراء 10.2 — تطبيق الـ hook الموحد**

تحديث:
- [`src/features/inventory/hooks/useProductsPaginated.ts`](src/features/inventory/hooks/useProductsPaginated.ts) — استخدام `useDebounce`
- [`src/features/sales/hooks/useProductSearch.ts`](src/features/sales/hooks/useProductSearch.ts) — استخدام `useDebounce`

**الإجراء 10.3 — إضافة debounce إلى `useProducts` (إذا بقي)**

```typescript
const debouncedSearch = useDebounce(searchTerm, 300);
```

**المخاطر:** تغيير بسيط، خطر منخفض  
**التراجع:** العودة إلى التنفيذ القديم  
**مؤشر النجاح:** توحيد جميع أنماط debounce في مكان واحد

---

## اليوم 19: تحسين Lazy Loading 🟢

### المشكلة: 17 طلب Lazy Loading منفصل

**الإجراء 11.1 — دمج المكونات المتجانسة**

```typescript
// قبل: 17 Suspense منفصل
<Suspense fallback={<ChartSkeleton />}>
    <SalesFlowChart ... />
</Suspense>
<Suspense fallback={<ChartSkeleton />}>
    <RevenueExpensesChart ... />
</Suspense>
// ... 15 Suspense آخر

// بعد: تجميع المكونات المتشابهة
const DashboardCharts = lazy(() => import('./components/DashboardCharts'));

// DashboardCharts.tsx يحتوي على جميع الرسوم البيانية
```

**الإجراء 11.2 — استخدام `Suspense` واحد للمجموعات**

```typescript
<Suspense fallback={<div className="grid grid-cols-3 gap-3">{/* 3 skeletons */}</div>}>
    <DashboardCharts data={...} />
</Suspense>
```

**المخاطر:** زيادة حجم الـ chunk الواحد  
**التراجع:** إعادة التقسيم إلى chunks أصغر  
**مؤشر النجاح:** تقليل طلبات الشبكة من 17 إلى 5-6

---

## اليوم 20-21: إضافة Performance Monitoring + اختبارات 🟢

### المشكلة: لا توجد مراقبة أداء

**الإجراء 12.1 — إضافة Web Vitals**

```bash
npm install web-vitals
```

```typescript
// src/lib/performance.ts
import { onLCP, onFID, onCLS, onINP } from 'web-vitals';

export function reportWebVitals() {
    onLCP(console.log); // Largest Contentful Paint
    onFID(console.log); // First Input Delay
    onCLS(console.log); // Cumulative Layout Shift
    onINP(console.log); // Interaction to Next Paint
}
```

**الإجراء 12.2 — إضافة React DevTools Profiler**

```typescript
// تسجيل عدد مرات إعادة التصيير في development
if (import.meta.env.DEV) {
    const whyDidYouRender = await import('@welldone-software/why-did-you-render');
    whyDidYouRender(React, {
        trackAllPureComponents: true,
        trackHooks: true,
    });
}
```

**الإجراء 12.3 — اختبارات الأداء**

```typescript
// src/test/performance/dashboard.test.ts
describe('Dashboard Performance', () => {
    it('should load under 1 second', async () => {
        const start = performance.now();
        render(<DashboardPage />);
        await waitFor(() => expect(screen.getByText('ملخص الأداء')).toBeInTheDocument());
        const end = performance.now();
        expect(end - start).toBeLessThan(1000);
    });
});
```

**المخاطر:** تأثير طفيف على الأداء في development  
**التراجع:** تعطيل profiling في production  
**مؤشر النجاح:** وجود مقاييس أداء قابلة للقياس

---

# 📋 جدول المتابعة اليومي (Daily Checklist)

| اليوم | التاريخ | المهمة | الحالة | ملاحظات |
|-------|---------|--------|--------|---------|
| 1 | - | إنشاء RPC للوحة التحكم | ⬜ | |
| 2 | - | تعديل Dashboard API | ⬜ | |
| 3 | - | دمج قنوات Realtime | ⬜ | |
| 4 | - | إدارة دورة حياة القنوات | ⬜ | |
| 5 | - | توحيد نظام المزامنة | ⬜ | |
| 6 | - | تقسيم ExcelTable | ⬜ | |
| 7 | - | إضافة Virtual Scrolling | ⬜ | |
| 8 | - | توحيد استعلامات المنتجات | ⬜ | |
| 9 | - | تحديث الاستيرادات | ⬜ | |
| 10 | - | إنشاء RPC للتحليلات | ⬜ | |
| 11 | - | إزالة المعالجة من الواجهة | ⬜ | |
| 12 | - | دمج مخازن Zustand | ⬜ | |
| 13 | - | تقليل حجم التخزين | ⬜ | |
| 14 | - | Virtual Scrolling للجداول | ⬜ | |
| 15 | - | تنظيف الملفات غير المستخدمة | ⬜ | |
| 16 | - | دمج re-export files | ⬜ | |
| 17 | - | إنشاء useDebounce الموحد | ⬜ | |
| 18 | - | تطبيق useDebounce | ⬜ | |
| 19 | - | تحسين Lazy Loading | ⬜ | |
| 20 | - | إضافة Performance Monitoring | ⬜ | |
| 21 | - | اختبارات الأداء | ⬜ | |

---

# 📊 مقاييس النجاح (KPIs)

| المقياس | قبل | بعد (هدف) | طريقة القياس |
|---------|-----|-----------|-------------|
| وقت تحميل Dashboard | 5-10 ثوانٍ | < 1 ثانية | `performance.now()` |
| استعلامات DB عند التحميل | 10+ | 1-2 | Supabase Logs |
| قنوات WebSocket مفتوحة | 4+ | 1 | Chrome DevTools → Network → WS |
| حجم IndexedDB Cache | غير محدود | < 50MB | Chrome DevTools → Application → IndexedDB |
| عدد Re-renders (ExcelTable) | 10+ لكل تفاعل | 1-2 | React DevTools Profiler |
| استهلاك الذاكرة (idle) | 100-200MB | 40-60MB | Chrome Task Manager |
| وقت استجابة البحث | 1-3 ثوانٍ | < 300ms | قياس يدوي |
| حجم localStorage | ~2MB | < 200KB | `JSON.stringify(localStorage).length` |
| عدد عناصر DOM (جدول 1000 صف) | 1000+ | 30-40 | Chrome DevTools → Elements |

---

# 🚨 خطة الطوارئ (Rollback Plan)

| السيناريو | الإجراء | الوقت المقدر |
|-----------|---------|-------------|
| RPC الجديد لا يعمل | العودة إلى الاستعلامات المنفصلة | 30 دقيقة |
| قناة Realtime الموحدة تفقد تحديثات | إعادة قناة منفصلة للوحة التحكم | 15 دقيقة |
| ExcelTable المتغير يسبب أخطاء | استخدام `ExcelTableLegacy` مؤقتاً | 1 ساعة |
| Virtual Scrolling يكسر التحرير | تعطيل virtual للجداول القابلة للتحرير | 30 دقيقة |
| فقدان بيانات المزامنة | إعادة `offlineQueueStore` | 1 ساعة |

---

# 💡 ملاحظات إضافية

1. **التدرج في التغيير:** كل إجراء يجب أن يكون في PR منفصل مع اختبارات
2. **التوازي:** يمكن تنفيذ بعض المهام بالتوازي (مثل اليوم 6 و 8)
3. **التوثيق:** توثيق كل تغيير في ملف CHANGELOG.md
4. **التعاون:** مشاركة التقرير مع الفريق قبل البدء في التنفيذ
5. **الاختبار:** اختبار كل تغيير على بيئة staging قبل production

---

*تم إعداد هذه الخطة في 2026-05-26 بناءً على تقرير فحص الأداء الشامل*
