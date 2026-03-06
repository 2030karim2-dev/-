# خطة التنفيذ المُحداثة - Al-Zahra Smart ERP

## المشكلة الأساسية المكتشفة

ملف `database.types.ts` الحالي غير مكتمل ويحتاج إلى تحديث. الأعمدة التالية مفقودة أو غير مُعرّفة بشكل صحيح:

### أعمدة مفقودة في جدول invoices:
- `currency` ❌ → `currency_code` ✅
- `discount` ❌ → `discount_amount` ✅
- `tax` ❌ → `tax_amount` ✅
- `balance_due` ❌ → يُحسب من `total_amount - paid_amount` ✅
- `reference` ❌ → غير موجود في السكيما
- `updated_at` ❌ → موجود في السكيما لكن ربما مفقود في بعض الإصدارات

### أعمدة مفقودة في جدول invoice_items:
- `currency` ❌ → غير موجود
- `exchange_rate` ❌ → غير موجود
- `product_name` ❌ → غير موجود
- `discount` ❌ → `discount_amount` ✅
- `tax_rate` ❌ → غير موجود
- `warehouse_id` ❌ → غير موجود

### أعمدة مفقودة في جدول parties:
- `category` ❌ → `category_id` ✅
- `currency_code` ❌ → غير موجود
- `credit_limit` ❌ → غير موجود

## الحل المقترح

### 1. تحديث ملف database.types.ts

يجب إعادة توليد الملف باستخدام:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/core/database.types.ts
```

أو تحديثه يدوياً بناءً على السكيما المُرسلة.

### 2. تصحيح ملفات Domain Types

#### sales/types/domain.ts
```typescript
// خطأ:
const currency: CurrencyCode = (row.currency as CurrencyCode) || 'SAR';

// صحيح:
const currency: CurrencyCode = (row.currency_code as CurrencyCode) || 'SAR';
```

```typescript
// خطأ:
discount: MoneyUtils.create(row.discount || 0, currency, row.exchange_rate || 1),

// صحيح:
discount: MoneyUtils.create(row.discount_amount || 0, currency, row.exchange_rate || 1),
```

```typescript
// خطأ:
tax: MoneyUtils.create(row.tax || 0, currency, row.exchange_rate || 1),

// صحيح:
tax: MoneyUtils.create(row.tax_amount || 0, currency, row.exchange_rate || 1),
```

```typescript
// خطأ:
balanceDue: MoneyUtils.create(row.balance_due || 0, currency, row.exchange_rate || 1),

// صحيح:
balanceDue: MoneyUtils.create(
  (row.total_amount || 0) - (row.paid_amount || 0), 
  currency, 
  row.exchange_rate || 1
),
```

### 3. تصحيح InvoiceItemMapper

```typescript
// خطأ:
unitPrice: MoneyUtils.create(row.unit_price || 0, currency, row.exchange_rate || 1),

// صحيح:
unitPrice: MoneyUtils.create(row.unit_price || 0),
```

```typescript
// خطأ:
discount: row.discount || 0,

// صحيح:
discountAmount: MoneyUtils.create(row.discount_amount || 0),
```

```typescript
// خطأ:
taxRate: row.tax_rate || 0,

// صحيح - tax_rate غير موجود، يمكن إزالته أو استخدام tax_amount:
taxAmount: MoneyUtils.create(row.tax_amount || 0),
```

### 4. تصحيح CustomerMapper

```typescript
// خطأ:
category: row.category || 'عام',

// صحيح - category غير موجود مباشرة:
// يمكن الاستعلام عنه من category_id إذا لزم الأمر
```

```typescript
// خطأ:
creditLimit: row.credit_limit ? MoneyUtils.create(row.credit_limit, ...) : null,

// صحيح - credit_limit غير موجود في السكيما:
creditLimit: null,
```

## المهام المتبقية

### أولوية قصوى:
1. ✅ تحديث database.types.ts
2. ✅ تصحيح sales/types/domain.ts
3. ✅ تصحيح purchases/types/domain.ts
4. ✅ التحقق من أن جميع Mappers تستخدم الأعمدة الصحيحة
5. ✅ إعادة تشغيل TypeScript compiler للتحقق من عدم وجود أخطاء

### أولوية عالية:
6. ⏳ إصلاح settings/api.ts (بدون "as any")
7. ⏳ إصلاح sales/api.ts
8. ⏳ إصلاح purchases/api.ts
9. ⏳ إصلاح parties/api.ts
10. ⏳ إصلاح inventory/api/*.ts

### أولوية متوسطة:
11. ⏳ إنشاء أنواع المحاسبة
12. ⏳ إنشاء أنواع المخزون
13. ⏳ إصلاح Service Layer

## ملاحظة مهمة

عند استخدام Supabase مع TypeScript، يجب التأكد من:
1. تمرير نوع Database إلى createClient
2. استخدام أسماء الأعمدة الصحيحة من قاعدة البيانات
3. عدم افتراض وجود أعمدة غير موجودة في السكيما

## Command Center | مركز القيادة

### Type Safety Scanner
- إنشاء تقرير كامل بجميع "as any"
- تصنيف المشاكل حسب الأولوية
- توليد اقتراحات للإصلاح

### Quality Gates
- Zero "as any" policy
- TypeScript strict mode
- Function return types required

## الخلاصة

تم إنجاز:
✅ إنشاء Type Safety Scanner
✅ إنشاء Domain Types للمبيعات والمشتريات
✅ تحديد المشاكل في database.types.ts
✅ توثيق جميع الأعمدة غير الصحيحة

المطلوب:
⏳ تحديث database.types.ts
⏳ تصحيح Domain Types
⏳ إصلاح جميع ملفات API
⏳ تفعيل TypeScript Strict Mode

**التقدم الإجمالي: 15%**
