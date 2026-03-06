# خطة الإصلاح الشاملة لـ Alzhra Smart ERP

## الملخص

هذه الخطة تُحدد الإصلاحات المطلوبة بناءً على تقارير الفحص الشامل. تم تقسيم الإصلاحات إلى **3 مراحل رئيسية** مع تحديد الأولويات.

---

## المرحلة 1: الإصلاحات الحرجة (أسبوعان)

### 1.1 إصلاح Atomic Transactions

#### المشكلة:
```typescript
// ❌ الحالي: rollback يدوي
const response1 = await supabase.from('journal_entries').insert(...);
if (error) {
  await supabase.from('journal_entries').delete().eq('id', journalData.id); // Rollback
}
```

#### الحل:
إنشاء RPC موحد لجميع العمليات المحاسبية:

```sql
-- في Supabase
CREATE OR REPLACE FUNCTION create_atomic_journal_entry(
  p_company_id UUID,
  p_user_id UUID,
  p_date DATE,
  p_description TEXT,
  p_lines JSONB,
  p_reference_type TEXT DEFAULT 'manual'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_journal_id UUID;
BEGIN
  -- إنشاء القيد
  INSERT INTO journal_entries (company_id, entry_date, description, status, created_by, reference_type)
  VALUES (p_company_id, p_date, p_description, 'posted', p_user_id, p_reference_type)
  RETURNING id INTO v_journal_id;
  
  -- إدخال الأسطر (atomic)
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_amount, credit_amount, description)
  SELECT 
    v_journal_id,
    (line->>'account_id')::UUID,
    (line->>'debit')::NUMERIC,
    (line->>'credit')::NUMERIC,
    COALESCE(line->>'description', p_description)
  FROM jsonb_array_elements(p_lines) AS line;
  
  RETURN v_journal_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;
```

#### الملفات المتأثرة:
- `src/features/accounting/api/journalsApi.ts`
- `src/features/accounting/services/journalService.ts`

---

### 1.2 إصلاح معالجة التزامن (Concurrency)

#### المشكلة:
لا يوجد معالجة للتداخل عند تعديل نفس البيانات.

#### الحل:
إضافة optimistic locking:

```typescript
// إنشاء hook جديد
export const useOptimisticLock = <T>(initialVersion: number) => {
  const [version, setVersion] = useState(initialVersion);
  
  const incrementVersion = () => setVersion(v => v + 1);
  
  const checkVersion = (currentVersion: number) => {
    if (currentVersion !== version) {
      throw new Error("تم تعديل البيانات من مستخدم آخر. يرجى إعادة المحاولة.");
    }
  };
  
  return { version, incrementVersion, checkVersion };
};
```

#### الملفات:
- `src/core/hooks/useOptimisticLock.ts` (جديد)

---

### 1.3 إصلاح نظام الحواف (Border Radius)

#### المشكلة:
```typescript
// Button.tsx - حادة
rounded-none

// Card.tsx - مستديرة  
rounded-xl

// Badge.tsx - كاملة
rounded-full
```

#### الحل:

**1. تحديث Button.tsx:**
```typescript
// قبل
const variants = {
  primary: "... rounded-none ...",
  // ...
};

// بعد
const variants = {
  primary: "... rounded-lg ...",  // يتوافق مع Card
  // ...
};
```

**2. إنشاء System Components:**
```typescript
// src/ui/base/SystemCard.tsx (جديد)
export const SystemCard: React.FC<CardProps> = ({ className, children, ...props }) => (
  <div 
    className={cn(
      "bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl p-4",
      className
    )}
    {...props}
  >
    {children}
  </div>
);
```

---

## المرحلة 2: تحسين التصميم (3 أسابيع)

### 2.1 استبدال الألوان المُرمّزة

#### الأداة المساعدة (Script):
```javascript
// scripts/fix-colors.mjs
// استبدال جميع الألوان المُرمّزة بـ CSS variables

const replacements = [
  { from: 'bg-white dark:bg-slate-900', to: 'bg-[var(--app-surface)]' },
  { from: 'bg-gray-50', to: 'bg-[var(--app-surface-hover)]' },
  { from: 'text-gray-800', to: 'text-[var(--app-text)]' },
  { from: 'text-gray-500', to: 'text-[var(--app-text-secondary)]' },
  { from: 'border-gray-100', to: 'border-[var(--app-border)]' },
];

// تشغيل الاستبدال على جميع ملفات .tsx
```

#### الأولوية:
1. UI Base Components (Button, Card, Input, Modal)
2. Layout Components (Header, Sidebar)
3. Dashboard Components
4. Feature Components

### 2.2 توحيد الخطوط

```typescript
// src/ui/base/Button.tsx - قبل
const sizes = {
  sm: "px-2 py-1 text-[9px] gap-1",   // صغير جداً
  md: "px-4 py-2 text-[10px] gap-2",  // صغير جداً
  lg: "px-6 py-3 text-xs gap-3",       // صغير
};

// بعد - توحيد الأحجام
const sizes = {
  sm: "px-3 py-1.5 text-xs gap-1.5",   // 12px
  md: "px-4 py-2 text-sm gap-2",       // 14px
  lg: "px-6 py-3 text-base gap-3",      // 16px
};
```

### 2.3 إنشاء Design System

```typescript
// src/ui/design-system/tokens.ts
export const designTokens = {
  colors: {
    background: 'var(--app-bg)',
    surface: 'var(--app-surface)',
    border: 'var(--app-border)',
    text: 'var(--app-text)',
    textSecondary: 'var(--app-text-secondary)',
    accent: 'var(--accent)',
  },
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
  typography: {
    fontSize: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
    },
  },
};
```

---

## المرحلة 3: تحسين الكود (4 أسابيع)

### 3.1 توحيد المصطلحات

#### إنشاء Glossary:
```typescript
// src/core/naming-conventions.ts

// قاعدة: تسمية الجداول
export const TABLE_NAMES = {
  parties: 'parties',
  invoices: 'invoices',
  products: 'products',
  accounts: 'accounts',
  journalEntries: 'journal_entries',
} as const;

// قاعدة: الحقول
export const FIELD_MAPPINGS = {
  // camelCase -> snake_case
  productId: 'product_id',
  invoiceNumber: 'invoice_number',
  createdAt: 'created_at',
  companyId: 'company_id',
} as const;

// قاعدة: المصطلحات المحاسبية
export const ACCOUNTING_TERMS = {
  debit: 'debit_amount',
  credit: 'credit_amount',
  balance: 'balance',
  posted: 'posted',
  draft: 'draft',
  void: 'void',
} as const;
```

### 3.2 إنشاء Service Factory

```typescript
// src/core/service-factory.ts

class ServiceFactory {
  private static instance: ServiceFactory;
  
  private services = new Map<string, any>();
  
  static getInstance() {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }
  
  register<T>(name: string, service: T) {
    this.services.set(name, service);
  }
  
  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`الخدمة ${name} غير مسجلة`);
    }
    return service;
  }
}

// الاستخدام
const factory = ServiceFactory.getInstance();
const salesService = factory.get('sales');
```

### 3.3 إنشاء Base Hook موحد

```typescript
// src/core/hooks/useBaseService.ts

interface UseServiceOptions<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
}

export const useBaseService = <T>(options: UseServiceOptions<T>) => {
  const { user } = useAuthStore();
  const companyId = user?.company_id;
  
  return useQuery({
    queryKey: [companyId, ...options.queryKey],
    queryFn: () => companyId ? options.queryFn() : Promise.resolve(null),
    enabled: options.enabled !== false && !!companyId,
    staleTime: options.staleTime || 60000,
  });
};
```

---

## المرحلة 4: الأتمتة (أسبوعان)

### 4.1 إضافة Workflow Engine

```typescript
// src/core/workflows/types.ts

interface WorkflowStep {
  id: string;
  name: string;
  execute: (context: WorkflowContext) => Promise<void>;
  rollback?: (context: WorkflowContext) => Promise<void>;
}

interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  transactionType: 'atomic' | 'compensating';
}

// مثال: عملية البيع
const saleWorkflow: Workflow = {
  id: 'sale-process',
  name: 'عملية البيع',
  transactionType: 'atomic',
  steps: [
    {
      id: 'validate-stock',
      name: 'تحقق من المخزون',
      execute: async (ctx) => { /* ... */ },
    },
    {
      id: 'create-invoice',
      name: 'إنشاء الفاتورة',
      execute: async (ctx) => { /* ... */ },
    },
    {
      id: 'create-journal',
      name: 'إنشاء القيد',
      execute: async (ctx) => { /* ... */ },
    },
    {
      id: 'update-stock',
      name: 'تحديث المخزون',
      execute: async (ctx) => { /* ... */ },
    },
  ],
};
```

### 4.2 توسيع أوامر AI

```typescript
// src/features/ai/extended-actions.ts

const EXTENDED_AI_ACTIONS = {
  // المخزون
  'stock_count': 'جرد المخزون',
  'stock_transfer': 'تحويل بين المستودعات',
  'low_stock_alert': 'تنبيه المخزون المنخفض',
  
  // المحاسبة
  'reconcile_accounts': 'مطابقة الحسابات',
  'generate_report': 'إنشاء تقرير',
  'close_period': 'إغلاق فترة محاسبية',
  
  // المبيعات
  'bulk_invoice': 'إنشاء فواتير متعددة',
  'discount_calculator': 'حاسبة الخصم',
};
```

---

## جدول التنفيذ

| المرحلة | الإصلاحات | المدة | الأولوية |
|--------|----------|-------|---------|
| 1 | Atomic Transactions + Concurrency + Border Radius | أسبوعان | قصوى |
| 2 | Design System + Colors + Typography | 3 أسابيع | عالية |
| 3 | Terminology + Service Factory + Base Hook | 4 أسابيع | متوسطة |
| 4 | Workflow Engine + AI Expansion | أسبوعان | منخفضة |

---

## ملخص المهام

```markdown
## المهام الحرجة (الأسبوع 1-2)

- [ ] 1.1 إنشاء RPC للقيود atomic
- [ ] 1.2 تحديث journalsApi.ts  
- [ ] 1.3 إنشاء useOptimisticLock hook
- [ ] 1.4 إصلاح Button border-radius
- [ ] 1.5 إنشاء SystemCard component

## المهام العالية (الأسبوع 3-5)

- [ ] 2.1 تشغيل script استبدال الألوان
- [ ] 2.2 تحديث UI Base Components
- [ ] 2.3 تحديث Layout Components
- [ ] 2.4 توحيد أحجام الخطوط
- [ ] 2.5 إنشاء design-tokens.ts

## المهام المتوسطة (الأسبوع 6-9)

- [ ] 3.1 إنشاء naming-conventions.ts
- [ ] 3.2 تحديث نوع Types
- [ ] 3.3 إنشاء Service Factory
- [ ] 3.4 إنشاء Base Hook
- [ ] 3.5 توحيد رسائل الخطأ

## المهام المنخفضة (الأسبوع 10-11)

- [ ] 4.1 إنشاء Workflow Engine
- [ ] 4.2 إضافة workflow للمبيعات
- [ ] 4.3 إضافة workflow للمشتريات
- [ ] 4.4 توسيع أوامر AI
```

---

## المخاطر والتخفيف

| المخاطرة | التأثير | التخفيف |
|---------|--------|---------|
| كسر الوظائف الحالية | عالي | اختباراتhaustive قبل النشر |
| تأثير على الأداء | متوسط | تحسين تدريجي |
| مقاومة الفريق | متوسط | توثيق واضح |

---

*نهاية خطة الإصلاح*
