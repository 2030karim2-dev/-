# خطة التنفيذ التفصيلية والترحيل التدريجي
## Card System Migration - Implementation Roadmap

**الإصدار:** 3.0  
**تاريخ الإعداد:** مارس 2026  
**مدة التنفيذ:** 10-12 أسبوع  
**الفريق المطلوب:** 2-3 مطورين Frontend

---

## فهرس المحتويات

1. [استراتيجية التوافق الخلفي](#1-استراتيجية-التوافق-الخلفي)
2. [ترتيب الأولويات لإعادة البناء](#2-ترتيب-الأولويات-لإعادة-البناء)
3. [المراحل التنفيذية التفصيلية](#3-المراحل-التنفيذية-التفصيلية)
4. [قائمة الملفات المستهدفة](#4-قائمة-الملفات-المستهدفة)
5. [التعديلات الدقيقة المطلوبة](#5-التعديلات-الدقيقة-المطلوبة)
6. [آلية اختبار الانحدار](#6-آلية-اختبار-الانحدار)
7. [الجدول الزمني والموارد](#7-الجدول-الزمني-والموارد)
8. [إدارة المخاطر والاحتياطات](#8-إدارة-المخاطر-والاحتياطات)

---

## 1. استراتيجية التوافق الخلفي

### 1.1 طريقة الترحيل التدريجي (Incremental Migration)

```
الاستراتيجية: Parallel Implementation with Feature Flags
────────────────────────────────────────────────────────

المرحلة 1: بناء النظام الجديد بجانب القديم
┌─────────────────┐    ┌─────────────────┐
│  Old Card.tsx   │    │  New Card.tsx   │
│   (موجود)       │    │   (جديد)        │
└─────────────────┘    └─────────────────┘
         │                      │
         └──────────┬───────────┘
                    │
            ┌───────▼────────┐
            │ Feature Flag   │
            │ (enableV2Cards)│
            └───────┬────────┘
                    │
         ┌──────────┼──────────┐
         ▼          ▼          ▼
      القديم     الجديد     تلقائي
     (false)    (true)     (auto)
```

### 1.2 نظام Feature Flags

```typescript
// src/config/featureFlags.ts

export const featureFlags = {
  // Card System V2
  enableV2Cards: {
    enabled: process.env.VITE_V2_CARDS === 'true',
    rolloutPercentage: 0, // Start with 0%, increase gradually
    allowedUsers: ['admin', 'beta-testers'],
  },
  
  // Migration stages
  cardMigration: {
    dashboard: process.env.VITE_V2_DASHBOARD === 'true',
    sales: false,
    settings: false,
    inventory: false,
    reports: false,
  },
};

// Hook for checking feature flags
export const useFeatureFlag = (flag: string) => {
  const flags = useFeatureFlagsStore();
  return flags[flag]?.enabled ?? false;
};
```

### 1.3 Wrapper Component للتوافق

```typescript
// src/ui/cards/CardWrapper.tsx
// هذا المكون يسمح باستخدام النظامين معاً

import React from 'react';
import { useFeatureFlag } from '@/config/featureFlags';
import { Card as OldCard } from '@/ui/base/Card';
import { Card as NewCard } from '@/ui/cards/Card';

interface CardWrapperProps {
  children: React.ReactNode;
  v2Props?: Parameters<typeof NewCard>[0];
  v1Props?: Parameters<typeof OldCard>[0];
}

export const CardWrapper: React.FC<CardWrapperProps> = ({
  children,
  v2Props,
  v1Props,
}) => {
  const enableV2 = useFeatureFlag('enableV2Cards');
  
  if (enableV2 && v2Props) {
    return <NewCard {...v2Props}>{children}</NewCard>;
  }
  
  return <OldCard {...v1Props}>{children}</OldCard>;
};

// Usage in existing components
<CardWrapper
  v2Props={{ variant: 'primary', size: 'md', glass: true }}
  v1Props={{ className: 'p-4 rounded-xl' }}
>
  <p>Card content</p>
</CardWrapper>
```

### 1.4 Deprecation Strategy

```typescript
// src/ui/base/Card.tsx (Old Card)

import { deprecateComponent } from '@/utils/deprecation';

export const Card: React.FC<CardProps> = (props) => {
  // Warn developers about deprecation
  deprecateComponent('Card', 'Card from @/ui/cards', '2026-06-01');
  
  // Existing implementation
  return (
    <div className={/* existing styles */}>
      {props.children}
    </div>
  );
};
```

### 1.5 Automated Migration Script

```typescript
// scripts/migrate-cards.ts
// سكريبت لمساعدة المطورين في الترحيل التلقائي

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const migrationRules = [
  {
    pattern: /className="bg-white dark:bg-slate-900 rounded-xl p-4"/g,
    replacement: '<Card size="md" variant="default">',
  },
  {
    pattern: /className="bg-blue-50 dark:bg-blue-900\/20 rounded-xl p-4"/g,
    replacement: '<Card size="md" variant="primary">',
  },
  // Add more rules...
];

export async function migrateCards() {
  const files = await glob('src/**/*.tsx');
  
  for (const file of files) {
    let content = readFileSync(file, 'utf-8');
    let hasChanges = false;
    
    for (const rule of migrationRules) {
      if (rule.pattern.test(content)) {
        content = content.replace(rule.pattern, rule.replacement);
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      writeFileSync(file, content);
      console.log(`✅ Migrated: ${file}`);
    }
  }
}
```

---

## 2. ترتيب الأولويات لإعادة البناء

### 2.1 مصفوفة الأولويات (Priority Matrix)

| المكون | الاستخدام | التأثير | الجهد | الأولوية |
|--------|-----------|---------|-------|----------|
| Card (Base) | 60+ ملف | عالي | متوسط | 🔴 P0 |
| MetricCard | 25+ ملف | عالي | متوسط | 🔴 P0 |
| StatsGrid | 8 ملفات | عالي | عالي | 🔴 P0 |
| ActionCard | 12+ ملف | متوسط | منخفض | 🟠 P1 |
| ChartCard | 15+ ملف | متوسط | متوسط | 🟠 P1 |
| AlertCard | 20+ ملف | متوسط | منخفض | 🟠 P1 |
| DataCard | 10+ ملف | متوسط | متوسط | 🟡 P2 |
| GlassCard | 5 ملفات | منخفض | منخفض | 🟡 P2 |

### 2.2 ترتيب البناء:

```
Phase 0: Foundation (أسبوع 1-2)
├── Card (Base) - P0
├── types.ts
├── constants.ts
└── animations.ts

Phase 1: Core Components (أسبوع 2-3)
├── MetricCard - P0
└── ChartCard - P1

Phase 2: Interactive Components (أسبوع 3-4)
├── ActionCard - P1
└── AlertCard - P1

Phase 3: Specialized Components (أسبوع 4-5)
├── DataCard - P2
└── GlassCard - P2

Phase 4: Migration (أسبوع 6-10)
├── Dashboard Migration
├── Sales Migration
├── Settings Migration
└── Other Pages

Phase 5: Cleanup (أسبوع 11-12)
├── Remove Old Components
├── Update Documentation
└── Final Testing
```

---

## 3. المراحل التنفيذية التفصيلية

### المرحلة 0: الأساس (الأسبوع 1-2)

#### اليوم 1-2: إعداد البنية التحتية
```bash
# إنشاء هيكل الملفات
mkdir -p src/ui/cards
mkdir -p src/ui/cards/__tests__
mkdir -p src/ui/cards/variants
mkdir -p src/hooks

# تثبيت الاعتماديات
npm install framer-motion
npm install -D @testing-library/react
```

#### اليوم 3-4: أنواع البيانات والثوابت
```typescript
// src/ui/cards/types.ts - Implementation
// src/ui/cards/constants.ts - Design Tokens
```

#### اليوم 5-7: نظام Animations
```typescript
// src/ui/cards/animations.ts - Framer Motion variants
```

#### اليوم 8-10: BaseCard Component
```typescript
// src/ui/cards/Card.tsx - Core implementation
// src/ui/cards/__tests__/Card.test.tsx - Unit tests
```

**الاعتماديات:** لا يوجد  
**الموارد:** 1 مطور Senior  
**المخرجات:** BaseCard جاهز للاستخدام

---

### المرحلة 1: المكونات الأساسية (الأسبوع 3-4)

#### اليوم 1-4: MetricCard
```typescript
// Implementation files:
// - src/ui/cards/MetricCard.tsx
// - src/ui/cards/__tests__/MetricCard.test.tsx
// - src/ui/cards/stories/MetricCard.stories.tsx

// Features:
// ✓ Sparkline chart integration
// ✓ Count-up animation
// ✓ Trend indicator
// ✓ Glass effect support
```

#### اليوم 5-7: ChartCard
```typescript
// Implementation files:
// - src/ui/cards/ChartCard.tsx
// - src/ui/cards/__tests__/ChartCard.test.tsx

// Features:
// ✓ Header with time range selector
// ✓ Action button support
// ✓ Legend support
// ✓ Loading state
```

#### اليوم 8-10: ActionCard & AlertCard
```typescript
// Implementation files:
// - src/ui/cards/ActionCard.tsx
// - src/ui/cards/AlertCard.tsx
```

**الاعتماديات:** المرحلة 0  
**الموارد:** 1 مطور Senior + 1 مطور Mid  
**المخرجات:** 4 مكونات جاهزة

---

### المرحلة 2: الترحيل - Dashboard (الأسبوع 5-6)

#### الملفات المستهدفة:

| # | الملف | المكون الجديد | الجهد | المسؤول |
|---|-------|--------------|-------|---------|
| 1 | `StatsGrid.tsx` | MetricCard | عالي | المطور 1 |
| 2 | `StatCard.tsx` | MetricCard | متوسط | المطور 2 |
| 3 | `QuickActions.tsx` | ActionCard | متوسط | المطور 2 |
| 4 | `FinancialHealthScore.tsx` | GlassCard | منخفض | المطور 1 |
| 5 | `InventoryOverview.tsx` | MetricCard | متوسط | المطور 2 |
| 6 | `AISmartNotifications.tsx` | AlertCard | متوسط | المطور 1 |

#### التعديلات الدقيقة:

**قبل (StatsGrid.tsx):**
```tsx
<div className="bg-[var(--app-surface)]/80 backdrop-blur-xl 
                border border-[var(--app-border)] p-5 rounded-3xl
                hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                hover:-translate-y-1">
  <h3 className="text-xl font-black">{value}</h3>
  <div className="absolute -inset-0.5 rounded-3xl blur-[12px] 
                  opacity-0 group-hover:opacity-40" />
</div>
```

**بعد (StatsGrid.tsx):**
```tsx
<MetricCard
  title={item.title}
  value={item.value}
  trend={trend}
  trendValue={trend?.value}
  icon={item.icon}
  color={mapColor(item.colorClass)}
  sparklineData={salesData}
  size="lg"
  elevation="floating"
  glass
  onClick={() => navigate(item.path)}
/>
```

**اختبار الانحدار:**
```typescript
// StatsGrid.regression.test.tsx
describe('StatsGrid Regression Tests', () => {
  it('renders without errors', () => {});
  it('displays correct values', () => {});
  it('handles click events', () => {});
  it('matches visual baseline', () => {});
  it('supports dark mode', () => {});
  it('is responsive', () => {});
});
```

**الاعتماديات:** المرحلة 1  
**الموارد:** 2 مطورين  
**المدة:** 10 أيام  
**المخرجات:** Dashboard مُحدَّث بالكامل

---

### المرحلة 3: الترحيل - Sales (الأسبوع 7-8)

#### الملفات المستهدفة:

| # | الملف | المكون الجديد | الجهد | المسؤول |
|---|-------|--------------|-------|---------|
| 1 | `SalesKPIs.tsx` | MetricCard | عالي | المطور 1 |
| 2 | `InvoiceListView.tsx` | DataCard | عالي | المطور 2 |
| 3 | `SalesStats.tsx` | MetricCard | متوسط | المطور 1 |
| 4 | `SalesAnalytics.tsx` | ChartCard | متوسط | المطور 2 |
| 5 | `TopCustomersList.tsx` | DataCard | متوسط | المطور 1 |
| 6 | `TopProductsList.tsx` | DataCard | متوسط | المطور 2 |

#### التعديلات الدقيقة لـ SalesKPIs:

**التغييرات في Props:**
```typescript
// قبل:
interface SalesKPIsProps {
  totalSales: number;
  netSales: number;
  // ...
}

// بعد:
interface SalesKPIsProps {
  metrics: Array<{
    id: string;
    title: string;
    value: number;
    previousValue?: number;
    trend: 'up' | 'down' | 'neutral';
    trendValue: number;
    icon: LucideIcon;
    color: CardVariant;
    sparklineData?: number[];
  }>;
}
```

**التعديلات في الأنماط:**
```css
/* قبل: */
.bg-gradient-to-br.from-blue-600.to-blue-700 /* mixed with */
.bg-white.dark:bg-slate-900 /* inconsistent */

/* بعد: */
/* Unified through MetricCard variants */
variant="primary" /* gradient blue */
variant="default" /* white/dark */
```

**الاعتماديات:** المرحلة 2  
**الموارد:** 2 مطورين  
**المدة:** 10 أيام

---

### المرحلة 4: الترحيل - Settings (الأسبوع 9)

#### الملفات المستهدفة:

| # | الملف | المكون الجديد | الجهد |
|---|-------|--------------|-------|
| 1 | `SettingSection.tsx` | Card | متوسط |
| 2 | `CompanyProfile.tsx` | Card | منخفض |
| 3 | `SecuritySettings.tsx` | Card + AlertCard | متوسط |
| 4 | `WarehouseManager.tsx` | DataCard | متوسط |
| 5 | `TeamManager.tsx` | DataCard | متوسط |
| 6 | `CurrencyManager.tsx` | Card + DataCard | عالي |

**الاعتماديات:** المرحلة 3  
**الموارد:** 1 مطور  
**المدة:** 5 أيام

---

### المرحلة 5: الترحيل - Inventory & Reports (الأسبوع 10)

#### الملفات المستهدفة:

**Inventory:**
- `WarehousesView.tsx` → DataCard
- `ProductDetail.tsx` → DataCard + GlassCard
- `InventoryAnalyticsView.tsx` → ChartCard + MetricCard

**Reports:**
- `AIInsightsView.tsx` → GlassCard + AlertCard
- `TopProductsTable.tsx` → DataCard
- `InventoryValuationView.tsx` → ChartCard

**الاعتماديات:** المرحلة 4  
**الموارد:** 1 مطور  
**المدة:** 5 أيام

---

### المرحلة 6: الاختبار والتحسين (الأسبوع 11-12)

#### الأسبوع 11: اختبار شامل
- Unit Testing: >90% coverage
- Integration Testing: All flows
- Visual Regression: Chromatic
- Accessibility: axe-core
- Performance: Lighthouse

#### الأسبوع 12: التحسين والتنظيف
- إزالة المكونات القديمة
- تحديث الوثائق
- تدريب الفريق
- نشر النظام الجديد

---

## 4. قائمة الملفات المستهدفة

### 4.1 الملفات التي تحتاج تعديل (80+ ملف)

#### Dashboard (8 ملفات):
```
src/ui/dashboard/
├── StatsGrid.tsx ⭐ HIGH PRIORITY
├── StatCard.tsx ⭐ HIGH PRIORITY
├── ChartBox.tsx
└── SalesChart.tsx

src/features/dashboard/components/
├── FinancialHealthScore.tsx
├── QuickActions.tsx ⭐ HIGH PRIORITY
├── InventoryOverview.tsx
└── AISmartNotifications.tsx
```

#### Sales (12 ملف):
```
src/features/sales/components/
├── Analytics/components/
│   ├── SalesKPIs.tsx ⭐ HIGH PRIORITY
│   ├── SalesTrendChart.tsx
│   ├── TopCustomersList.tsx
│   └── TopProductsList.tsx
├── list/
│   └── InvoiceListView.tsx ⭐ HIGH PRIORITY
├── InvoiceList/
│   └── SalesStats.tsx
└── details/
    └── InvoiceDetailsModal.tsx
```

#### Settings (15 ملف):
```
src/features/settings/components/
├── shared/
│   └── SettingSection.tsx ⭐ MEDIUM PRIORITY
├── CompanyProfile.tsx
├── WarehouseManager.tsx
├── TeamManager.tsx
├── CurrencyManager/
│   ├── index.tsx
│   └── components/
│       ├── CurrencyTable.tsx
│       └── AddCurrencyModal.tsx
└── security/
    ├── SecuritySettings.tsx
    └── PermissionsManager.tsx
```

#### Inventory (10 ملفات):
```
src/features/inventory/components/
├── WarehousesView.tsx
├── product_detail/
│   ├── StatCard.tsx
│   ├── FitmentSection.tsx
│   └── AlternativesSection.tsx
└── ProductCard.tsx
```

#### Reports (8 ملفات):
```
src/features/reports/components/
├── AIInsightsView.tsx
├── InventoryAnalyticsView.tsx
├── SalesForecastCard.tsx
├── StockDepletionAlert.tsx
├── TopProductsTable.tsx
└── InventoryValuationView.tsx
```

### 4.2 الملفات الجديدة (15+ ملف):

```
src/ui/cards/
├── index.ts
├── types.ts
├── constants.ts
├── animations.ts
├── Card.tsx
├── MetricCard.tsx
├── ChartCard.tsx
├── ActionCard.tsx
├── AlertCard.tsx
├── DataCard.tsx
├── GlassCard.tsx
├── FormCard.tsx
├── InfoCard.tsx
├── SkeletonCard.tsx
├── __tests__/
│   ├── Card.test.tsx
│   ├── MetricCard.test.tsx
│   ├── ChartCard.test.tsx
│   └── ActionCard.test.tsx
└── stories/
    ├── Card.stories.tsx
    └── MetricCard.stories.tsx
```

---

## 5. التعديلات الدقيقة المطلوبة

### 5.1 تعديلات الـ Props

#### Card Component Props Migration:

| Prop القديم | Prop الجديد | التحويل | ملاحظات |
|-------------|-------------|---------|---------|
| `className` | `variant` + `size` | Manual | استخدام Design Tokens |
| `noPadding` | `size` | Auto | `size="sm"` = no padding |
| `isMicro` | `size="sm"` | Auto | إعادة تسمية |
| N/A | `elevation` | New | إضافة جديدة |
| N/A | `glass` | New | إضافة جديدة |
| N/A | `interactive` | New | إضافة جديدة |
| N/A | `loading` | New | إضافة جديدة |

#### StatCard → MetricCard Props:

| Prop القديم | Prop الجديد | مثال |
|-------------|-------------|------|
| `title` | `title` | بدون تغيير |
| `value` | `value` | بدون تغيير |
| `subtext` | `subtitle` | إعادة تسمية |
| `icon` | `icon` | بدون تغيير |
| `colorClass` | `color` | `"text-blue-600"` → `"primary"` |
| `iconBgClass` | N/A | يتم حسابه تلقائياً |
| `trend` | `trend` + `trendValue` | تحليل الكائن |

### 5.2 تعديلات الأنماط (CSS)

#### Border Radius Migration Table:

| القيمة القديمة | القيمة الجديدة | الملفات المتأثرة |
|----------------|----------------|------------------|
| `rounded-lg` (8px) | `rounded-xl` (12px) | 15 ملف |
| `rounded-xl` (12px) | `rounded-2xl` (16px) | 30 ملف |
| `rounded-2xl` (16px) | `rounded-2xl` (16px) | 20 ملف |
| `rounded-3xl` (24px) | `rounded-3xl` (24px) | 12 ملف |
| `rounded-none` | `size="sm"` + custom | 3 ملف |

#### Colors Migration Table:

| النمط القديم | النمط الجديد | الملفات |
|--------------|--------------|---------|
| `bg-white dark:bg-slate-900` | `variant="default"` | 45 ملف |
| `bg-blue-50 dark:bg-blue-900/20` | `variant="primary"` | 12 ملف |
| `bg-emerald-50 dark:bg-emerald-900/20` | `variant="success"` | 8 ملف |
| `bg-rose-50 dark:bg-rose-900/20` | `variant="danger"` | 6 ملف |
| `bg-gradient-to-br from-blue-500 to-violet-600` | `variant="gradient"` | 5 ملف |

### 5.3 تعديلات Animations

#### CSS Transitions → Framer Motion:

**قبل:**
```tsx
<div className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
  {content}
</div>
```

**بعد:**
```tsx
import { motion } from 'framer-motion';
import { cardHoverVariants } from '@/ui/cards/animations';

<motion.div
  variants={cardHoverVariants}
  initial="rest"
  whileHover="hover"
  whileTap="tap"
>
  {content}
</motion.div>
```

#### Loading State Animation:

**قبل:**
```tsx
{isLoading && <div className="animate-pulse">Loading...</div>}
```

**بعد:**
```tsx
<Card loading={isLoading}>
  {content}
</Card>
```

---

## 6. آلية اختبار الانحدار

### 6.1 استراتيجية الاختبار

```
Testing Pyramid:
─────────────────
     /\
    /  \     E2E Tests (5%)
   /____\
  /      \   Integration Tests (25%)
 /________\
/          \ Unit Tests (70%)
─────────────
```

### 6.2 Unit Testing

#### Card Component Tests:
```typescript
// src/ui/cards/__tests__/Card.test.tsx

describe('Card Component', () => {
  // Render tests
  it('renders with default props', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  // Variant tests
  it('applies correct variant styles', () => {
    const { container } = render(
      <Card variant="primary">Content</Card>
    );
    expect(container.firstChild).toHaveClass('bg-blue-500/5');
  });

  // Size tests
  it('applies correct size classes', () => {
    const { container } = render(
      <Card size="lg">Content</Card>
    );
    expect(container.firstChild).toHaveClass('p-5');
  });

  // Interactive tests
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Card interactive onClick={handleClick}>Click me</Card>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Loading state
  it('shows loading state', () => {
    render(<Card loading>Content</Card>);
    expect(screen.getByTestId('card-loading')).toBeInTheDocument();
  });

  // Accessibility
  it('has correct ARIA attributes when interactive', () => {
    render(<Card interactive role="button">Click</Card>);
    expect(screen.getByRole('button')).toHaveAttribute('tabIndex', '0');
  });
});
```

### 6.3 Visual Regression Testing

#### Chromatic Configuration:
```typescript
// .storybook/preview.ts

export const parameters = {
  chromatic: {
    disable: false,
    delay: 300, // Wait for animations
    diffThreshold: 0.05, // 5% difference threshold
  },
};
```

#### Storybook Stories:
```typescript
// src/ui/cards/stories/Card.stories.tsx

export default {
  title: 'Cards/Card',
  component: Card,
  parameters: {
    chromatic: { disableSnapshot: false },
  },
};

export const AllVariants = () => (
  <div className="grid grid-cols-3 gap-4">
    <Card variant="default">Default</Card>
    <Card variant="primary">Primary</Card>
    <Card variant="success">Success</Card>
    <Card variant="warning">Warning</Card>
    <Card variant="danger">Danger</Card>
    <Card variant="info">Info</Card>
  </div>
);

export const AllSizes = () => (
  <div className="flex flex-col gap-4">
    <Card size="sm">Small</Card>
    <Card size="md">Medium</Card>
    <Card size="lg">Large</Card>
    <Card size="xl">Extra Large</Card>
  </div>
);
```

### 6.4 Regression Test Suite

```typescript
// scripts/regression-tests.ts

const regressionTests = [
  {
    name: 'Dashboard Stats Rendering',
    component: 'StatsGrid',
    test: async () => {
      // Test that all stats are rendered correctly
    },
  },
  {
    name: 'Card Interactions',
    component: 'Card',
    test: async () => {
      // Test hover, click, focus states
    },
  },
  {
    name: 'Dark Mode Support',
    component: 'All Cards',
    test: async () => {
      // Test that all cards work in dark mode
    },
  },
  {
    name: 'Responsive Behavior',
    component: 'All Cards',
    test: async () => {
      // Test on mobile, tablet, desktop
    },
  },
];

export async function runRegressionTests() {
  for (const test of regressionTests) {
    console.log(`Running: ${test.name}`);
    await test.test();
  }
}
```

### 6.5 CI/CD Integration

```yaml
# .github/workflows/card-migration.yml

name: Card Migration Tests

on:
  pull_request:
    paths:
      - 'src/ui/cards/**'
      - 'src/ui/dashboard/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:cards -- --coverage
      
      - name: Run visual regression
        run: npm run chromatic
      
      - name: Check coverage
        run: |
          if [ $(cat coverage/lcov-report/index.html | grep -oP '(?<=<span class="strong">)[0-9]+' | head -1) -lt 90 ]; then
            echo "Coverage is below 90%"
            exit 1
          fi
```

---

## 7. الجدول الزمني والموارد

### 7.1 الجدول الزمني التفصيلي

| الأسبوع | المرحلة | المهام | الموارد | المخرجات |
|---------|---------|--------|---------|----------|
| 1 | Foundation | types, constants, animations | 1 Senior | Design System |
| 2 | Foundation | BaseCard, testing | 1 Senior | Card.tsx |
| 3 | Core | MetricCard, ChartCard | 2 Devs | 2 Components |
| 4 | Core | ActionCard, AlertCard | 2 Devs | 2 Components |
| 5 | Migration | Dashboard update | 2 Devs | Dashboard v2 |
| 6 | Migration | Dashboard testing | 2 Devs | Tests + Docs |
| 7 | Migration | Sales update | 2 Devs | Sales v2 |
| 8 | Migration | Sales testing | 2 Devs | Tests |
| 9 | Migration | Settings update | 1 Dev | Settings v2 |
| 10 | Migration | Inventory & Reports | 1 Dev | Inventory v2 |
| 11 | Testing | Full regression | 2 Devs | Test Reports |
| 12 | Cleanup | Remove old, docs | 1 Dev | Clean codebase |

### 7.2 توزيع الموارد

#### المطور Senior (50% من الوقت):
- تصميم Architecture
- مراجعة Code Reviews
- حل المشاكل المعقدة
- mentorship

#### المطور Mid (100% من الوقت):
- تنفيذ المكونات
- كتابة Tests
- تحديث الملفات
- Documentation

#### المطور Junior (50% من الوقت):
- تحديث الملفات البسيطة
- كتابة Tests بسيطة
- Documentation

### 7.3 الاعتماديات بين الفرق

```
Dependency Graph:

Foundation (Week 1-2)
    │
    ├───> Core Components (Week 3-4)
    │         │
    │         ├───> Dashboard Migration (Week 5-6)
    │         │
    │         ├───> Sales Migration (Week 7-8)
    │         │       │
    │         │       └───> Settings Migration (Week 9)
    │         │
    │         └───> Inventory Migration (Week 10)
    │
    └───> Testing & Cleanup (Week 11-12)
```

---

## 8. إدارة المخاطر والاحتياطات

### 8.1 تحليل المخاطر

| المخاطر | الاحتمال | التأثير | الاستراتيجية |
|---------|----------|---------|--------------|
| Breaking Changes | متوسط | عالي | Feature Flags + Parallel Running |
| Performance Degradation | منخفض | عالي | Benchmarking قبل وبعد |
| Browser Compatibility | منخفض | متوسط | Testing على multiple browsers |
| Developer Resistance | متوسط | متوسط | تدريب + Documentation |
| Delay in Timeline | متوسط | متوسط | Buffer time في الجدول |

### 8.2 خطة الطوارئ

#### إذا حدث Breaking Change:
1. التراجع الفوري (Rollback)
2. تفعيل Feature Flag القديم
3. إصلاح المشكلة
4. إعادة النشر

#### إذا تأخر المشروع:
1. تقليل نطاق المرحلة الحالية
2. ترحيل أقل مكونات
3. نقل الباقي للمرحلة التالية

### 8.3 Backup Strategy

```bash
# Create backup branches
git checkout -b backup/cards-before-migration

# Tag before major changes
git tag -a v1.0-cards -m "Before card migration"

# Keep old components until cleanup phase
# src/ui/base/Card.tsx → keep until Week 12
```

---

## الخلاصة

هذه الخطة توفر:
- ✅ استراتيجية توافق خلفي واضحة (Feature Flags)
- ✅ 12 أسبوع جدول زمني مفصل
- ✅ 80+ ملف مستهدف محدد
- ✅ آلية اختبار انحدار شاملة
- ✅ إدارة مخاطر محددة

**نقطة البدء:** إنشاء Branch جديد `feature/card-system-v2`  
**نقطة النهاية:** دمج الكود بعد اكتمال المرحلة 12

---

**نهاية الوثيقة**
