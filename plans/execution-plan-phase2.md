# خطة التنفيذ: تحسين أداء التطبيق - المرحلة الثانية

## Executive Summary

خطة تنفيذية مفصلة للمهام المتبقية لتحسين أداء التطبيق. يتم ترتيب المهام بناءً على الاعتمادية (Dependencies) والأولوية التقنية.

---

## تحليل المهام والاعتماديات

| # | المهمة | Priority | Dependencies | Risk Level |
|---|--------|----------|--------------|------------|
| 1 | فلترة جداول Realtime | 🔴 High | None | Medium |
| 2 | إزالة القناة من useDashboard.ts | 🔴 High | None | Low |
| 3 | تطبيق useDebounce على useProductsPaginated.ts | 🟡 Medium | None | Low |
| 4 | حذف ملفات re-export غير الضرورية | 🟡 Medium | None | Medium |
| 5 | تنفيذ Virtual Scrolling | 🟢 Low | Tasks 1, 2, 3 | High |

---

## الجدول الزمني المقترح

### الأسبوع الأول - Foundation Week

#### 📅 اليوم 1-2: فلترة جداول Realtime

**الملف المستهدف:**
[`useRealtimeSync.ts`](src/lib/hooks/useRealtimeSync.ts:60-78)

**الوضع الحالي:**
```typescript
.on(
    'postgres_changes',
    { event: '*', schema: 'public' },  // ⚠️ يتتبع كل الجداول
    (payload: any) => { ... }
)
```

**الوضع المرغوب:**
```typescript
.on(
    'postgres_changes',
    { 
        event: '*', 
        schema: 'public',
        table: 'invoices'      // ✅ جدول واحد فقط
    }
)
```

**الجداول المطلوب مراقبتها (WATCHED_TABLES):**
```typescript
const WATCHED_TABLES = [
    'invoices',
    'invoice_items', 
    'payments',
    'expenses',
    'journal_entries',
    'products',
    'parties',
    'companies',
    'product_categories',
    'warehouses',
    'expense_categories'
];
```

**آلية التنفيذ:**
1. إنشاء ثابت `WATCHED_TABLES` في [`useRealtimeSync.ts`](src/lib/hooks/useRealtimeSync.ts:8-21)
2. تحويل المراقب إلى قائمة من المراقبين، واحد لكل جدول
3. استخدام `TABLE_PRESET_MAP`来确定失效预设

**التحديات المحتملة:**
- ⚠️ Supabase free tier يحدد عدد_channels
- ⚠️ قد تحتاج إلى تجميع失效 إذا كان هناك تداخل

**خطوات التنفيذ:**
```typescript
// 1. إضافة الثابت
const WATCHED_TABLES = [
    'invoices', 'invoice_items', 'payments', 'expenses',
    'journal_entries', 'products', 'parties', 'companies',
    'product_categories', 'warehouses', 'expense_categories'
];

// 2. تحويل إلى مراقبين متعددين
WATCHED_TABLES.forEach(table => {
    const channel = supabase.channel(`${channelId}-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table },
            (payload) => handleRealtimePayload(payload)
        )
        .subscribe();
    channels.push(channel);
});
```

---

#### 📅 اليوم 3-4: إزالة القناة من useDashboard.ts

**الملفات المستهدفة:**
- [`useDashboard.ts`](src/features/dashboard/hooks/useDashboard.ts:149-151)
- [`useProductsPaginated.ts`](src/features/inventory/hooks/useProductsPaginated.ts:152-165)
- [`useStockAudit.ts`](src/features/inventory/hooks/useStockAudit.ts:47-48)

**الوضع الحالي:**
Each hook creates its own Supabase channel for real-time updates.

**الوضع المرغوب:**
All real-time updates go through the global `useRealtimeSync` hook only.

**آلية التنفيذ:**

1. **useDashboard.ts:** 
   - تحديد إذا كان يستخدم قناة خاصة أم لا
   - إذا كانت القناة موجودة، إزالتها والاعتماد على[`useRealtimeSync`](src/lib/hooks/useRealtimeSync.ts:26-100)

2. **useProductsPaginated.ts:**
   - تحليل لماذا تحتاج قناة خاصة (راجع السطر 156)
   - قد تحتاج إلى إضافة `products` إلى `TABLE_PRESET_MAP`

3. **useStockAudit.ts:**
   - التحقق من إذا كانت القناة ضرورية

**خطوات التنفيذ:**

```typescript
// useDashboard.ts - إزالة القناة
// ❌ إزالة:
// useEffect(() => {
//     const channel = supabase.channel(...)
//         .on('postgres_changes', ...)
//         .subscribe();
//     return () => supabase.removeChannel(channel);
// }, [companyId, queryClient]);

// ✅ يعتمد على:
// useRealtimeSync() // يتم استدعاؤه في DashboardPage
```

**التحديات المحتملة:**
- قد تكون القناة المحلية مطلوبة لحالة معينة
- يجب التأكد من أن失效 يعمل بشكل صحيح

---

#### 📅 اليوم 5: تطبيق useDebounce على useProductsPaginated.ts

**الملف المستهدف:**
[`useProductsPaginated.ts`](src/features/inventory/hooks/useProductsPaginated.ts:74-88)

**الوضع الحالي:**
يستخدم debounce مخصص باستخدام `useRef` و `setTimeout`:

```typescript
const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
useEffect(() => {
    return () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
}, []);
const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
    }, 300);
}, []);
```

**الوضع المرغوب:**
استخدام[`useDebounce`](src/lib/hooks/useDebounce.ts:14-23) الموحد:

```typescript
// ✅ جديد
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
    setPage(1); // reset to first page on new search
}, [debouncedSearch]);
```

**آلية التنفيذ:**

1. استيراد `useDebounce` من [`lib/hooks/useDebounce.ts`](src/lib/hooks/useDebounce.ts:14-23)
2. إزالة `useRef` و `useEffect` القديمة
3. استخدام`debouncedSearch` مباشرة في queryKey

**خطوات التنفيذ:**

```typescript
// قبل
import { useEffect, useRef, useState, useCallback } from 'react';
// بعد
import { useState, useCallback } from 'react';
import { useDebounce } from '../../../lib/hooks/useDebounce';

// في المكون
const [search, setSearch] = useState(initialSearch);
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
    setPage(1);
}, [debouncedSearch]);
```

**التحديات المحتملة:**
- يجب التأكد من أن السلوك不变 (reset page on new search)
- قد يؤثر على existing tests

---

### الأسبوع الثاني - Cleanup & Optimization

#### 📅 اليوم 6-7: حذف ملفات re-export غير الضرورية

**الملفات المستهدفة:**
البحث في الملفات التي تستخدم `export * from` و `export { ... } from`

**أمثلة على الملفاتالمشبوهة:**

| الملف | المشكلة المحتملة |
|-------|-----------------|
| `src/core/index.ts` | Re-export كل شيء，可能会导致 circular imports |
| `src/features/*/index.ts` | barrel exports متعددة |
| `src/core/utils/index.ts` | قد يكون فيه重复 export |

**آلية التنفيذ:**

1. **تحليل الاعتماديات:**
   ```bash
   # استخدام script لفحص imports
   node scripts/analyze-imports.js > import-analysis.txt
   ```

2. **تحديد الملفات غير المستخدمة:**
   - استخدام TypeScript compiler来分析
   - تحقق من كل `export *` إذا كان import فعلي

3. **تنظيف الملفات:**
   - إزالة `export * from './file'` إذا لم يكن هناك import
   - تحويل إلى `export type` للأنواع فقط

**التحديات المحتملة:**
- ⚠️ قد تكون هناك اعتماديات دائرية (circular imports)
- ⚠️ قد يكسر barrel files أخرى

**خطوات التنفيذ:**

```typescript
// Before: index.ts
export * from './hooks';
export * from './types';
export * from './service';

// After: index.ts (إذا كان type-only)
export type { Hook1, Hook2 } from './hooks';
export type { Type1, Type2 } from './types';
```

---

#### 📅 اليوم 8-10: تنفيذ Virtual Scrolling

**التبعيات المطلوب إضافتها:**
```bash
npm install @tanstack/react-virtual
```

**الملفات المستهدفة:**
- [`ProductExcelGrid.tsx`](src/features/inventory/components/ProductExcelGrid.tsx)
- جداول الفواتير في features/sales
- [`AuditItemsTable.tsx`](src/features/inventory/components/audit/AuditItemsTable.tsx)

**آلية التنفيذ:**

1. **تثبيت الحزمة:**
   ```bash
   npm install @tanstack/react-virtual
   ```

2. **إنشاء مكون Virtual Table:**
   ```typescript
   // src/ui/components/VirtualTable.tsx
   import { useVirtualizer } from '@tanstack/react-virtual';
   
   export function VirtualTable<T>({
       data,
       rowHeight = 48,
       overscan = 5,
       renderRow
   }: VirtualTableProps<T>) {
       const parentRef = useRef<HTMLDivElement>(null);
       
       const virtualizer = useVirtualizer({
           count: data.length,
           getScrollElement: () => parentRef.current,
           estimateSize: () => rowHeight,
           overscan
       });
       
       return (
           <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
               <div style={{ height: virtualizer.getTotalSize() }}>
                   {virtualizer.getVirtualItems().map((virtualRow) => (
                       <div
                           key={virtualRow.key}
                           style={{
                               position: 'absolute',
                               top: virtualRow.start,
                               height: virtualRow.size
                           }}
                       >
                           {renderRow(data[virtualRow.index], virtualRow.index)}
                       </div>
                   ))}
               </div>
           </div>
       );
   }
   ```

3. **تطبيق على ProductExcelGrid:**
   - تحديد موقع الجدول الحالي
   - استبدال بـ `VirtualTable`
   - تحديد `rowHeight` مناسب

**التحديات المحتملة:**
- ⚠️ Virtual scrolling يتعارض مع بعض CSS frameworks
- ⚠️ يجب الحفاظ على نفس UX (sorting, filtering)
- ⚠️ قد يؤثر على scroll events

**خطوات التنفيذ:**

```typescript
// 1. تثبيت الحزمة
npm install @tanstack/react-virtual

// 2. تحديث ProductExcelGrid.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

// داخل المكون
const parentRef = useRef<HTMLDivElement>(null);

const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10
});

// JSX
<div ref={parentRef} className="overflow-auto" style={{ height: '600px' }}>
    {/* Render visible rows only */}
</div>
```

---

## ملخص المخاطر والتخفيف

| المخاطرة |Probability |Impact | التخفيف |
|----------|------------|-------|---------|
| فلترة Realtime تؤثر على Sockets | Medium | High | اختبار على staging أولاً |
| إزالة القناة تكسر real-time updates | Low | Critical | التأكد من `useRealtimeSync` يعمل |
| useDebounce يغير السلوك | Low | Medium | مقارنة النتائج قبل/بعد |
| Virtual scrolling يكسر UI | Medium | High | تطبيق تدريجي على component واحد |

---

## معايير القبول

### المهمة 1: فلترة Realtime
- [ ] `TABLE_PRESET_MAP` يعمل كالمتوقع
- [ ] لا توجد excess network traffic
- [ ] تستمر real-time updates

### المهمة 2: إزالة القنوات
- [ ] `useDashboard.ts` لا يحتوي على `supabase.channel`
- [ ] `useProductsPaginated.ts` لا يحتوي على `supabase.channel`
- [ ] dashboard updates تعمل

### المهمة 3: useDebounce
- [ ] البحث يعمل بدون flicker
- [ ] Pagination يعيد reset عند البحث الجديد
- [ ] لا توجد memory leaks

### المهمة 4: Re-exports
- [ ] لا توجد أخطاء TypeScript
- [ ] حجم الحزمة يقل (bundle size)

### المهمة 5: Virtual Scrolling
- [ ] ProductExcelGrid يستخدم virtual scrolling
- [ ] لا توجد visual regression
- [ ] الأداء يتحسن (FPS > 50)

---

## Recommendation: Order of Implementation

```
Week 1:
  Day 1-2: Task 1 ( فلترة Realtime )
  Day 3-4: Task 2 ( إزالة القنوات )
  Day 5:    Task 3 ( useDebounce )

Week 2:
  Day 6-7: Task 4 ( Re-exports )
  Day 8-10: Task 5 ( Virtual Scrolling )
```

**سبب الترتيب:**
1. **Task 1 أولاً:** لأنه foundation ويحسن performance فوراً
2. **Task 2:** لإزالة duplicate real-time subscriptions
3. **Task 3:** يحسن code quality وreduces bundle
4. **Task 4:** cleanup قبل Virtual Scrolling
5. **Task 5:** آخراً لأنه highest risk