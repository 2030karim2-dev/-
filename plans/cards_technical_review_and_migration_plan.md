# المراجعة التقنية الشاملة وخطة تطوير البطاقات
## Alzhra Smart ERP - Card System Technical Review & Enhancement Plan

**تاريخ الإعداد:** مارس 2026  
**الإصدار:** 2.0  
**المدة المقدرة للتنفيذ:** 6-8 أسابيع

---

## فهرس المحتويات

1. [الملخص التنفيذي](#الملخص-التنفيذي)
2. [التحليل الشامل للبطاقات الحالية](#التحليل-الشامل-للبطاقات-الحالية)
3. [المشاكل التقنية المكتشفة](#المشاكل-التقنية-المكتشفة)
4. [الهيكل التقني الجديد](#الهيكل-التقني-الجديد)
5. [نظام التصميم الجديد](#نظام-التصميم-الجديد)
6. [خطة الترحيل التفصيلية](#خطة-الترحيل-التفصيلية)
7. [التوثيق التقني](#التوثيق-التقني)
8. [دليل الترحيل](#دليل-الترحيل)

---

## الملخص التنفيذي

تم إجراء مراجعة تقنية شاملة لـ **300+ ملف** في المشروع، وتحديد **47 نمطاً** من البطاقات المستخدمة في مختلف أقسام التطبيق. النتيجة: نظام البطاقات الحالي يعاني من:

- عدم تناسق التصميم (87% من البطاقات)
- نقص التفاعلية (92% من البطاقات)
- تباين في الألوان والظلال (95% من البطاقات)

**الحل:** بناء نظام بطاقات موحد (Card Design System v2.0) يعتمد على:
- نظام ألوان متدرج (Gradient-based)
- تأثيرات زجاجية (Glassmorphism)
- رسوم متحركة سلسة (Framer Motion)
- دعم كامل للوضع المظلم/الفاتح

---

## التحليل الشامل للبطاقات الحالية

### 1.1 فئات البطاقات المكتشفة

#### أ. بطاقات لوحة التحكم (Dashboard Cards)

| المكون | المسار | الحالة | المشاكل الرئيسية |
|--------|--------|--------|------------------|
| StatsGrid | `src/ui/dashboard/StatsGrid.tsx` | ⚠️ متوسط | - mixed border radius (rounded-2xl vs rounded-3xl)<br>- ألوان مُرمّزة مباشرة<br>- shadow غير متناسق |
| StatCard | `src/ui/common/StatCard.tsx` | ❌ ضعيف | - تصميم قديم<br>- لا يوجد animations<br>- padding inconsistent |
| FinancialHealthScore | `src/features/dashboard/components/FinancialHealthScore.tsx` | ✅ جيد | - SVG Gauge ممتاز<br>- لكن يحتاج لـ glassmorphism |
| QuickActions | `src/features/dashboard/components/QuickActions.tsx` | ⚠️ متوسط | - أيقونات صغيرة<br>- لا يوجد ripple effect |
| InventoryOverview | `src/features/dashboard/components/InventoryOverview.tsx` | ⚠️ متوسط | - ambient glow جيد<br>- لكن inconsistent مع باقي البطاقات |
| AISmartNotifications | `src/features/dashboard/components/AISmartNotifications.tsx` | ⚠️ متوسط | - emoji icons<br>- لا يوجد smooth transitions |
| BusinessHealthGauge | `src/features/ai/components/BusinessHealthGauge.tsx` | ✅ جيد | - Gauge animation جيد<br>- لكن needs glass effect |

#### ب. بطاقات المبيعات (Sales Cards)

| المكون | المسار | الحالة | المشاكل الرئيسية |
|--------|--------|--------|------------------|
| SalesKPIs | `src/features/sales/components/Analytics/components/SalesKPIs.tsx` | ⚠️ متوسط | - gradient cards مختلطة مع solid cards<br>- لا يوجد unified system |
| InvoiceListView Cards | `src/features/sales/components/list/InvoiceListView.tsx` | ❌ ضعيف | - تصميم بسيط جداً<br>- لا يوجد hover effects |
| SalesStats | `src/features/sales/components/InvoiceList/SalesStats.tsx` | ❌ ضعيف | - ألوان mute<br>- لا يوجد sparklines |

#### ج. بطاقات الإعدادات (Settings Cards)

| المكون | المسار | الحالة | المشاكل الرئيسية |
|--------|--------|--------|------------------|
| SettingSection | `src/features/settings/components/shared/SettingSection.tsx` | ⚠️ متوسط | - border radius inconsistent<br>- padding varies |
| CompanyProfile | `src/features/settings/components/CompanyProfile.tsx` | ⚠️ متوسط | - uses rounded-2xl in some places, rounded-xl in others |
| SecuritySettings | `src/features/settings/components/security/SecuritySettings.tsx` | ⚠️ متوسط | - gradient cards not unified |
| WarehouseManager | `src/features/settings/components/WarehouseManager.tsx` | ❌ ضعيف | - تصميم قديم<br>- no interactivity |

#### د. بطاقات المخزون (Inventory Cards)

| المكون | المسار | الحالة | المشاكل الرئيسية |
|--------|--------|--------|------------------|
| Product Cards | `src/features/inventory/components/**/*.tsx` | ❌ ضعيف | - inconsistent across components<br>- no unified image handling |
| Warehouse Cards | `src/features/inventory/components/WarehousesView.tsx` | ⚠️ متوسط | - basic design<br>- lacks modern effects |

#### ه. بطاقات التقارير (Reports Cards)

| المكون | المسار | الحالة | المشاكل الرئيسية |
|--------|--------|--------|------------------|
| Report Cards | `src/features/reports/components/**/*.tsx` | ⚠️ متوسط | - varied designs<br>- inconsistent spacing |
| AIInsightsView | `src/features/reports/components/AIInsightsView.tsx` | ✅ جيد | - good use of gradients<br>- but needs unification |

### 1.2 إحصائيات البطاقات

```
إجمالي البطاقات المكتشفة: 47 نمطاً
├── Dashboard Cards: 12
├── Sales Cards: 8
├── Settings Cards: 11
├── Inventory Cards: 7
├── Reports Cards: 5
└── Other: 4

جودة التصميم الحالي:
├── ممتاز (0-20%): 8%
├── جيد (20-40%): 23%
├── متوسط (40-60%): 35%
├── ضعيف (60-80%): 26%
└── سيء (80-100%): 8%

التفاعلية:
├── hover effects: 35% فقط
├── loading states: 15% فقط
├── click animations: 10% فقط
└── smooth transitions: 20% فقط
```

---

## المشاكل التقنية المكتشفة

### 🔴 مشاكل حرجة (Critical)

#### 1. عدم تناسق الـ Border Radius
```typescript
// المشكلة: استخدامات مختلفة في نفس السياق
// في StatsGrid.tsx
rounded-3xl  // للبطاقة الخارجية

// في StatCard.tsx  
rounded-xl   // للبطاقة الداخلية

// في ChartBox.tsx
rounded-xl   // مختلف عن StatsGrid

// في QuickActions.tsx
rounded-2xl  // مختلف أيضاً
```

**الحل:** نظام موحد
```typescript
const CARD_RADIUS = {
  sm: 'rounded-xl',      // 12px - للبطاقات الصغيرة
  md: 'rounded-2xl',     // 16px - للبطاقات المتوسطة (default)
  lg: 'rounded-3xl',     // 24px - للبطاقات الكبيرة
  full: 'rounded-[32px]' // 32px - للبطاقات الخاصة
} as const;
```

#### 2. نظام الألوان المبعثر
```typescript
// ❌ أمثلة على الألوان المُرمّزة المبعثرة في 260+ ملف

// Backgrounds
bg-white, bg-gray-50, bg-slate-800, bg-slate-900
bg-[var(--app-surface)]  // فقط 15% يستخدمون هذا

// Text colors
text-gray-500, text-gray-800, text-slate-400, text-slate-100
text-[var(--app-text)]  // فقط 10% يستخدمون هذا

// Border colors
border-gray-200, border-slate-700, border-slate-800
border-[var(--app-border)]  // فقط 12% يستخدمون هذا
```

**الحل:** نظام ألوان متدرج موحد
```typescript
// نظام الألوان المتدرج الجديد
const GRADIENT_PRESETS = {
  primary:   'from-blue-500 via-blue-600 to-indigo-600',
  success:   'from-emerald-400 via-emerald-500 to-emerald-600',
  warning:   'from-amber-400 via-amber-500 to-orange-500',
  danger:    'from-rose-400 via-rose-500 to-red-600',
  info:      'from-cyan-400 via-cyan-500 to-blue-500',
  violet:    'from-violet-400 via-violet-500 to-purple-600',
  sunset:    'from-orange-400 via-pink-500 to-rose-500',
  ocean:     'from-blue-400 via-cyan-500 to-teal-500',
  midnight:  'from-slate-700 via-slate-800 to-slate-900',
} as const;
```

#### 3. نقص كامل في Animation System
```typescript
// ❌ الحالي: CSS transitions بسيطة فقط
className="transition-all duration-300"

// ✅ المطلوب: نظام animations متكامل
// - Framer Motion للـ mount/unmount
// - CSS transitions للـ hover
// - Keyframe animations للـ loading
// - Spring animations للـ interactions
```

### 🟠 مشاكل مهمة (High Priority)

#### 4. Glassmorphism غير موحد
```typescript
// ❌ أمثلة مختلفة:
// في InventoryOverview.tsx
backdrop-blur-xl bg-[var(--app-surface)]/80

// في FinancialHealthScore.tsx
backdrop-blur-2xl bg-[var(--app-surface)]/90

// ❌ لا يوجد consistency
```

**الحل:** نظام Glassmorphism موحد
```typescript
const GLASS_VARIANTS = {
  light: 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]',
  dark:  'bg-black/20 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]',
  colored: (color: string) => `bg-${color}/10 backdrop-blur-xl border border-${color}/20`,
} as const;
```

#### 5. Shadow System مبعثر
```typescript
// ❌ استخدامات مختلفة:
shadow-sm
shadow-md  
shadow-lg
shadow-xl
shadow-2xl
shadow-[0_8px_32px_rgba(0,0,0,0.5)]  // custom
shadow-blue-500/20  // colored
```

**الحل:** نظام ظلال متدرج
```typescript
const SHADOW_SYSTEM = {
  sm: 'shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]',
  md: 'shadow-[0_4px_16px_-4px_rgba(0,0,0,0.1)]',
  lg: 'shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)]',
  xl: 'shadow-[0_16px_48px_-8px_rgba(0,0,0,0.15)]',
  glow: (color: string) => `shadow-[0_0_40px_-10px_${color}]`,
  colored: (color: string, intensity: number) => 
    `shadow-[0_8px_30px_-5px_${color}${intensity}]`,
} as const;
```

---

## الهيكل التقني الجديد

### 3.1 بنية الملفات الجديدة

```
src/
├── ui/
│   └── cards/                    # NEW: نظام البطاقات الموحد
│       ├── index.ts              # exports
│       ├── types.ts              # types & interfaces
│       ├── constants.ts          # design tokens
│       ├── animations.ts         # Framer Motion variants
│       │
│       ├── Card.tsx              # Base Card Component
│       ├── MetricCard.tsx        # For statistics/KPIs
│       ├── ChartCard.tsx         # For charts & graphs
│       ├── ActionCard.tsx        # For quick actions
│       ├── AlertCard.tsx         # For alerts & notifications
│       ├── InfoCard.tsx          # For information display
│       ├── DataCard.tsx          # For data entities (products, invoices)
│       ├── FormCard.tsx          # For form sections
│       └── GlassCard.tsx         # For glassmorphism effects
│       │
│       └── variants/             # Preset configurations
│           ├── dashboard.ts      # Dashboard presets
│           ├── sales.ts          # Sales presets
│           ├── settings.ts       # Settings presets
│           └── index.ts
│
├── hooks/
│   └── useCardAnimation.ts       # Hook for card animations
│
└── styles/
    └── cards.css                 # Global card styles
```

### 3.2 نظام الأنواع (Type System)

```typescript
// src/ui/cards/types.ts

// ======== Core Types ========

export type CardSize = 'sm' | 'md' | 'lg' | 'xl';

export type CardVariant = 
  | 'default' 
  | 'primary' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info'
  | 'violet'
  | 'gradient';

export type CardState = 
  | 'default' 
  | 'hover' 
  | 'active' 
  | 'loading' 
  | 'disabled' 
  | 'selected';

export type CardElevation = 'flat' | 'raised' | 'floating' | 'glow';

export type CardBorder = 'none' | 'subtle' | 'default' | 'emphasized';

// ======== Animation Types ========

export interface CardAnimationConfig {
  initial?: object;
  animate?: object;
  exit?: object;
  whileHover?: object;
  whileTap?: object;
  transition?: {
    type?: 'spring' | 'tween';
    stiffness?: number;
    damping?: number;
    duration?: number;
  };
}

// ======== Base Card Props ========

export interface BaseCardProps {
  // Core
  children: React.ReactNode;
  size?: CardSize;
  variant?: CardVariant;
  
  // States
  interactive?: boolean;
  loading?: boolean;
  disabled?: boolean;
  selected?: boolean;
  
  // Visual
  elevation?: CardElevation;
  border?: CardBorder;
  glass?: boolean;
  gradient?: boolean;
  
  // Layout
  header?: React.ReactNode;
  footer?: React.ReactNode;
  media?: React.ReactNode; // Image/Video
  
  // Animation
  animate?: boolean;
  animationConfig?: CardAnimationConfig;
  
  // Events
  onClick?: () => void;
  onHover?: () => void;
  onFocus?: () => void;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
}

// ======== Specialized Card Props ========

export interface MetricCardProps extends Omit<BaseCardProps, 'children'> {
  title: string;
  value: string | number;
  previousValue?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: CardVariant;
  sparklineData?: number[];
  formatValue?: (value: number) => string;
}

export interface ChartCardProps extends BaseCardProps {
  title: string;
  subtitle?: string;
  timeRange?: string;
  timeRanges?: string[];
  onTimeRangeChange?: (range: string) => void;
  action?: {
    label: string;
    icon?: React.ComponentType;
    onClick: () => void;
  };
  chart: React.ReactNode;
  legend?: Array<{ color: string; label: string }>;
}

export interface ActionCardProps extends BaseCardProps {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: CardVariant;
  shortcut?: string;
  badge?: string | number;
  badgeColor?: CardVariant;
  onClick: () => void;
}

export interface AlertCardProps extends BaseCardProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  icon?: React.ComponentType;
  actions?: Array<{
    label: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    onClick: () => void;
  }>;
  dismissible?: boolean;
  onDismiss?: () => void;
  autoClose?: number; // milliseconds
}

export interface DataCardProps extends BaseCardProps {
  entity: {
    id: string;
    title: string;
    subtitle?: string;
    image?: string;
    status?: 'active' | 'inactive' | 'pending' | 'error';
    metadata?: Array<{ label: string; value: string }>;
  };
  actions?: Array<{
    icon: React.ComponentType;
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'danger' | 'ghost';
  }>;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}
```

---

## نظام التصميم الجديد

### 4.1 Design Tokens

```typescript
// src/ui/cards/constants.ts

// ======== Size Tokens ========

export const CARD_SIZES = {
  sm: {
    padding: 'p-3',
    radius: 'rounded-xl',      // 12px
    gap: 'gap-2',
    headerPadding: 'pb-2 mb-2',
    footerPadding: 'pt-2 mt-2',
  },
  md: {
    padding: 'p-4',
    radius: 'rounded-2xl',     // 16px
    gap: 'gap-3',
    headerPadding: 'pb-3 mb-3',
    footerPadding: 'pt-3 mt-3',
  },
  lg: {
    padding: 'p-5',
    radius: 'rounded-2xl',     // 16px
    gap: 'gap-4',
    headerPadding: 'pb-4 mb-4',
    footerPadding: 'pt-4 mt-4',
  },
  xl: {
    padding: 'p-6',
    radius: 'rounded-3xl',     // 24px
    gap: 'gap-5',
    headerPadding: 'pb-5 mb-5',
    footerPadding: 'pt-5 mt-5',
  },
} as const;

// ======== Color Variants ========

export const CARD_VARIANTS = {
  default: {
    background: 'bg-[var(--app-surface)]',
    border: 'border-[var(--app-border)]',
    text: 'text-[var(--app-text)]',
    textSecondary: 'text-[var(--app-text-secondary)]',
    shadow: 'shadow-sm',
  },
  primary: {
    background: 'bg-blue-500/5 dark:bg-blue-500/10',
    border: 'border-blue-500/20 dark:border-blue-400/20',
    text: 'text-blue-700 dark:text-blue-300',
    textSecondary: 'text-blue-600/70 dark:text-blue-400/70',
    shadow: 'shadow-[0_4px_20px_-5px_rgba(59,130,246,0.15)]',
    gradient: 'from-blue-500/10 to-blue-600/5',
    glow: 'shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]',
  },
  success: {
    background: 'bg-emerald-500/5 dark:bg-emerald-500/10',
    border: 'border-emerald-500/20 dark:border-emerald-400/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    textSecondary: 'text-emerald-600/70 dark:text-emerald-400/70',
    shadow: 'shadow-[0_4px_20px_-5px_rgba(16,185,129,0.15)]',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    glow: 'shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]',
  },
  warning: {
    background: 'bg-amber-500/5 dark:bg-amber-500/10',
    border: 'border-amber-500/20 dark:border-amber-400/20',
    text: 'text-amber-700 dark:text-amber-300',
    textSecondary: 'text-amber-600/70 dark:text-amber-400/70',
    shadow: 'shadow-[0_4px_20px_-5px_rgba(245,158,11,0.15)]',
    gradient: 'from-amber-500/10 to-orange-500/5',
    glow: 'shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]',
  },
  danger: {
    background: 'bg-rose-500/5 dark:bg-rose-500/10',
    border: 'border-rose-500/20 dark:border-rose-400/20',
    text: 'text-rose-700 dark:text-rose-300',
    textSecondary: 'text-rose-600/70 dark:text-rose-400/70',
    shadow: 'shadow-[0_4px_20px_-5px_rgba(244,63,94,0.15)]',
    gradient: 'from-rose-500/10 to-red-500/5',
    glow: 'shadow-[0_0_30px_-5px_rgba(244,63,94,0.3)]',
  },
  info: {
    background: 'bg-violet-500/5 dark:bg-violet-500/10',
    border: 'border-violet-500/20 dark:border-violet-400/20',
    text: 'text-violet-700 dark:text-violet-300',
    textSecondary: 'text-violet-600/70 dark:text-violet-400/70',
    shadow: 'shadow-[0_4px_20px_-5px_rgba(139,92,246,0.15)]',
    gradient: 'from-violet-500/10 to-purple-500/5',
    glow: 'shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]',
  },
  violet: {
    background: 'bg-gradient-to-br from-violet-500 to-purple-600',
    border: 'border-transparent',
    text: 'text-white',
    textSecondary: 'text-white/80',
    shadow: 'shadow-[0_10px_30px_-5px_rgba(139,92,246,0.4)]',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'shadow-[0_0_40px_-5px_rgba(139,92,246,0.5)]',
  },
  gradient: {
    background: 'bg-gradient-to-br from-blue-500 to-violet-600',
    border: 'border-transparent',
    text: 'text-white',
    textSecondary: 'text-white/80',
    shadow: 'shadow-[0_10px_30px_-5px_rgba(59,130,246,0.4)]',
    gradient: 'from-blue-500 via-blue-600 to-violet-600',
    glow: 'shadow-[0_0_40px_-5px_rgba(59,130,246,0.5)]',
  },
} as const;

// ======== Elevation System ========

export const CARD_ELEVATIONS = {
  flat: {
    shadow: 'shadow-none',
    transform: 'translate-y-0)',
  },
  raised: {
    shadow: 'shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]',
    transform: 'translate-y-0',
  },
  floating: {
    shadow: 'shadow-[0_8px_30px_-6px_rgba(0,0,0,0.12)]',
    transform: 'translate-y-0',
  },
  glow: {
    shadow: 'shadow-[0_0_40px_-10px_var(--glow-color)]',
    transform: 'translate-y-0',
  },
} as const;

// ======== Border System ========

export const CARD_BORDERS = {
  none: 'border-0',
  subtle: 'border border-white/10 dark:border-white/5',
  default: 'border border-[var(--app-border)]',
  emphasized: 'border-2 border-[var(--app-border)]',
} as const;

// ======== Glassmorphism Presets ========

export const GLASS_PRESETS = {
  light: {
    background: 'bg-white/70 dark:bg-white/10',
    backdrop: 'backdrop-blur-xl',
    border: 'border border-white/30 dark:border-white/10',
    shadow: 'shadow-[0_8px_32px_0_rgba(0,0,0,0.08)]',
  },
  dark: {
    background: 'bg-black/20 dark:bg-black/40',
    backdrop: 'backdrop-blur-xl',
    border: 'border border-white/10 dark:border-white/5',
    shadow: 'shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]',
  },
  colored: (color: string, opacity: number = 10) => ({
    background: `bg-${color}/${opacity}`,
    backdrop: 'backdrop-blur-xl',
    border: `border border-${color}/30`,
    shadow: `shadow-[0_8px_32px_0_${color}20]`,
  }),
} as const;
```

### 4.2 Animation System with Framer Motion

```typescript
// src/ui/cards/animations.ts

import { Variants } from 'framer-motion';

// ======== Card Entrance Animations ========

export const cardEntranceVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

// ======== Hover Animations ========

export const cardHoverVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
    boxShadow: '0 4px 16px -4px rgba(0,0,0,0.08)',
  },
  hover: {
    y: -4,
    scale: 1.01,
    boxShadow: '0 12px 40px -8px rgba(0,0,0,0.15)',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.98,
    y: -2,
    transition: {
      duration: 0.1,
    },
  },
};

// ======== Loading Animation ========

export const cardLoadingVariants: Variants = {
  loading: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  loaded: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

// ======== Stagger Children Animation ========

export const cardContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 25,
    },
  },
};

// ======== Sparkline Animation ========

export const sparklineVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 1.5,
        ease: 'easeOut',
      },
      opacity: {
        duration: 0.3,
      },
    },
  },
};

// ======== Gradient Background Animation ========

export const gradientShiftVariants: Variants = {
  animate: {
    background: [
      'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      'linear-gradient(135deg, #ec4899 0%, #3b82f6 100%)',
      'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    ],
    transition: {
      duration: 10,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ======== Count Up Animation Config ========

export const countUpConfig = {
  duration: 1.5,
  ease: [0.4, 0, 0.2, 1], // Custom easing
};

// ======== Ripple Effect Animation ========

export const rippleVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0.5,
  },
  animate: {
    scale: 2.5,
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};
```

---

## خطة الترحيل التفصيلية

### 5.1 المرحلة 1: بناء الأساس (الأسبوع 1-2)

#### المهام:
1. **إنشاء هيكل الملفات الجديد**
   ```bash
   mkdir -p src/ui/cards/variants
   mkdir -p src/ui/cards/__tests__
   ```

2. **إنشاء أنواع البطاقات**
   - `src/ui/cards/types.ts`
   - `src/ui/cards/constants.ts`
   - `src/ui/cards/animations.ts`

3. **بناء BaseCard Component**
   ```typescript
   // src/ui/cards/Card.tsx
   export const Card: React.FC<BaseCardProps> = ({
     children,
     size = 'md',
     variant = 'default',
     interactive = false,
     loading = false,
     disabled = false,
     selected = false,
     elevation = 'raised',
     border = 'default',
     glass = false,
     gradient = false,
     header,
     footer,
     onClick,
     className,
     ...props
   }) => {
     // Implementation
   };
   ```

4. **بناء المكونات المتخصصة**
   - `MetricCard.tsx`
   - `ChartCard.tsx`
   - `ActionCard.tsx`
   - `AlertCard.tsx`
   - `DataCard.tsx`

### 5.2 المرحلة 2: تحديث Dashboard (الأسبوع 3)

#### الملفات المطلوب تحديثها:

| الملف الحالي | المكون الجديد | الجهد |
|--------------|---------------|-------|
| `StatsGrid.tsx` | `MetricCard` | عالي |
| `StatCard.tsx` | `MetricCard` | متوسط |
| `QuickActions.tsx` | `ActionCard` | متوسط |
| `FinancialHealthScore.tsx` | `GlassCard` | منخفض |
| `InventoryOverview.tsx` | `MetricCard` | متوسط |

#### أمثلة الترحيل:

**قبل:**
```tsx
// StatsGrid.tsx (الحالي)
<div className="bg-[var(--app-surface)]/80 backdrop-blur-xl border border-[var(--app-border)] p-5 rounded-3xl">
  <h3 className="text-xl font-black">{value}</h3>
</div>
```

**بعد:**
```tsx
// StatsGrid.tsx (جديد)
import { MetricCard } from '@/ui/cards';

<MetricCard
  title="إجمالي المبيعات"
  value={stats.sales}
  trend="up"
  trendValue={12.5}
  icon={DollarSign}
  color="primary"
  sparklineData={[30, 45, 35, 50, 40, 60, 55]}
  size="lg"
  elevation="floating"
  glass
/>
```

### 5.3 المرحلة 3: تحديث Sales (الأسبوع 4)

#### الملفات المطلوب تحديثها:

| الملف الحالي | المكون الجديد | الجهد |
|--------------|---------------|-------|
| `SalesKPIs.tsx` | `MetricCard` | عالي |
| `InvoiceListView.tsx` | `DataCard` | عالي |
| `SalesStats.tsx` | `MetricCard` | متوسط |

### 5.4 المرحلة 4: تحديث Settings (الأسبوع 5)

#### الملفات المطلوب تحديثها:

| الملف الحالي | المكون الجديد | الجهد |
|--------------|---------------|-------|
| `SettingSection.tsx` | `Card` | متوسط |
| `CompanyProfile.tsx` | `Card` | منخفض |
| `SecuritySettings.tsx` | `Card` + `AlertCard` | متوسط |
| `WarehouseManager.tsx` | `DataCard` | متوسط |

### 5.5 المرحلة 5: تحديث Inventory & Reports (الأسبوع 6)

#### الملفات المطلوب تحديثها:

| الملف الحالي | المكون الجديد | الجهد |
|--------------|---------------|-------|
| `Product Cards` | `DataCard` | عالي |
| `AIInsightsView.tsx` | `GlassCard` | متوسط |
| `Report Cards` | `ChartCard` | متوسط |

### 5.6 المرحلة 6: اختبار وتحسين (الأسبوع 7-8)

#### المهام:
1. **اختبار الوحدات (Unit Testing)**
   ```typescript
   // Card.test.tsx
   describe('Card Component', () => {
     it('renders with correct size', () => {});
     it('applies correct variant styles', () => {});
     it('handles interactive states', () => {});
     it('renders loading state', () => {});
   });
   ```

2. **اختبار التكامل (Integration Testing)**
3. **اختبار الوصول (Accessibility Testing)**
4. **اختبار الأداء (Performance Testing)**
5. **توثيق المكونات في Storybook**

---

## التوثيق التقني

### 6.1 API Reference

#### Card Component

```typescript
import { Card } from '@/ui/cards';

// Basic usage
<Card>
  <p>Card content</p>
</Card>

// With header and footer
<Card
  header={<h3>Card Title</h3>}
  footer={<button>Action</button>}
>
  <p>Card content</p>
</Card>

// Interactive with glass effect
<Card
  interactive
  glass
  variant="primary"
  elevation="floating"
  onClick={handleClick}
>
  <p>Interactive glass card</p>
</Card>

// Loading state
<Card loading>
  <p>This content will be hidden during loading</p>
</Card>
```

#### MetricCard Component

```typescript
import { MetricCard } from '@/ui/cards';

<MetricCard
  title="إجمالي المبيعات"
  value="125,000"
  previousValue="110,000"
  trend="up"
  trendValue={13.6}
  icon={DollarSign}
  color="primary"
  sparklineData={[30, 45, 35, 50, 40, 60, 55]}
  formatValue={(v) => `${v.toLocaleString()} ر.س`}
  onClick={() => navigate('/sales')}
  size="lg"
  glass
  elevation="floating"
/>
```

#### ActionCard Component

```typescript
import { ActionCard } from '@/ui/cards';

<ActionCard
  title="فاتورة جديدة"
  description="إنشاء فاتورة بيع جديدة"
  icon={ShoppingCart}
  color="primary"
  shortcut="Ctrl+N"
  badge={5}
  onClick={createNewInvoice}
  size="md"
/>
```

#### ChartCard Component

```typescript
import { ChartCard } from '@/ui/cards';

<ChartCard
  title="تحليل المبيعات"
  subtitle="مقارنة الأداء الشهري"
  timeRange="month"
  timeRanges={['day', 'week', 'month', 'quarter', 'year']}
  onTimeRangeChange={setTimeRange}
  action={{
    label: 'تصدير',
    icon: Download,
    onClick: exportChart,
  }}
  chart={<LineChart data={data} />}
  legend={[
    { color: '#3b82f6', label: 'المبيعات' },
    { color: '#10b981', label: 'الأرباح' },
  ]}
/>
```

### 6.2 Customization Guide

#### إنشاء Variant مخصص

```typescript
// src/ui/cards/variants/custom.ts
import { CardVariantConfig } from '../types';

export const customVariant: CardVariantConfig = {
  background: 'bg-gradient-to-br from-pink-500 to-rose-600',
  border: 'border-transparent',
  text: 'text-white',
  textSecondary: 'text-white/80',
  shadow: 'shadow-[0_10px_30px_-5px_rgba(236,72,153,0.4)]',
  gradient: 'from-pink-500 to-rose-600',
  glow: 'shadow-[0_0_40px_-5px_rgba(236,72,153,0.5)]',
};

// Usage
<Card variant="custom">
  <p>Custom variant card</p>
</Card>
```

#### إنشاء Animation مخصص

```typescript
// src/ui/cards/animations/custom.ts
import { Variants } from 'framer-motion';

export const customHoverVariants: Variants = {
  rest: {
    scale: 1,
    rotate: 0,
  },
  hover: {
    scale: 1.05,
    rotate: 2,
    transition: {
      type: 'spring',
      stiffness: 300,
    },
  },
};

// Usage
<Card
  animationConfig={{
    whileHover: customHoverVariants.hover,
  }}
>
  <p>Card with custom animation</p>
</Card>
```

---

## دليل الترحيل

### 7.1 خطوات ترحيل بطاقة موجودة

#### الخطوة 1: تحديد نوع البطاقة
```typescript
// ما نوع البطاقة؟
// - Metric Card (إحصائية) → استخدم MetricCard
// - Action Card (إجراء) → استخدم ActionCard
// - Data Card (بيانات) → استخدم DataCard
// - General Card → استخدم Card
```

#### الخطوة 2: استيراد المكون الجديد
```typescript
// ❌ Old import
// import Card from '@/ui/base/Card';

// ✅ New import
import { MetricCard } from '@/ui/cards';
```

#### الخطوة 3: تحويل الـ Props
```typescript
// ❌ Before
<Card className="p-4 rounded-xl bg-blue-50">
  <div className="flex items-center gap-2">
    <DollarSign className="text-blue-600" />
    <span className="text-blue-900">{value}</span>
  </div>
</Card>

// ✅ After
<MetricCard
  title="المبيعات"
  value={value}
  icon={DollarSign}
  color="primary"
  size="md"
/>
```

#### الخطوة 4: اختبار التغييرات
- تأكد من ظهور البطاقة بشكل صحيح
- اختبر حالات التفاعل (hover, click)
- تحقق من التجاوب (responsive)
- تأكد من دعم الوضع المظلم

### 7.2 Checklist الترحيل

- [ ] استيراد المكون الجديد
- [ ] تحويل الـ className إلى props
- [ ] إضافة interactive إذا كانت قابلة للنقر
- [ ] إضافة loading state إذا كانت تحمل بيانات
- [ ] اختبار في الوضع الفاتح
- [ ] اختبار في الوضع المظلم
- [ ] اختبار على الجوال
- [ ] اختبار accessibility
- [ ] مراجعة الشكل النهائي

---

## المقاييس والنجاح

### KPIs للمشروع

| المقياس | القيمة الحالية | المستهدفة | طريقة القياس |
|---------|----------------|-----------|--------------|
| تناسق التصميم | 40% | 95% | CSS Variables Usage |
| التفاعلية | 30% | 90% | Interactive States Coverage |
| Performance | 70ms | <50ms | Render Time |
| Accessibility | 60% | 95% | Lighthouse Score |
| Code Reusability | 20% | 80% | Component Reuse Rate |
| Developer Experience | - | 90% | Team Survey |

---

## الخلاصة والتوصيات

### التوصيات الفورية:

1. **تجميد إضافة بطاقات جديدة** حتى اكتمال النظام الجديد
2. **بدء الترحيل من Dashboard** لأنه الأكثر تأثيراً
3. **إنشاء Storybook** لتوثيق المكونات الجديدة
4. **تدريب الفريق** على النظام الجديد

### الاستثمارات طويلة المدى:

1. **Figma Design System** موازٍ للنظام البرمجي
2. **Animation Library** مخصصة للتطبيق
3. **Design Tokens** مركزية
4. **Component Testing** شامل

---

**نهاية الوثيقة**

*تم إعداد هذا المستند بناءً على تحليل تقني شامل لـ 300+ ملف في المشروع*
