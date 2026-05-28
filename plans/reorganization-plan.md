# مشروع إعادة هيكلة المشروع - خطة شاملة

## 1. الملخص التنفيذي

يحتوي هذا المشروع على مجموعة واسعة من الملفات والمكونات التي تحتاج إلى تنظيف وإعادة هيكلة. بعد التحليل الشامل، تم تحديد عدة فئات من المشاكل:

- **ملفات ميتة/غير مستخدمة**: 30+ ملف
- **مكونات مكررة**: 7+ مجموعات
- **ملفات ضخمة ومعقدة**: تحتاج تقسيم
- **مجلدات legacy كاملة**: يمكن حذفها
- **ملفات seed في الإنتاج**: يجب إزالتها

---

## 2. الملفات المراد حذفها

### 2.1 مجلد Scripts/Legacy (10 ملفات)

```
scripts/legacy/
├── check_duplicates.cjs      # قديم
├── check_fks.cjs             # قديم
├── check_types.cjs           # قديم
├── cleanup_legacy.sh         # قديم
├── cleanup.sh                # قديم
├── extract_types.cjs         # قديم
├── extract_types.py          # قديم
├── sizes.py                  # قديم
├── test_gemini.js            # قديم
└── test_rls.js               # قديم
```

**الحجم الإجمالي**: ~9,500 حرف
**الإجراء**: حذف المجلد بالكامل

### 2.2 ملفات AI deprecated (14 ملف)

في `src/features/ai/`:

| الملف | الحجم | السبب |
|-------|-------|-------|
| `aiActions.ts` | 296 | deprecated - الوظيفة في core/ |
| `aiProvider.ts` | 271 | deprecated - الوظيفة في core/provider.ts |
| `chatService.ts` | 261 | deprecated - الوظيفة في chat/chatService.ts |
| `documentService.ts` | 206 | deprecated |
| `hooks.ts` | 312 | deprecated |
| `memoryService.ts` | 747 | deprecated |
| `posService.ts` | 132 | deprecated |
| `productLookupService.ts` | 307 | deprecated - الوظيفة في product-lookup/ |
| `service.ts` | 1,816 | deprecated |
| `store.ts` | 170 | deprecated - الوظيفة في chat/store.ts |
| `strictPrompts.ts` | 197 | deprecated - الوظيفة في core/prompts.ts |
| `types.ts` | 174 | deprecated - الوظيفة في core/types.ts |
| `useAIChat.ts` | 170 | deprecated - الوظيفة في chat/useAIChat.ts |
| `useSpeechRecognition.ts` | 203 | deprecated - الوظيفة في chat/useSpeechRecognition.ts |
| `vehicleKnowledge.ts` | 116 | deprecated |

**الحجم الإجمالي**: ~5,400 حرف
**الإجراء**: حذف الملفات الـ 14

### 2.3 ملفات Dashboard الميتة

```
src/features/dashboard/components/CategoriesChart.tsx    # تصدير null فقط
src/features/dashboard/components/InventoryChart.tsx     # إعادة تصدير من ui/dashboard
src/features/dashboard/components/SalesChart.tsx         # إعادة تصدير من ui/dashboard
```

**الإجراء**: حذف - `CategoriesChart.tsx` تصدير `null` والمكونات الأخرى معاد تصديرها

### 2.4 StatCard مكرر

```
src/features/inventory/components/product_detail/StatCard.tsx
```
هذا مكون مختلف عن `ui/common/StatCard.tsx` - يُستخدم داخلياً في `ProductDetailsContent.tsx`
**الإجراء**: الاحتفاظ به لأنه مختلف عن النسخة الرئيسية

### 2.5 ملف Seed في الإنتاج

```
src/features/sales/seed.ts    # 1,528 حرف
```

**الإجراء**: حذف - ملفات Seed للتطوير فقط

---

## 3. المكونات المكررة للتحليل

### 3.1 StatCard - 4 نسخ

| الموقع | الحالة | الإجراء |
|--------|--------|---------|
| `ui/common/StatCard.tsx` | **الأساسي** | الإحتفاظ |
| `ui/dashboard/StatCard.tsx` | إعادة تصدير | **حذف** - غير ضروري |
| `features/dashboard/components/StatCard.tsx` | إعادة تصدير | **حذف** - غير ضروري |
| `features/inventory/components/product_detail/StatCard.tsx` | مختلف (icon/label/value) | **إعادة تسمية** لتجنب الالتباس |

### 3.2 Chart Components - فوضى التصدير

```
features/dashboard/components/
├── CategoriesChart.tsx    # ملف ميت -> حذف
├── InventoryChart.tsx     # إعادة تصدير SalesChart -> حذف
└── SalesChart.tsx         # إعادة تصدير -> حذف
```

**الحل**: استخدام `ui/dashboard/CategoriesChart.tsx` و `ui/dashboard/SalesChart.tsx` مباشرة

---

## 4. الملفات الضخمة للمراجعة والتقسيم

### 4.1 `src/core/database.types.ts` - 125,559 حرف ⚠️

**المشكلة**: هذا الملف ضخم جداً ويحتوي على كل الأنواع

**الحل المقترح**: تقسيمه إلى ملفات منفصلة:

```
src/core/database/types/
├── index.ts
├── accounting.types.ts    # أنواع المحاسبة
├── auth.types.ts          # أنواع المصادقة
├── common.types.ts        # الأنواع المشتركة
├── inventory.types.ts     # أنواع المخزون
└── sales.types.ts         # أنواع المبيعات
```

### 4.2 `src/core/validators/index.ts` - 5,231 حرف

**المشكلة**: يحتوي على validators متعددة

**الحل**: تقسيم حسب المجال:

```
src/core/validators/
├── index.ts
├── expense.validator.ts
├── inventory.validator.ts
└── sales.validator.ts
```

### 4.3 `src/ui/common/ExcelTable.tsx` - 24,419 حرف ⚠️

**المشكلة**: مكون ضخم يجمع كل الوظائف

**الحل**: تقسيم إلى مكونات أصغر

---

## 5. خطة إعادة الهيكلة

### المرحلة 1: التنظيف الأولي (حذف الملفات الميتة)

```bash
# 1. حذف مجلد legacy
rm -rf scripts/legacy/

# 2. حذف ملفات AI deprecated
rm src/features/ai/{aiActions,aiProvider,chatService,documentService,hooks,memoryService,posService,productLookupService,service,store,strictPrompts,types,useAIChat,useSpeechRecognition,vehicleKnowledge}.ts

# 3. حذف مكونات Dashboard الميتة
rm src/features/dashboard/components/{CategoriesChart,InventoryChart,SalesChart}.tsx

# 4. حذف إعادة التصدير غير الضرورية
rm src/ui/dashboard/StatCard.tsx
rm src/features/dashboard/components/StatCard.tsx

# 5. حذف ملف seed
rm src/features/sales/seed.ts
```

### المرحلة 2: إعادة تسمية المكونات المتضاربة

```bash
# إعادة تسمية StatCard في product_detail
mv src/features/inventory/components/product_detail/StatCard.tsx src/features/inventory/components/product_detail/ProductStatCard.tsx
```

### المرحلة 3: تحديث الواردات (Imports)

بعد الحذف، يجب تحديث جميع الملفات التي تستورد هذه المكونات.

---

## 6. هيكل المشروع المستهدف

```
src/
├── app/
│   └── routes.tsx
├── config/
│   └── featureFlags.ts
├── core/
│   ├── database/
│   │   ├── helpers.ts
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── accounting.types.ts
│   │   │   ├── auth.types.ts
│   │   │   ├── common.types.ts
│   │   │   ├── inventory.types.ts
│   │   │   └── sales.types.ts
│   │   └── index.ts
│   ├── entities/
│   │   └── business.ts
│   ├── hooks/
│   │   ├── useErrorHandler.ts
│   │   └── useSystemInitialization.ts
│   ├── lib/
│   │   ├── persistence.ts
│   │   ├── persister.ts
│   │   ├── react-query.tsx
│   │   ├── sync-registry.ts
│   │   └── sync-store.ts
│   ├── permissions/
│   │   └── index.tsx
│   ├── routes/
│   │   └── paths.ts
│   ├── services/
│   │   ├── OfflineManager.tsx
│   │   ├── offlineQueueStore.ts
│   │   └── storage.service.ts
│   ├── store/
│   │   ├── connectionStore.ts
│   │   └── searchStore.ts
│   ├── types/
│   │   ├── common.ts
│   │   ├── supabase-helpers.ts
│   │   └── tables/
│   ├── usecases/
│   │   ├── accounting/
│   │   ├── auth/
│   │   ├── inventory/
│   │   └── sales/
│   ├── utils/
│   │   ├── accountRouting.ts
│   │   ├── currencyUtils.ts
│   │   ├── decimalUtils.ts
│   │   ├── errorUtils.ts
│   │   ├── index.ts
│   │   ├── initAPM.ts
│   │   ├── invoiceExcelExporter.ts
│   │   ├── logger.ts
│   │   ├── pdfExporter.ts
│   │   ├── returnsExcelExporter.ts
│   │   ├── search.ts
│   │   ├── supabaseMappers.ts
│   │   ├── tafqeet.ts
│   │   ├── validationUtils.ts
│   │   └── zatca.ts
│   ├── validators/
│   │   ├── index.ts
│   │   └── expenses.ts
│   ├── database.types.ts      # <- يمكن دمجه في database/types/
│   └── utils.ts
├── features/
│   ├── accounting/
│   ├── ai/
│   │   ├── chat/
│   │   ├── components/
│   │   ├── core/
│   │   ├── hooks/
│   │   ├── intent/
│   │   └── product-lookup/
│   ├── appearance/
│   ├── auth/
│   ├── bonds/
│   ├── command/
│   ├── customers/
│   ├── dashboard/
│   ├── expenses/
│   ├── feedback/
│   ├── inventory/
│   ├── notifications/
│   ├── parties/
│   ├── pos/
│   ├── purchases/
│   ├── returns/
│   ├── sales/
│   ├── settings/
│   ├── smart-import/
│   ├── suppliers/
│   └── vehicles/
├── lib/
│   ├── exportUtils.ts
│   ├── i18nStore.ts
│   ├── invalidation.ts
│   ├── localDB.ts
│   ├── offlineService.ts
│   ├── persister.ts
│   ├── queryClient.ts
│   ├── storage.ts
│   ├── supabaseClient.ts
│   ├── themeStore.ts
│   ├── zodResolver.ts
│   ├── hooks/
│   └── locales/
├── types/
│   └── xlsx-js-style.d.ts
├── ui/
│   ├── base/
│   ├── cards/
│   ├── common/
│   ├── components/
│   └── layout/
├── config/
└── index.tsx
```

---

## 7. معايير الجودة

### 7.1 حجم الملفات

| النوع | الحد الأقصى |
|-------|-------------|
| ملف TypeScript عادي | 500 سطر |
| مكون React | 300 سطر |
| ملف أنواع (types) | 1000 سطر |
| ملف اختبار | مطابق للكود الأصلي |

### 7.2 هيكل الملفات

- **ملف واحد = مسؤولية واحدة**: لا تخلط بين الأنواع والـ hooks والـ utils
- **اسم الملف يعكس المحتوى**: `useDashboard.ts` للـ dashboard hooks
- **Index exports محصور**: لا تستخدم `export *` إلا في index.ts

### 7.3 تنظيم المجلدات

```
feature/
├── components/       # مكونات UI
├── hooks/           # React hooks
├── services/        # API services
├── store/           # Zustand stores
├── types/           # أنواع خاصة
├── utils/           # دوال مساعدة
└── index.ts         # Export عام
```

### 7.4 قواعد الأسماء

| النوع | النمط | مثال |
|-------|-------|------|
| المكونات | PascalCase | `DashboardPage.tsx` |
| Hooks | camelCase with use | `useDashboard.ts` |
| Utils | camelCase | `currencyUtils.ts` |
| Types | PascalCase | `DashboardTypes.ts` |
| Stores | camelCase with Store | `settingsStore.ts` |

---

## 8. قائمة المهام

### Phase 1: التنظيف (1-2 ساعة)

- [ ] حذف `scripts/legacy/`
- [ ] حذف 14 ملف deprecated من AI
- [ ] حذف 4 مكونات dashboard ميتة
- [ ] حذف 2 StatCard معاد تصديرها
- [ ] حذف `sales/seed.ts`

### Phase 2: إعادة الهيكلة (2-3 ساعات)

- [ ] تقسيم `database.types.ts`
- [ ] إعادة تسمية `product_detail/StatCard.tsx`
- [ ] تحديث جميع الواردات المتأثرة

### Phase 3: المراجعة (1 ساعة)

- [ ] التأكد من عدم كسر أي functionality
- [ ] اختبار التطبيق
- [ ] تنظيف cache

---

## 9. الأثر المتوقع

| المقياس | قبل | بعد |
|---------|-----|-----|
| عدد الملفات | ~400 | ~370 |
| الملفات deprecated | 30+ | 0 |
| الملفات الميتة | 15+ | 0 |
| حجم database.types.ts | 125KB | 10KB |

---

## 10. ملفات للمراجعة المستقبلية

هذه الملفات كبيرة جداً وتحتاج تقسيم في المستقبل:

1. `src/ui/common/useTableKeyboardNavigation.ts` - 16,468 حرف
2. `src/core/utils/decimalUtils.ts` - 14,129 حرف
3. `src/ui/common/ExcelTable.tsx` - 24,419 حرف
4. `src/features/dashboard/hooks/index.ts` - 10,422 حرف
5. `src/ui/common/hooks/useTableResize.ts` - 6,354 حitar

---

*تاريخ الإنشاء: 2026-05-26*
*الإصدار: 1.0*
