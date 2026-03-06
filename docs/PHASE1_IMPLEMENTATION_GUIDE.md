# دليل تنفيذ المرحلة الأولى - خطة التحسين
## Phase 1 Implementation Guide

**تاريخ التنفيذ:** 1 مارس 2026  
**الحالة:** قيد التنفيذ (تم إعداد البنية التحتية)

---

## ✅ ما تم إنجازه

### 1. CI/CD Pipeline (GitHub Actions)

**الملف:** [`.github/workflows/quality-gate.yml`](.github/workflows/quality-gate.yml)

#### المهام المُنشأة:
- ✅ **Type Check & Lint**: فحص TypeScript + ESLint
- ✅ **Security Scan**: فحص الأمان باستخدام `npm audit` و TruffleHog
- ✅ **Unit Tests**: تشغيل اختبارات Vitest
- ✅ **Build Test**: بناء المشروع + تحليل الحزم
- ✅ **Quality Report**: توليد تقارير الجودة

#### كيفية الاستخدام:
```bash
# Push أو PR سيفعل الـ Pipeline تلقائياً
# لمشاهدة النتائج:
git push origin main

# ثم انتقل إلى GitHub → Actions
```

---

### 2. ESLint Configuration

**الملف:** [`eslint.config.js`](eslint.config.js)

#### القواعد المُضافة:
```javascript
// منع استخدام console.log
'no-console': ['error', { allow: ['info', 'warn', 'error'] }]

// منع استخدام any
'@typescript-eslint/no-explicit-any': 'error'

// قيود التعقيد
'complexity': ['error', { max: 10 }]
'max-lines-per-function': ['error', { max: 50 }]

// قواعد الأمان
'security/detect-object-injection': 'error'
'security/detect-eval-with-expression': 'error'
```

#### كيفية الاستخدام:
```bash
# فحص المشروع
npm run lint

# إصلاح الأخطاء تلقائياً
npm run lint:fix
```

---

### 3. Pre-commit Hooks (Husky)

**الملف:** [`.husky/pre-commit`](.husky/pre-commit)

#### ما يحدث قبل كل Commit:
1. تشغيل ESLint على الملفات المُعدلة
2. تشغيل Type Check (Strict)
3. فحص وجود console.log

#### كيفية الاستخدام:
```bash
# الهوكس تشتغل تلقائياً عند git commit
# لاختبارها:
git add .
git commit -m "test: checking pre-commit hooks"

# لتخطي الهوكس في حالات الطوارئ:
git commit -m "message" --no-verify
```

---

### 4. Testing Infrastructure (Vitest + Testing Library)

**الملفات:**
- [`vitest.config.ts`](vitest.config.ts) - إعداد Vitest
- [`src/test/setup.ts`](src/test/setup.ts) - إعدادات الاختبار
- [`src/core/utils/currencyUtils.test.ts`](src/core/utils/currencyUtils.test.ts) - مثال على اختبار

#### الأوامر المتاحة:
```bash
# تشغيل الاختبارات
npm test

# تشغيل الاختبارات مع Coverage
npm run coverage

# تشغيل الاختبارات في وضع UI
npm run test:ui

# تشغيل الاختبارات في CI
npm run test:ci
```

#### مثال على كتابة اختبار:
```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './currencyUtils';

describe('currencyUtils', () => {
  it('should format SAR with symbol', () => {
    const result = formatCurrency(1234.56, 'SAR');
    expect(result).toContain('1,234.56');
    expect(result).toContain('ر.س');
  });
});
```

---

### 5. E2E Testing (Playwright)

**الملفات:**
- [`playwright.config.ts`](playwright.config.ts) - إعداد Playwright
- [`e2e/auth.spec.ts`](e2e/auth.spec.ts) - مثال على اختبار E2E

#### الأوامر المتاحة:
```bash
# تشغيل اختبارات E2E
npm run test:e2e

# تشغيل في وضع UI
npm run test:e2e:ui

# تشغيل على متصفح محدد
npx playwright test --project=chromium
```

#### المتصفحات المدعومة:
- Chromium (Chrome)
- Firefox
- WebKit (Safari)
- Mobile Chrome
- Mobile Safari

---

### 6. Quality Dashboard Script

**الملف:** [`scripts/quality-report.ts`](scripts/quality-report.ts)

#### ما يقيسه:
- عدد استخدامات `any`
- عدد `console.log`
- عدد ملفات الاختبار
- عدد الثغرات الأمنية
- عدد TODO comments

#### كيفية الاستخدام:
```bash
# توليد تقرير الجودة
npm run quality:report

# النتائج تحفظ في:
# - reports/quality-metrics.json
# - reports/quality-summary.md
```

---

### 7. Prettier Configuration

**الملف:** [`.prettierrc`](.prettierrc)

#### الإعدادات:
```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

#### كيفية الاستخدام:
```bash
# تنسيق جميع الملفات
npx prettier --write .

# التحقق من التنسيق
npx prettier --check .
```

---

## 📦 تحديثات package.json

### الـ Scripts المُضافة:
```json
{
  "build:analyze": "npm run build && npx vite-bundle-visualizer",
  "lint:fix": "eslint . --fix",
  "test": "vitest",
  "test:ci": "vitest run --coverage",
  "test:ui": "vitest --ui",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "coverage": "vitest run --coverage",
  "quality:report": "tsx scripts/quality-report.ts",
  "prepare": "husky"
}
```

### الـ DevDependencies المُضافة:
```bash
# ESLint & TypeScript
@eslint/js
typescript-eslint
eslint-plugin-react-hooks
eslint-plugin-react-refresh
eslint-plugin-security

# Testing
@vitest/coverage-v8
@vitest/ui
@testing-library/react
@testing-library/jest-dom
@testing-library/user-event
jsdom

# E2E Testing
@playwright/test

# Code Quality
husky
lint-staged
prettier
vite-bundle-visualizer
```

---

## 🚀 الخطوات التالية لإكمال المرحلة الأولى

### الخطوة 1: تثبيت Dependencies
```bash
npm install
```

### الخطوة 2: إعداد Husky
```bash
# Husky سيُعد نفسه تلقائياً عبر `npm run prepare`
# أو يدوياً:
npx husky init
```

### الخطوة 3: اختبار CI/CD Pipeline
```bash
# ارفع الكود لـ GitHub

# Push لـ branch

git push origin main

# انتقل إلى GitHub → Actions لمشاهدة النتائج
```

### الخطوة 4: إزالة console.log (مهمة تدريجية)
```bash
# البحث عن console.log
grep -r "console\.log" --include="*.ts" --include="*.tsx" src/

# استبدالها بـ logger
# مثال:
# console.log('debug info') → logger.debug('debug info')
```

### الخطوة 5: زيادة Test Coverage
```bash
# ابدأ بكتابة اختبارات للـ Core Utilities
# مثال موجود في: src/core/utils/currencyUtils.test.ts

# شغل الاختبارات
npm test

# شاهد Coverage Report
npm run coverage
```

---

## 📊 مؤشرات نجاح المرحلة الأولى

| المؤشر | الحالي | الهدف | الحالة |
|--------|--------|-------|--------|
| CI/CD Pipeline | ❌ | ✅ | ✅ تم |
| ESLint Rules | ❌ | ✅ | ✅ تم |
| Pre-commit Hooks | ❌ | ✅ | ✅ تم |
| Testing Framework | ❌ | ✅ | ✅ تم |
| E2E Testing | ❌ | ✅ | ✅ تم |
| console.log | 88 | 0 | ⏳ قيد العمل |
| Test Coverage | <5% | 30% | ⏳ قيد العمل |

---

## 🎯 الهدف النهائي للمرحلة الأولى

```
الحالة الحالية: 7.2/10
            ↓
بعد المرحلة الأولى: 8.0/10
```

**المدة المتوقعة لإكمال المرحلة:** 3 أشهر  
**المدة المتبقية بعد إعداد البنية التحتية:** 2.5 شهر

---

## 📞 دعم

للأسئلة أو المشاكل:
1. راجع [الخطة الاستراتيجية](plans/STRATEGIC_QUALITY_IMPROVEMENT_PLAN.md)
2. افتح Issue في GitHub
3. تواصل مع فريق الهندسة

---

**تم إعداد هذا الدليل بواسطة:** نظام التحسين التلقائي  
**التاريخ:** 1 مارس 2026
