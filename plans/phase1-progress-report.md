#_phase1_progress_report.md

# تقرير تقدم المرحلة الأولى - التطهير والتفكيك الحرج

**التاريخ:** 2026-05-26
**المنشئ:** Kilo Code AI
**الحالة:** 🔄 قيد التنفيذ

---

## 1.1 تقسيم database.types.ts - الحالة: 🔄 بدأنا للتو

### ما تم اكتشافه:

**حجم الملف الأصلي:**
- 4,002 سطر
- 125,559 حرف

**عدد الجداول:** 53 جدول

```
 1. accounts              19. invoices              37. stock_transfers
 2. api_rate_limits      20. journal_entries       38. supplier_price_history  
 3. audit_items         21. journal_entry_lines   39. supplier_ratings
 4. audit_logs          22. messaging_config      40. supported_currencies
 5. audit_sessions      23. notification_log     41. tax_rates
 6. branches            24. parties               42. user_company_roles
 7. companies           25. party_categories      43. vehicles
 8. customer_activities  26. payment_allocations   44. warehouses
 9. customer_notes      27. payments              45. account_balances
10. customer_tag_assignments 28. product_categories 46. active_accounts
11. customer_tags       29. product_cross_references 47. active_expenses
12. exchange_rates      30. product_fitment       48. active_invoices
13. expense_categories 31. product_kit_items     49. active_journal_entries
14. expenses           32. product_stock         50. active_parties
15. fiscal_years       33. product_supplier_prices 51. active_payments
16. inventory_transactions 34. products           52. active_products
17. invitations        35. profiles              53. party_balances
18. invoice_items
```

**الملفات المستوردة حالياً (15 ملف):**
1. `src/lib/supabaseClient.ts` - import `{ Database }`
2. `src/core/utils/supabaseMappers.ts` - import `{ Database }`
3. `src/features/settings/service.ts` - inline import
4. `src/features/sales/types/domain.ts` - import type `{ Database }`
5. `src/core/types/supabase-helpers.ts` - import `{ Database }`
6. `src/features/purchases/types/domain.ts` - import type `{ Database }`
7. `src/features/parties/types.ts` - import `{ Database }`
8. `src/core/index.ts` - re-export
9. `src/features/dashboard/types.ts` - import `{ Database }`
10. `src/core/database.helpers.ts` - import `{ Database }`
11. `src/features/accounting/api/accountsApi.ts` - import `{ Database }`

### ما تم إنجازه:

1. ✅ تحليل بنية الملف ومحتواه
2. ✅ استخراج قائمة جميع الجداول (53 جدول)
3. ✅ تحليل ملفات الـ imports والاعتماديات
4. ✅ 发现 existing types already exist in `src/core/database/types/`:
   - `accounting.types.ts` ( موجود)
   - `auth.types.ts` ( موجود)
   - `common.types.ts` ( موجود)
   - `index.ts` ( موجود)
   - `inventory.types.ts` ( موجود)
   - `sales.types.ts` ( موجود)

5. ✅ إنشاء ملفات types جديدة cautiously:
   - `purchases.types.ts` - تم إنشاؤه مع مراعاة الجداول غير الموجودة

### ما تبقى:

1. ⏳ إكمال ملفات الأنواع المفقودة:
   - `warehouses.types.ts`
   - `parties.types.ts`
   - `companies.types.ts`
   - `auto-parts.types.ts`
   - `settings.types.ts`
   - `audit.types.ts`

2. ⏳ تحديث `src/core/database/types/index.ts` ليشمل جميع الصادرات

3. ⏳ تحديث الملفات المستوردة para استخدام المسار الجديد

4. ⏳ حذف ملف `database.types.ts` الأصلي

---

## 1.2 تجزئة appearance/constants.ts - الحالة: ⏳ لم يبدأ

**الموقف:**
- الملف الحالي: 1,909 حرف (حجم صغير)
- Presets موجودة في `src/features/appearance/presets/`:
  - `premium.ts` - 5,694 حرف
  - `warmAndRoyal.ts` - 6,335 حرف
  - `business.ts` - 5,772 حرف
  - `creative.ts` - 6,417 حرف
  - `seasonalAndArtistic.ts` - 6,146 حرف

**المطلوب:**
- إضافة Lazy Loading للثيمات
- إنشاء نظام تحميل كسول للـ presets

---

## 1.3 حذف الملفات الميتة - الحالة: ⏳ لم يبدأ

**الملفات المراد حذفها:**
- `src/features/parties/components/ProductCardView.tsx` - فارغ
- `src/features/pos/components/POSHeader.tsx` - فارغ
- `src/features/parties/hooks/usePartiesData.ts` - فارغ
- `src/features/parties/hooks/usePartiesView.ts` - قيد الاستخدام حالياً
- `scripts/legacy/` - المجلد غير موجود

**ملاحظة:** 
- `usePartiesView` يبدو أنه قيد الاستخدام في `PartiesPage.tsx`
- يجب مراجعة استخدامه قبل الحذف

---

## المشاكل والتصحيحات

### مشكلة 1: indentation
- الملف يستخدم مسافات بادئة (spaces) وليست tabs
- الأنماط regex الخاصة بـ tabs لا تعمل

### مشكلة 2: الجداول الإضافية
- بعض الجداول المطلوبة في خطة types غير موجودة فعلياً في database.types.ts
- مثل: `purchase_orders`, `purchase_quotations`, `purchase_order_items`
- يجب التعامل معها كـ extended types

### مشكلة 3: Supabase Client Type Safety
- عند إنشاء types，我们需要 استخدام فعلي table names من schema
- لا يمكن إضافة جداول وهمية

---

## التوصيات للمتابعة

### الخطوة التالية الفورية:

1. **تحديث index.ts** ليشمل فقط الملفات الموجودة:
   ```typescript
   export * from './common.types';
   export * from './accounting.types';
   export * from './sales.types';
   export * from './inventory.types';
   export * from './auth.types';
   export * from './purchases.types';  // newly created
   ```

2. **إنشاء ملفات types ناقصة** مع الحذر:
   - `warehouses.types.ts` - using `warehouses` table
   - `parties.types.ts` - using `parties`, `party_categories`, `customer_*` tables
   - `companies.types.ts` - using `companies`, `branches` tables

3. **إعادة توجيه imports:**
   - تحديث `src/core/index.ts` لاستخدام المسار الصحيح
   - الحفاظ على backward compatibility

### متطلبات إضافية:

1. **اختبار TypeScript:**
   ```bash
   npm run type-check
   ```

2. **فحص الـ imports:**
   - التحقق من جميع الأماكن التي تستخدم `database.types`
   - تحديثها تدريجياً

3. **النسخ الاحتياطي:**
   - عمل نسخة من الملف الأصلي قبل الحذف
   
---

## ملخص الوقت

| المهمة | الحالة | الوقت المنspent |
|--------|--------|----------------|
| تحليل database.types.ts | ✅ مكتمل | ~30 دقيقة |
| اكتشاف الجداول (53) | ✅ مكتمل | ~5 دقائق |
| تحليل الاعتماديات | ✅ مكتمل | ~10 دقائق |
| موجود types | ✅ مكتمل | ~5 دقائق |
| إنشاء purchases.types.ts | ✅ مكتمل | ~10 دقائق |
| إكمال باقي الملفات | ⏳ | ~2-3 ساعات |
| الاختبار | ⏳ | ~1 ساعة |
| المهام الأخرى | ⏳ | غير محدد |

**إجمالي الوقت المنقضي:** ~60 دقيقة
**إجمالي الوقت المتبقي ( المرحلة 1):** ~4-6 ساعات

---

_آخر تحديث: 2026-05-26 22:55 UTC_
