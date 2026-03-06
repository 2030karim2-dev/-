# خطة العمل التنفيذية للتحسينات المتبقية (Remaining Action Plan)

**تاريخ الخطة:** 1 مارس 2026
**المرجع:** `docs/REMAINING_IMPROVEMENTS_REPORT.md`
**الهدف:** استكمال تنفيذ ما تبقى من خطة الجودة الشاملة (89% المتبقية) للوصول بالتقييم إلى 10/10.

---

## 🔴 الجولة الأولى: الأولوية القصوى (Critical) - تنظيف الكود الأساسي

### 1. إزالة `as any` المتبقية (185 حالة)
- [ ] **Inventory API** (`src/features/inventory/api/`): إزالة ~30 حالة باستخدام `.returns<TableRow<'products'>>()`.
- [ ] **AI Service** (`src/features/ai/service.ts`): إزالة ~25 حالة بتعريف `AIResponse` و Types واضحة للردود المستلمة وتجنب JSON Parsing للـ `any`.
- [ ] **Returns Feature** (`src/features/returns/`): تصحيح ~18 حالة لضمان أنواع الإرجاع السليمة.
- [ ] **UI Common** (`src/ui/common/`): معالجة خصائص (Props) حوالي 20 مكون واجهة لا يزال يعتمد على `any`.
- [ ] **Settings API** (`src/features/settings/api/`): حل 15 إشكالية Types في إعدادات النظام.
- [ ] **ملفات أخرى**: معالجة ~57 حالة متفرقة في (Parties, Expenses, Bonds, Hooks).

### 2. ترحيل `console.log` المتبقية (100 حالة)
- [ ] **AI Service** (`src/features/ai/`): ترحيل ~8 حالات إلى `logger.error` / `logger.info`.
- [ ] **Inventory Feature** (`src/features/inventory/`): ترحيل ~15 رسالة Console إلى Logger.
- [ ] **Settings Feature** (`src/features/settings/`): ترحيل ~10 رسائل إعدادات.
- [ ] **ملفات أخرى**: ترحيل 67 حالة متفرقة في وحدات البيع، الشراء، وخدمات الـ Offline.

---

## 🟠 الجولة الثانية: الأولوية العالية (High) - الاستقرار والاختبارات

### 3. إصلاح أخطاء الأنواع (Type Errors) الناتجة عن Strict Mode 
- **الهدف:** القضاء على الـ 300-500 خطأ المتوقعة.
- [ ] معالجة جميع أخطاء `Parameter 'x' implicitly has an 'any' type` بوضع Types صريحة للمُعاملات.
- [ ] وضع شروط تحقق Null (Null checks) لأخطاء `Object is possibly 'null'`.
- [ ] ضمان معالجة كافية لحالات الـ `undefined` باستخدام (Type Guards).
- [ ] إصلاح أخطاء `Property 'x' does not exist on type` باستخدام Interface Augmentation.

### 4. رفع تغطية الاختبارات (Test Coverage) إلى 50%
- [ ] **Core Utils**: كتابة ~50 اختبار (Unit Tests) لرفع التغطية فيها من 10% لـ 80%.
- [ ] **API Layer**: كتابة ~40 اختبار لتغطية الدوال المكلمة لـ Supabase (Target: 60%).
- [ ] **Service Layer**: كتابة ~30 اختبار تخص الـ Services والـ Transformers (Target: 50%).

---

## 🟡 الجولة الثالثة: الأولوية المتوسطة (Medium) - التكامل

### 5. تحديث CI/CD Pipelines
- [ ] إضافة خطوة فحص استخدام `any` بحيث تفشل بناء الجودة التلقائي (Quality Gate) إذا تجاوز العدد الحد الأقصى (مثلاً: 50).
- [ ] إضافة خطوة فحص Coverage للتأكد أن التغطية الإجمالية لا تقل عن 50%.
- [ ] إضافة فحص Bundle Size لتعدي الحجم المسموح به.

### 6. كتابة الاختبارات التكاملية (Integration/E2E Tests)
- [ ] استكمال سيناريو تسجيل الدخول والخروج (Playwright).
- [ ] سيناريو إنشاء فواتير شاملة (مبيعات / مشتريات).
- [ ] سيناريوهات إدارة البيانات الرئيسية (إضافة منتج، إضافة عملاء وموردين).
- [ ] سيناريوهات محاسبية (قيد آلي، سند قبض/صرف، تقارير الميزانية / أرباح وخسائر).

---

## 🟢 الجولة الرابعة: الأولوية المنخفضة (Low) - الأداء والتوثيق

### 7. تحسين الأداء (Performance Opt)
- [ ] تطبيق التقسيم الديناميكي للملفات (Code Splitting) في ميزات الذكاء الاصطناعي (AI features).
- [ ] استخدام القوائم الوهمية (Virtualization) في الواجهة للجداول والقوائم الطويلة.
- [ ] تفعيل Memoization لتقليل عمليات الـ Re-renders.
- [ ] تنفيذ التحميل العكسي للصور (Lazy Loading) واستخدام الـ Service Worker لتمكين Caching وتسريع الفتح الأول.

### 8. التوثيق (Documentation)
- [ ] إضافة توصيف JSDoc لجميع الدوال الأساسية (Public Functions).
- [ ] إعداد Storybook لمكونات واجهة المستخدم لمعاينتها.
- [ ] إرفاق ملف `README.md` لكل ميزة رئيسية (Feature) يشرح وظيفتها الرئيسية.

---

> 🚀 **جاهزون للبدء؟** المستند موجود في `plans/REMAINING_ACTION_PLAN.md`.
> كأول خطوة عملية، يمكننا الشروع فورًا في **تطبيق الجولة الأولى**: إزالة الـ `any` من نظام **المخزون (Inventory)**، أو إكمال ترحيل تقارير **Console.log**. ما رأيك أن نبدأ بذلك؟
