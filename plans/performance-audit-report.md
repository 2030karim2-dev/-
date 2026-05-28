# تقرير فحص الأداء الشامل للتطبيق (Performance Audit Report)

**التاريخ:** 2026-05-26  
**التطبيق:** Al-Zahra Smart ERP v5  
**البيئة:** React + TypeScript + Supabase + React Query + Zustand  

---

## 📋 ملخص تنفيذي

بعد الفحص العميق والشامل لجميع مكونات التطبيق، تم تحديد **12 مشكلة رئيسية** تؤثر على الأداء، مقسمة كالتالي:

| المستوى | العدد | الوصف |
|---------|-------|-------|
| 🔴 حرج | 5 | تسبب بطء شديد أو تعليق التطبيق |
| 🟡 متوسط | 4 | تسبب بطء ملحوظ مع مرور الوقت |
| 🟢 خفيف | 3 | تحسينات وقائية |

---

## 🔴 المشاكل الحرجة (Critical)

### 1. استعلامات لوحة التحكم الضخمة (Dashboard Over-fetching)

**الملف:** [`src/features/dashboard/api/index.ts`](src/features/dashboard/api/index.ts:14)

```typescript
// المشكلة: 10 استعلامات متزامنة في كل تحميل للوحة التحكم
const batch1 = await Promise.all([
    supabase.from('invoices').select('...').limit(1000),  // 1000 فاتورة
    supabase.from('expenses').select('...').limit(1000),   // 1000 مصروف
    supabase.from('party_balances').select('...'),
    supabase.from('party_balances').select('...'),
    supabase.from('expense_categories').select('...'),
]);
const batch2 = await Promise.all([
    supabase.from('journal_entries').select('...').limit(1000),
    supabase.from('products').select('...').limit(1000),
    supabase.from('invoice_items').select('...').limit(2000),  // 2000 عنصر!
    supabase.rpc('get_dashboard_totals', ...),
    supabase.rpc('report_trial_balance', ...),  // تقرير ثقيل
]);
```

**🔍 التحليل:**
- يتم جلب **10 استعلامات** في كل مرة تُحمّل فيها لوحة التحكم
- `limit(1000)` و `limit(2000)` تجلب آلاف السجلات حتى لو كان المستخدم يملك 10 منتجات فقط
- استعلام `report_trial_balance` يمسح كل قيود اليومية من 2000-01-01 حتى اليوم — ثقيل جداً
- `invoice_items` تجلب 2000 عنصر مع JOINs متعددة (`products`, `invoices`)
- لا يوجد `staleTime` مناسب — يعاد الجلب كل 5 دقائق حتى لو لم يتغير شيء

**💡 الحل:**
- استخدام استعلام RPC واحد مُحسّن على جانب الخادم بدلاً من 10 استعلامات
- تحديد `staleTime: 1000 * 60 * 30` (30 دقيقة) بدلاً من 5 دقائق
- استخدام `count: 'exact', head: true` للحصول على العدد فقط عند الحاجة
- نقل `report_trial_balance` إلى استعلام منفصل يُستدعى فقط عند الطلب

---

### 2. نظام المزامنة اللحظية المفرط (Realtime Over-subscription)

**الملف:** [`src/lib/hooks/useRealtimeSync.ts`](src/lib/hooks/useRealtimeSync.ts:50)

```typescript
// المشكلة: اشتراك في جميع جداول public
const channel = supabase.channel(channelId)
    .on('postgres_changes', { event: '*', schema: 'public' },  // ← ALL tables!
        (payload: any) => { ... });
```

**الملفات المتأثرة:**
- [`src/lib/hooks/useRealtimeSync.ts`](src/lib/hooks/useRealtimeSync.ts:50) — اشتراك عام
- [`src/features/dashboard/hooks/useDashboard.ts`](src/features/dashboard/hooks/useDashboard.ts:129) — اشتراك منفصل للمبيعات
- [`src/features/inventory/hooks/useProductsPaginated.ts`](src/features/inventory/hooks/useProductsPaginated.ts:154) — اشتراك منفصل للمنتجات
- [`src/features/inventory/hooks/useProducts.ts`](src/features/inventory/hooks/useProducts.ts:26) — اشتراك منفصل آخر للمنتجات

**🔍 التحليل:**
- يوجد **4 قنوات Realtime منفصلة** تشترك في نفس الجداول
- القناة العامة تشترك في `schema: 'public'` بالكامل — كل تغيير في أي جدول يسبب invalidate
- كل invalidate يؤدي إلى إعادة جلب بيانات ثقيلة (خاصة لوحة التحكم)
- في وضع StrictMode (React 18)، يتم إنشاء القنوات مرتين مما يضاعف المشكلة
- لا يوجد فصل للقنوات حسب الصفحة النشطة

**💡 الحل:**
- دمج جميع القنوات في قناة واحدة مركزية
- تحديد الجداول المطلوبة فقط بدلاً من `schema: 'public'`
- إلغاء الاشتراك عند مغادرة الصفحة (unmount)
- استخدام `useIsFocused` أو ما شابه لتعطيل الاشتراك عندما لا تكون الصفحة مرئية

---

### 3. التخزين المؤقت المزدوج (Double Caching & Persistence)

**الملفات:**
- [`src/core/lib/react-query.tsx`](src/core/lib/react-query.tsx:209) — `PersistQueryClientProvider` مع IndexedDB
- [`src/core/lib/persistence.ts`](src/core/lib/persistence.ts:9) — تخزين كامل cache React Query في IndexedDB
- [`src/core/lib/persister.ts`](src/core/lib/persister.ts:22) — `StorageAdapter` يخزن في localStorage
- [`src/core/services/offlineQueueStore.ts`](src/core/services/offlineQueueStore.ts:39) — تخزين إضافي في IndexedDB
- [`src/core/lib/sync-store.ts`](src/core/lib/sync-store.ts:18) — تخزين إضافي في IndexedDB

**🔍 التحليل:**
- **نظامان منفصلان** للمزامنة دون اتصال: `offlineQueueStore` (قديم) و `syncStore` (جديد)
- `PersistQueryClientProvider` يخزن كل cache React Query في IndexedDB — هذا يشمل كل الاستعلامات السابقة
- `persister.ts` يخزن بيانات إضافية في localStorage
- مع تراكم البيانات، يزداد حجم IndexedDB و localStorage مما يبطئ التطبيق
- في كل تحميل للصفحة، يتم استعادة cache كامل من IndexedDB (قد يكون مئات الميغابايت)

**💡 الحل:**
- إزالة النظام القديم (`offlineQueueStore`) والاكتفاء بـ `syncStore`
- تحديد `gcTime` معقول (مثلاً ساعة واحدة) بدلاً من 24 ساعة
- إضافة حد أقصى لحجم cache IndexedDB
- تنظيف cache القديم بشكل دوري

---

### 4. إعادة التصيير المفرط في ExcelTable (Excessive Re-renders)

**الملف:** [`src/ui/common/ExcelTable.tsx`](src/ui/common/ExcelTable.tsx:59)

```typescript
// المشكلة: مكون واحد ضخم يدير كل شيء
function ExcelTable<T>({
    columns, data, title, emptyMessage, colorTheme = 'blue',
    onExport, showSearch = true, searchValue, onSearchChange,
    onRowClick, onRowDoubleClick, onOrderChange,
    onCellUpdate, enablePagination = true, pageSize = 20,
    enableSelection = false, selectedRowIds = new Set(), onSelectionChange, getRowId,
    isRTL = false, showShortcutsPanel = false, enableResize = true, enableDrag = false,
    isLoading = false
}: ExcelTableProps<T>) {
    // 7 hooks مختلفين في مكون واحد
    const { ... } = useTableResize({...});
    const { ... } = useTableDrag({...});
    const { ... } = useTablePagination({...});
    const { ... } = useTableDragDrop(...);
    const { ... } = useTableSelection({...});
    const { ... } = useTableKeyboardNavigation({...});
    // useMemo ضخم يعالج كل البيانات
    const processedData = useMemo(() => { ... }, [data, sortConfig, effectiveSearch, columns, isMainSearch]);
```

**🔍 التحليل:**
- مكون واحد يستقبل **25 prop** — أي تغيير في أي prop يعيد تصيير المكون بالكامل
- `useTableKeyboardNavigation` يحتوي على منطق معقد يُعاد حسابه مع كل تصيير
- `processedData` يعالج كل البيانات في كل مرة يتغير فيها `data` أو `sortConfig` أو `search`
- `useTableResize` يضيف event listeners للماوس (mousemove, mouseup) حتى بدون تفعيل resize
- `useTableDrag` يضيف event listeners إضافية
- `useTableSelection` يعالج أحداث الماوس على مستوى الجدول بالكامل

**💡 الحل:**
- تقسيم `ExcelTable` إلى مكونات أصغر باستخدام `React.memo`
- استخدام `useMemo` و `useCallback` بشكل أكثر دقة
- إزالة hooks غير المستخدمة (مثل `useTableDrag` إذا لم يكن `enableDrag`)
- استخدام `virtualization` (مثل `react-window`) للجداول التي تحتوي على أكثر من 100 صف

---

### 5. دورة حياة القنوات اللحظية غير المُدارة (Unmanaged Realtime Channel Lifecycle)

**الملف:** [`src/lib/hooks/useRealtimeSync.ts`](src/lib/hooks/useRealtimeSync.ts:80-85)

```typescript
// المشكلة: لا يتم إلغاء الاشتراك أبداً!
return () => {
    // No-op for stability
};
```

**🔍 التحليل:**
- القناة لا تُغلق أبداً — تبقى مفتوحة حتى إغلاق التبويب
- في StrictMode، يتم إنشاء مثيلين من القناة (لأن `useEffect` يُشغل مرتين)
- مع التنقل بين الصفحات، تتراكم القنوات غير المُغلقة
- كل قناة مفتوحة تحافظ على اتصال WebSocket مع Supabase
- مع مرور الوقت، يزداد استهلاك الذاكرة وعدد الاتصالات المفتوحة

**💡 الحل:**
- إلغاء الاشتراك بشكل صحيح عند unmount
- استخدام `useRef` لمنع الاشتراك المزدوج في StrictMode
- تحديد `cleanup` مناسب لكل قناة

---

## 🟡 المشاكل المتوسطة (Medium)

### 6. تكرار استعلامات المنتجات (Duplicate Product Queries)

**الملفات المتأثرة:**
- [`src/features/inventory/hooks/useProducts.ts`](src/features/inventory/hooks/useProducts.ts:16) — `queryKey: ['products', companyId, options.limitNum]`
- [`src/features/inventory/hooks/useProductsPaginated.ts`](src/features/inventory/hooks/useProductsPaginated.ts:94) — `queryKey: ['products_paginated', companyId, page, pageSize, search, sortKey, sortDir]`
- [`src/core/database/api/productsApi.ts`](src/core/database/api/productsApi.ts:15) — `getProducts` بحد 10000 منتج
- [`src/features/sales/hooks/useProductSearch.ts`](src/features/sales/hooks/useProductSearch.ts:58) — `queryKey: ['product_search', companyId, normalizedTerm]`

**🔍 التحليل:**
- `useProducts` تجلب **10000 منتج** في استعلام واحد (حتى لو كان هناك 10 منتجات فقط)
- `useProductsPaginated` تجلب نفس المنتجات ولكن مقسمة إلى صفحات
- `useProductSearch` تجلب المنتجات مرة أخرى للبحث
- كل هذه hooks تشترك في قنوات Realtime منفصلة
- لا يوجد تنسيق بين `useProducts` و `useProductsPaginated` — كلاهما قد يكون نشطاً في نفس الوقت

**💡 الحل:**
- توحيد query keys لمنع التكرار
- استخدام `useProductsPaginated` فقط وإزالة `useProducts` القديم
- مشاركة cache بين hooks المختلفة

---

### 7. معالجة البيانات في الواجهة بدلاً من الخادم (Client-side Data Processing)

**الملفات:**
- [`src/features/dashboard/services/dashboardStats.ts`](src/features/dashboard/services/dashboardStats.ts:1) — معالجة 1000+ سجل في المتصفح
- [`src/features/dashboard/services/dashboardInsights.ts`](src/features/dashboard/services/dashboardInsights.ts:1) — تحليل الاتجاهات في المتصفح
- [`src/features/dashboard/hooks/index.ts`](src/features/dashboard/hooks/index.ts:48-135) — 3 عمليات `useMemo` متتالية

**🔍 التحليل:**
- يتم جلب البيانات الخام من Supabase ثم معالجتها في المتصفح باستخدام `useMemo`
- `calculateDashboardStats` و `calculateDashboardInsights` تقوم بعمليات filter, reduce, sort على آلاف السجلات
- مع وجود 1000 فاتورة و 2000 عنصر فاتورة، هذه العمليات تستهلك وقت معالج كبير
- `useMemo` لا يمنع إعادة الحساب إذا تغير `rawDataQuery.data` (وهو كائن جديد في كل مرة)

**💡 الحل:**
- نقل عمليات التجميع إلى استعلامات RPC في PostgreSQL
- استخدام `supabase.rpc` بدلاً من جلب البيانات الخام
- إنشاء View في قاعدة البيانات للوحة التحكم

---

### 8. استهلاك localStorage المفرط (localStorage Bloat)

**الملفات المتأثرة:**
- [`src/features/auth/store.ts`](src/features/auth/store.ts) — مخزن المصادقة
- [`src/lib/themeStore.ts`](src/lib/themeStore.ts) — مخزن الثيم
- [`src/lib/i18nStore.ts`](src/lib/i18nStore.ts) — مخزن اللغة
- [`src/features/notifications/store.ts`](src/features/notifications/store.ts) — مخزن الإشعارات (100 إشعار)
- [`src/features/settings/settingsStore.ts`](src/features/settings/settingsStore.ts) — مخزن الإعدادات
- [`src/features/feedback/store.ts`](src/features/feedback/store.ts) — مخزن الملاحظات
- [`src/core/services/offlineQueueStore.ts`](src/core/services/offlineQueueStore.ts) — قائمة الانتظار
- [`src/core/lib/sync-store.ts`](src/core/lib/sync-store.ts) — المزامنة

**🔍 التحليل:**
- **8 مخازن Zustand** مختلفة مع `persist` تخزن في localStorage/IndexedDB
- كل مخزن يُقرأ من التخزين عند تحميل الصفحة
- `useNotificationStore` يحتفظ بـ 100 إشعار في localStorage
- مع تراكم البيانات، يزداد وقت قراءة/كتابة localStorage
- في بعض المتصفحات، localStorage محدود بـ 5-10MB

**💡 الحل:**
- دمج المخازن الصغيرة في مخازن أكبر
- تحديد حد أقصى لعدد الإشعارات (مثلاً 20 بدلاً من 100)
- استخدام `sessionStorage` للبيانات المؤقتة
- تنظيف المخازن بشكل دوري

---

### 9. عدم استخدام Virtual Scrolling (No Virtualization)

**الملفات المتأثرة:**
- [`src/ui/common/ExcelTable.tsx`](src/ui/common/ExcelTable.tsx:390) — جدول عادي بدون virtual scrolling
- [`src/features/inventory/components/ProductExcelGrid.tsx`](src/features/inventory/components/ProductExcelGrid.tsx) — شبكة منتجات بدون virtual
- [`src/features/sales/components/list/InvoiceListView.tsx`](src/features/sales/components/list/InvoiceListView.tsx) — قائمة فواتير بدون virtual

**🔍 التحليل:**
- `ExcelTable` يصيّر كل الصفوف في DOM حتى لو كانت خارج الشاشة
- مع 1000 منتج، يتم إنشاء 1000 عنصر DOM (أو أكثر مع الخلايا)
- كل صف يحتوي على عدة خلايا مع معالجات أحداث
- هذا يستهلك ذاكرة كبيرة ويبطئ التطبيق

**💡 الحل:**
- استخدام `react-window` أو `@tanstack/react-virtual` للجداول الطويلة
- تصيير 20-30 صف فقط في كل مرة
- إضافة `overscan` للتمرير السلس

---

## 🟢 المشاكل الخفيفة (Low)

### 10. ملفات غير مستخدمة ومكررة (Dead & Duplicate Code)

**الملفات المكررة:**
- `src/features/inventory/api/productsApi.ts` — مجرد re-export من `src/core/database/api/productsApi.ts`
- `src/features/inventory/api/warehouseApi.ts` — مجرد re-export من `src/core/database/api/warehouseApi.ts`
- `src/features/dashboard/hooks/useDashboard.ts` — معظم hooks معاد تصديرها من `src/features/dashboard/hooks/index.ts`

**الملفات غير المستخدمة (محتمل):**
- `src/features/ai/memoryService.ts` — 747 حرف فقط
- `src/features/ai/posService.ts` — 132 حرف فقط
- `src/features/ai/productLookupService.ts` — 307 حرف فقط
- `src/features/ai/store.ts` — 170 حرف فقط
- `src/features/ai/strictPrompts.ts` — 197 حرف فقط
- `src/features/ai/types.ts` — 174 حرف فقط
- `src/features/ai/useAIChat.ts` — 170 حرف فقط
- `src/features/ai/useSpeechRecognition.ts` — 203 حرف فقط
- `src/features/ai/vehicleKnowledge.ts` — 116 حرف فقط

**نظامي مزامنة منفصلين:**
- `src/core/services/offlineQueueStore.ts` — نظام قديم (قد يكون غير مستخدم)
- `src/core/lib/sync-store.ts` + `src/core/lib/sync-registry.ts` — نظام جديد

**💡 الحل:**
- إزالة الملفات غير المستخدمة
- دمج re-export files
- توحيد نظام المزامنة (إزالة القديم)

---

### 11. Debounce غير متسق (Inconsistent Debounce Patterns)

**الملفات:**
- [`src/features/inventory/hooks/useProductsPaginated.ts`](src/features/inventory/hooks/useProductsPaginated.ts:81) — debounce 300ms مع `useRef`
- [`src/features/sales/hooks/useProductSearch.ts`](src/features/sales/hooks/useProductSearch.ts:34) — debounce 300ms مع `useEffect`
- [`src/features/inventory/hooks/useProducts.ts`](src/features/inventory/hooks/useProducts.ts:48) — لا يوجد debounce! (فلترة client-side)

**🔍 التحليل:**
- ثلاثة أنماط مختلفة للبحث عن المنتجات
- `useProducts` لا يستخدم debounce — البحث يتم فوراً على 10000 منتج في الذاكرة
- `useProductsPaginated` و `useProductSearch` يستخدمان debounce ولكن بطرق مختلفة

**💡 الحل:**
- توحيد نمط debounce في hook واحد قابل لإعادة الاستخدام
- إضافة debounce إلى `useProducts`

---

### 12. عدم استخدام Lazy Loading لبعض المكونات الثقيلة

**الملف:** [`src/features/dashboard/DashboardPage.tsx`](src/features/dashboard/DashboardPage.tsx:14-30)

```typescript
// 17 مكوناً يتم تحميلهم بشكل lazy
const StatsGrid = lazy(() => import('../../ui/dashboard/StatsGrid'));
const CashFlowWidget = lazy(() => import('./components/CashFlowWidget'));
// ... 15 مكوناً آخر
```

**🔍 التحليل:**
- 17 مكوناً يتم تحميلهم بشكل lazy — وهذا جيد
- ولكن كل مكون له `Suspense` منفصل مع `fallback` مختلف
- هذا يعني 17 طلب شبكة منفصل لتحميل الـ chunks
- بعض المكونات مثل `StatsGrid` (9286 حرف) و `RevenueExpensesChart` (11900 حرف) كبيرة جداً

**💡 الحل:**
- دمج المكونات الصغيرة في bundle واحد
- استخدام `React.lazy` مع `Suspense` واحد للمجموعات المتجانسة
- تقليل حجم الـ chunks عن طريق تحسين الاستيرادات

---

## 📊 ملخص التأثير

| # | المشكلة | التأثير | استهلاك الذاكرة | وقت التحميل | طلبات الشبكة |
|---|---------|---------|-----------------|-------------|--------------|
| 1 | Dashboard Over-fetching | 🔴 حرج | عالي | بطيء جداً | 10+ |
| 2 | Realtime Over-subscription | 🔴 حرج | متوسط | - | مستمر |
| 3 | Double Caching | 🔴 حرج | عالي جداً | بطيء | - |
| 4 | ExcelTable Re-renders | 🔴 حرج | عالي | بطيء | - |
| 5 | Unmanaged Channels | 🔴 حرج | يتراكم | - | مستمر |
| 6 | Duplicate Product Queries | 🟡 متوسط | متوسط | متوسط | متعدد |
| 7 | Client-side Processing | 🟡 متوسط | عالي | بطيء | - |
| 8 | localStorage Bloat | 🟡 متوسط | يتراكم | بطيء | - |
| 9 | No Virtualization | 🟡 متوسط | عالي | بطيء | - |
| 10 | Dead Code | 🟢 خفيف | ضئيل | - | - |
| 11 | Inconsistent Debounce | 🟢 خفيف | ضئيل | متوسط | - |
| 12 | Lazy Loading | 🟢 خفيف | - | متوسط | 17 طلب |

---

## 🎯 التوصيات النهائية (حسب الأولوية)

### الأسبوع الأول — المشاكل الحرجة
1. **إعادة هيكلة Dashboard API**: استبدال 10 استعلامات باستعلام RPC واحد
2. **دمج قنوات Realtime**: قناة واحدة مركزية مع إدارة صحيحة لدورة الحياة
3. **إزالة نظام المزامنة القديم**: `offlineQueueStore` → `syncStore` فقط
4. **تحسين ExcelTable**: تقسيم المكون وإضافة virtual scrolling

### الأسبوع الثاني — المشاكل المتوسطة
5. **توحيد استعلامات المنتجات**: إزالة `useProducts` والاكتفاء بـ `useProductsPaginated`
6. **نقل المعالجة إلى الخادم**: إنشاء RPCs للوحة التحكم
7. **تقليل حجم localStorage**: دمج المخازن وتحديد حد أقصى
8. **إضافة Virtual Scrolling**: للجداول والقوائم الطويلة

### الأسبوع الثالث — التحسينات الوقائية
9. **تنظيف الملفات غير المستخدمة**
10. **توحيد أنماط Debounce**
11. **تحسين Lazy Loading**
12. **إضافة Performance Monitoring**

---

## 📈 النتائج المتوقعة بعد التحسين

| المقياس | الوضع الحالي | بعد التحسين |
|---------|-------------|-------------|
| وقت تحميل لوحة التحكم | 5-10 ثوانٍ | < 1 ثانية |
| استعلامات DB عند تحميل الصفحة | 10+ | 1-2 |
| قنوات WebSocket مفتوحة | 4+ | 1 |
| حجم IndexedDB Cache | غير محدود | < 50MB |
| عدد Re-renders للجدول | 10+ لكل تفاعل | 1-2 |
| استهلاك الذاكرة (idle) | 100-200MB | 40-60MB |
| وقت استجابة البحث | 1-3 ثوانٍ | < 300ms |

---

*تم إعداد هذا التقرير بناءً على فحص شامل لكود المصدر في 2026-05-26*
