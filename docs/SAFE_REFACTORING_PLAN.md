# خطة إعادة الهيكلة الآمنة - Al-Zahra Smart ERP

## 🛡️ مبادئ السلامة الأساسية

### قبل البدء:
1. **إنشاء فرع جديد** لكل ملف يتم تعديله
2. **تشغيل الاختبارات** قبل وبعد كل تغيير
3. **الاحتفاظ بالملف الأصلي** كنسخة احتياطية
4. **التغيير التدريجي** - ملف واحد في كل مرة

---

## 📋 المرحلة الأولى: الملفات الحرجة

### 1. إعادة هيكلة `SalesAnalyticsView.tsx`

#### الخطوة 1: إنشاء الملفات الجديدة (بدون حذف الأصلي)

```bash
# إنشاء الهيكل الجديد
src/features/sales/components/Analytics/
├── SalesAnalyticsView.tsx (الأصلي - يبقى كما هو)
├── components/
│   ├── SalesKPIs.tsx          # جديد
│   ├── SalesTrendChart.tsx    # جديد
│   ├── PaymentMethodsChart.tsx # جديد
│   ├── TopProductsList.tsx    # جديد
│   └── TopCustomersList.tsx   # جديد
└── hooks/
    └── useSalesChartData.ts   # جديد
```

#### الخطوة 2: استخراج المكونات تدريجياً

**أولاً: استخراج بطاقات KPI**

```typescript
// src/features/sales/components/Analytics/components/SalesKPIs.tsx
import React from 'react';
import { TrendingUp, Receipt, DollarSign, BarChart3, ArrowUpRight } from 'lucide-react';

interface SalesKPIsProps {
    totalSales: number;
    netSales: number;
    invoiceCount: number;
    averageInvoiceValue: number;
    salesGrowth: number;
    periodLabel: string;
    isLoading: boolean;
    formatCurrency: (value: number) => string;
    formatNumber: (value: number) => string;
}

export const SalesKPIs: React.FC<SalesKPIsProps> = ({
    totalSales, netSales, invoiceCount, averageInvoiceValue,
    salesGrowth, periodLabel, isLoading, formatCurrency, formatNumber
}) => {
    // نقل كود KPI cards من الملف الأصلي
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI cards content */}
        </div>
    );
};
```

**ثانياً: تحديث الملف الأصلي لاستخدام المكون الجديد**

```typescript
// في SalesAnalyticsView.tsx الأصلي
import { SalesKPIs } from './components/SalesKPIs';

// استبدال كود KPI بـ:
<SalesKPIs
    totalSales={totalSales}
    netSales={netSales}
    invoiceCount={invoiceCount}
    averageInvoiceValue={averageInvoiceValue}
    salesGrowth={salesGrowth}
    periodLabel={periodLabels[period]}
    isLoading={isLoading}
    formatCurrency={formatCurrency}
    formatNumber={formatNumber}
/>
```

**ثالثاً: اختبار التطبيق**
```bash
npm run dev
# التحقق من أن صفحة التحليلات تعمل بشكل صحيح
```

#### الخطوة 3: تكرار العملية لباقي المكونات

---

### 2. إعادة هيكلة `settingsStore.ts`

#### الخطوة 1: إنشاء ملفات الأنواع

```typescript
// src/features/settings/types/invoiceSettings.ts
export interface InvoiceSettings {
    invoice_prefix: string;
    invoice_start_number: number;
    // ... باقي الخصائص
}

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
    invoice_prefix: 'INV-',
    invoice_start_number: 1,
    // ... باقي القيم
};
```

#### الخطوة 2: إنشاء ملف الأنواع الموحد

```typescript
// src/features/settings/types/index.ts
export * from './invoiceSettings';
export * from './inventorySettings';
export * from './paymentSettings';
export * from './posSettings';
export * from './printSettings';
export * from './integrationSettings';
export * from './localizationSettings';
```

#### الخطوة 3: تحديث المخزن لاستخدام الأنواع المستخرجة

```typescript
// src/features/settings/settingsStore.ts
import {
    InvoiceSettings,
    InventorySettings,
    // ... باقي الأنواع
    DEFAULT_INVOICE_SETTINGS,
    DEFAULT_INVENTORY_SETTINGS,
    // ... باقي القيم الافتراضية
} from './types';
```

---

### 3. نقل الترجمات من `i18nStore.ts`

#### الخطوة 1: إنشاء ملفات JSON

```json
// src/lib/locales/ar.json
{
    "app_title": "الزهراء Smart ERP",
    "loading": "جاري التحميل...",
    // ... باقي الترجمات
}
```

```json
// src/lib/locales/en.json
{
    "app_title": "Al-Zahra Smart ERP",
    "loading": "Loading...",
    // ... باقي الترجمات
}
```

#### الخطوة 2: تحديث المخزن

```typescript
// src/lib/i18nStore.ts
import ar from './locales/ar.json';
import en from './locales/en.json';

const dictionaries = { ar, en };

// باقي المنطق
```

---

### 4. تقسيم `inventory/service.ts`

#### الخطوة 1: إنشاء الخدمات المنفصلة

```typescript
// src/features/inventory/services/productService.ts
export const productService = {
    getProducts: async (companyId: string) => { /* ... */ },
    createProduct: async (data: any, companyId: string) => { /* ... */ },
    updateProduct: async (id: string, data: any) => { /* ... */ },
    deleteProduct: async (id: string) => { /* ... */ },
};
```

```typescript
// src/features/inventory/services/warehouseService.ts
export const warehouseService = {
    getWarehouses: async (companyId: string) => { /* ... */ },
    getProductsForWarehouse: async (companyId: string, warehouseId: string) => { /* ... */ },
};
```

#### الخطوة 2: إنشاء ملف التصدير الموحد

```typescript
// src/features/inventory/services/index.ts
export { productService } from './productService';
export { warehouseService } from './warehouseService';
export { transferService } from './transferService';
export { auditService } from './auditService';
export { categoryService } from './categoryService';

// خدمة موحدة للتوافق مع الكود الحالي
import { productService } from './productService';
import { warehouseService } from './warehouseService';
// ...

export const inventoryService = {
    ...productService,
    ...warehouseService,
    // ...
};
```

---

## 📋 المرحلة الثانية: الملفات الكبيرة

### 5. إعادة هيكلة `ExcelTable.tsx`

#### الخطوة 1: استخراج الـ Hooks

```typescript
// src/ui/common/ExcelTable/hooks/useTableSort.ts
export const useTableSort = <T,>(data: T[]) => {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    
    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a: any, b: any) => {
            // منطق الفرز
        });
    }, [data, sortConfig]);
    
    return { sortedData, sortConfig, handleSort: setSortConfig };
};
```

```typescript
// src/ui/common/ExcelTable/hooks/useColumnResize.ts
export const useColumnResize = () => {
    const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});
    // ... منطق تغيير حجم الأعمدة
    return { columnWidths, handleResize };
};
```

#### الخطوة 2: استخراج المكونات

```typescript
// src/ui/common/ExcelTable/components/TableHeader.tsx
export const TableHeader = <T,>({ columns, sortConfig, onSort }: TableHeaderProps<T>) => {
    return (
        <thead>
            {/* محتوى الرأس */}
        </thead>
    );
};
```

---

## 📋 المرحلة الثالثة: التنظيف

### 6. حذف الملفات الفارغة

#### الخطوة 1: تحديد الملفات الفارغة الآمنة للحذف

```bash
# الملفات التي يمكن حذفها بأمان (لم يتم استيرادها):
- src/components/Dashboard.tsx
- src/components/Header.tsx
- src/components/Layout.tsx
- src/components/Sidebar.tsx
- src/components/StatCard.tsx
```

#### الخطوة 2: التحقق من عدم وجود استيرادات

```bash
# البحث عن الاستيرادات
grep -r "from './components/Dashboard'" src/
grep -r "from './components/Header'" src/
# ... إلخ
```

---

## 🔄 استراتيجية الترحيل الآمن

### نمط Extract and Delegate

```
┌─────────────────────────────────────────────────────────────┐
│                    الملف الأصلي                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  الكود الأصلي (يبقى حتى اكتمال الترحيل)              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    الملفات الجديدة                           │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│  │ Component │  │ Component │  │   Hook    │              │
│  │     A     │  │     B     │  │           │              │
│  └───────────┘  └───────────┘  └───────────┘              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              الملف الأصلي بعد الترحيل                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  import { ComponentA } from './components/A';       │   │
│  │  import { ComponentB } from './components/B';       │   │
│  │  import { useHook } from './hooks/useHook';         │   │
│  │                                                      │   │
│  │  // الملف أصبح مجرد منسق (orchestrator)              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ قائمة التحقق لكل ملف

### قبل البدء:
- [ ] إنشاء فرع Git جديد
- [ ] تشغيل `npm run dev` والتأكد من عمل التطبيق
- [ ] تشغيل `npm test` (إذا وجدت اختبارات)

### أثناء التعديل:
- [ ] إنشاء الملفات الجديدة أولاً
- [ ] نقل الكود بالكامل مع الحفاظ على الوظائف
- [ ] تحديث الاستيرادات في الملف الأصلي
- [ ] اختبار كل تغيير على حدة

### بعد الانتهاء:
- [ ] تشغيل `npm run dev` والتأكد من عمل التطبيق
- [ ] اختبار الصفحة المتأثرة يدوياً
- [ ] تشغيل `npm run build` للتأكد من عدم وجود أخطاء
- [ ] حذف الكود المكرر (اختياري - يمكن تأجيله)

---

## 📅 الجدول الزمني المقترح

| الأسبوع | المهمة | الملفات |
|---------|--------|---------|
| 1 | استخراج المكونات | SalesAnalyticsView.tsx |
| 2 | استخراج الأنواع | settingsStore.ts |
| 3 | نقل الترجمات | i18nStore.ts |
| 4 | تقسيم الخدمات | inventory/service.ts |
| 5 | استخراج Hooks | ExcelTable.tsx |
| 6 | تقسيم الصفحات | ExpensesPage.tsx, BackupPage.tsx |
| 7 | تقسيم المودالات | PurchaseDetailsModal.tsx |
| 8 | التنظيف النهائي | حذف الملفات الفارغة |

---

## 🚨 تحذيرات هامة

### لا تفعل:
1. ❌ لا تحذف الملف الأصلي حتى تتأكد من عمل النسخة الجديدة
2. ❌ لا تغير أكثر من ملف واحد في نفس الوقت
3. ❌ لا تنسَ تحديث الاستيرادات في الملفات الأخرى
4. ❌ لا تتجاوز الاختبارات

### افعل دائماً:
1. ✅ اختبر التطبيق بعد كل تغيير
2. ✅ احتفظ بنسخة احتياطية
3. ✅ استخدم Git branches
4. �️ راجع التغييرات قبل الدمج

---

## 📝 أوامر Git المقترحة

```bash
# إنشاء فرع جديد لكل مهمة
git checkout -b refactor/sales-analytics-view

# بعد الانتهاء من التعديلات
git add .
git commit -m "refactor: extract SalesKPIs component from SalesAnalyticsView"

# الدمج بعد التأكد من العمل
git checkout main
git merge refactor/sales-analytics-view
```

---

*تم إنشاء هذه الخطة لضمان سلامة التطبيق أثناء عملية إعادة الهيكلة*
