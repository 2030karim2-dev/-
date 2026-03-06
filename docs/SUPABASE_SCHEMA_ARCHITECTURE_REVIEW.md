# مراجعة معمارية عميقة لـ Supabase Schema
## Deep Architecture Review: Database Schema vs ERP Implementation

**تاريخ المراجعة:** 2026-03-04  
**المهارات المستخدمة:** supabase-architecture, type-safety-enforcement, erp-domain-logic

---

## 1. ملخص المشاكل المعمارية الحرجة

### 🔴 مشاكل خطيرة (Critical)

| # | المشكلة | التأثير | الأماكن المتأثرة |
|---|---------|---------|------------------|
| 1 | **تناقض تسميات الأعمدة** (snake_case vs camelCase) | فشل في mapping بين DB و TypeScript | جميع الجداول الجديدة |
| 2 | **غياب RLS Policies** لـ 6 جداول | ثغرة أمنية - الوصول غير المصرح به | `customer_tag_assignments`, `product_kit_items`, etc. |
| 3 | **غياب Indexes** على Foreign Keys | بطء في الاستعلامات | `journal_entry_lines.party_id`, `payments.account_id` |
| 4 | **تكرار جدولي** `supplier_price_history` | تناقض في البيانات | `supplier_price_history` vs `product_supplier_prices` |

---

## 2. تحليل تفصيلي للمشاكل

### 2.1 مشاكل تسميات الأعمدة (Naming Convention Mismatches) 🔴

#### جدول: `parties`

| العمود في DB | النوع في DB | المتوقع في TypeScript | الواقع في الكود | المشكلة |
|--------------|-------------|----------------------|-----------------|---------|
| `customer_type` | `text` | `customer_type` | `customerType` | ❌ تناقض Naming Convention |
| `lead_source` | `text` | `lead_source` | `leadSource` | ❌ تناقض Naming Convention |
| `preferred_contact_method` | `text` | `preferred_contact_method` | `preferredContactMethod` | ❌ تناقض Naming Convention |
| `credit_limit` | `numeric` | `credit_limit` | `creditLimit` | ❌ تناقض Naming Convention |
| `total_invoices_count` | `integer` | `total_invoices_count` | `totalInvoicesCount` | ❌ تناقض Naming Convention |
| `last_contact_date` | `timestamptz` | `last_contact_date` | `lastContactDate` | ❌ تناقض Naming Convention |
| `customer_since` | `date` | `customer_since` | `customerSince` | ❌ تناقض Naming Convention |
| `loyalty_points` | `integer` | `loyalty_points` | `loyaltyPoints` | ❌ تناقض Naming Convention |
| `satisfaction_score` | `integer` | `satisfaction_score` | `satisfactionScore` | ❌ تناقض Naming Convention |
| `supplier_type` | `text` | `supplier_type` | `supplierType` | ❌ تناقض Naming Convention |
| `tax_number` | `text` | `tax_number` | `taxNumber` | ❌ تناقض Naming Convention |
| `commercial_registration` | `text` | `commercial_registration` | `commercialRegistration` | ❌ تناقض Naming Convention |
| `payment_terms_days` | `integer` | `payment_terms_days` | `paymentTermsDays` | ❌ تناقض Naming Convention |
| `min_order_amount` | `numeric` | `min_order_amount` | `minOrderAmount` | ❌ تناقض Naming Convention |
| `delivery_lead_days` | `integer` | `delivery_lead_days` | `deliveryLeadDays` | ❌ تناقض Naming Convention |
| `is_active_supplier` | `boolean` | `is_active_supplier` | `isActiveSupplier` | ❌ تناقض Naming Convention |
| `avg_rating` | `numeric` | `avg_rating` | `avgRating` | ❌ تناقض Naming Convention |
| `total_orders_count` | `integer` | `total_orders_count` | `totalOrdersCount` | ❌ تناقض Naming Convention |
| `total_purchases_amount` | `numeric` | `total_purchases_amount` | `totalPurchasesAmount` | ❌ تناقض Naming Convention |
| `last_purchase_date` | `timestamptz` | `last_purchase_date` | `lastPurchaseDate` | ❌ تناقض Naming Convention |

**الملف المتأثر:** [`src/features/parties/types/enhanced/index.ts`](src/features/parties/types/enhanced/index.ts:157)

```typescript
// ❌ الكود الحالي يستخدم camelCase
export interface EnhancedParty extends Party {
    customerType?: CustomerType;        // يجب أن يكون: customer_type
    leadSource?: string;                // يجب أن يكون: lead_source
    preferredContactMethod?: ContactMethod; // يجب أن يكون: preferred_contact_method
    creditLimit?: number;               // يجب أن يكون: credit_limit
    // ... وهكذا
}
```

**الحل:**
1. إما تغيير TypeScript types لاستخدام snake_case (متوافق مع Supabase)
2. أو إضافة mapping layer بين DB والكود
3. **الأفضل:** استخدام مكتبة مثل `snakecase-keys` للتحويل التلقائي

---

### 2.2 مشاكل RLS Policies (Row Level Security) 🔴

#### جداول بدون RLS Policies بالكامل:

| الجدول | الخطورة | السبب |
|--------|---------|-------|
| `customer_tag_assignments` | 🔴 حرجة | البيانات مكشوفة لجميع المستخدمين |
| `product_kit_items` | 🔴 حرجة | تكوينات المنتجات مكشوفة |
| `product_cross_references` | 🟡 متوسطة | علاقات المنتجات البديلة |
| `product_fitment` | 🟡 متوسطة | توافقات المركبات |
| `stock_transfer_items` | 🟡 متوسطة | عناصر نقل المخزون |
| `payment_allocations` | 🔴 حرجة | تخصيصات المدفوعات مكشوفة |

#### جداول مع RLS Policies ناقصة:

| الجدول | السياسات المفقودة | الحالة الحالية |
|--------|-------------------|----------------|
| `customer_activities` | DELETE | SELECT, INSERT, UPDATE فقط |
| `customer_notes` | DELETE | SELECT, INSERT, UPDATE فقط |
| `supplier_ratings` | DELETE | SELECT, INSERT, UPDATE فقط |

**مثال على الـ Policy المفقود:**
```sql
-- ❌ مفقود لـ customer_tag_assignments
CREATE POLICY "customer_tag_assignments_delete" ON customer_tag_assignments
    FOR DELETE USING (customer_id IN (
        SELECT id FROM parties WHERE company_id IN (
            SELECT company_id FROM company_members WHERE user_id = auth.uid()
        )
    ));
```

---

### 2.3 مشاكل الفهارس (Missing Indexes) 🟡

#### Foreign Keys بدون Indexes:

| الجدول | العمود | Foreign Key إلى | الأثر |
|--------|--------|-----------------|-------|
| `journal_entry_lines` | `party_id` | `parties(id)` | بطء في فلترة القيود بالطرف |
| `payments` | `account_id` | `accounts(id)` | بطء في تقارير الحسابات |
| `expense_categories` | `account_id` | `accounts(id)` | بطء في تقارير المصاريف |
| `audit_items` | `product_id` | `products(id)` | بطء في تقارير الجرد |
| `product_stock` | `product_id` | `products(id)` | بطء في استعلامات المخزون |

**الاستعلامات المتأثرة:**
```sql
-- هذا الاستعلام سيكون بطيء بدون index
SELECT * FROM journal_entry_lines 
WHERE party_id = 'uuid';

-- هذا الاستعلام سيكون بطيء بدون index
SELECT * FROM payments 
WHERE account_id = 'uuid';
```

**الحل:**
```sql
-- إضافة الفهارس المفقودة
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_party_id ON journal_entry_lines(party_id);
CREATE INDEX IF NOT EXISTS idx_payments_account_id ON payments(account_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_account_id ON expense_categories(account_id);
CREATE INDEX IF NOT EXISTS idx_audit_items_product_id ON audit_items(product_id);
CREATE INDEX IF NOT EXISTS idx_product_stock_product_id ON product_stock(product_id);
```

---

### 2.4 تكرار الجداول (Table Duplication) 🔴

#### المشكلة: جدولان لتاريخ أسعار الموردين

| الجدول | الغرض | الحالة |
|--------|-------|--------|
| `supplier_price_history` | تاريخ أسعار الموردين | ✅ مستخدم في الهجرات |
| `product_supplier_prices` | أسعار الموردين الحالية | ✅ موجود في الـ Schema |

**التناقض:**
- `supplier_price_history` يحتوي على: `unit_price`, `currency`, `effective_date`
- `product_supplier_prices` يحتوي على: `cost_price`, `lead_time_days`, `supplier_part_number`

**المشكلة:** تكرار في البيانات - نفس المعلومة مخزنة في جدولين

**الحل المقترح:**
```sql
-- دمج الجدولين في جدول واحد مع إضافة عمود is_current
ALTER TABLE product_supplier_prices 
ADD COLUMN effective_date date DEFAULT CURRENT_DATE,
ADD COLUMN is_current boolean DEFAULT true;

-- إنشاء index للبحث السريع
CREATE INDEX idx_product_supplier_prices_current 
ON product_supplier_prices(product_id, supplier_id) 
WHERE is_current = true;

-- حذف الجدول المكرر
DROP TABLE supplier_price_history;
```

---

### 2.5 مشاكل أنواع البيانات (Data Type Issues) 🟡

#### تناقض في أنواع المبالغ المالية:

| الجدول | العمود | النوع | المشكلة |
|--------|--------|-------|---------|
| `invoices` | `total_amount` | `numeric` | ✅ صحيح |
| `invoices` | `subtotal` | `numeric` | ✅ صحيح |
| `invoices` | `tax_amount` | `numeric` | ✅ صحيح |
| `invoice_items` | `total` | `numeric` | ✅ صحيح |
| `invoice_items` | `cost_price` | `numeric` | ✅ صحيح |
| `products` | `purchase_price` | `numeric` | ✅ صحيح |
| `products` | `sale_price` | `numeric` | ✅ صحيح |
| `products` | `cost_price` | `numeric` | ⚠️ غير محدد constraint |

**الملاحظة:** عمود `products.cost_price` لا يحتوي على CHECK constraint بينما `purchase_price` و `sale_price` يحتويان:
```sql
-- purchase_price و sale_price يحتويان على:
CHECK (purchase_price >= 0::numeric)
CHECK (sale_price >= 0::numeric)

-- لكن cost_price لا يحتوي على constraint
```

**الحل:**
```sql
ALTER TABLE products 
ADD CONSTRAINT check_cost_price_non_negative 
CHECK (cost_price >= 0::numeric);
```

---

### 2.6 مشاكل العلاقات (Relationship Issues) 🟡

#### علاقات Circuilar محتملة:

**العلاقة:** `accounts.parent_id` → `accounts.id`

**المشكلة:** لا يوجد check لمنع circular references

**مثال على المشكلة:**
```
Account A (id=1) → parent_id = 2
Account B (id=2) → parent_id = 1  <-- Circular!
```

**الحل:**
```sql
-- إضافة trigger للتحقق من circular references
CREATE OR REPLACE FUNCTION check_account_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id = NEW.id THEN
        RAISE EXCEPTION 'Account cannot be its own parent';
    END IF;
    -- Additional check for deeper circular references
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_circular_account_reference
    BEFORE INSERT OR UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION check_account_hierarchy();
```

---

### 2.7 مشاكل التكامل مع Features (Feature Integration Issues) 🔴

#### مشكلة: تكرار Features (customers/suppliers/parties)

**الهيكل الحالي:**
```
src/features/
├── customers/          ← قديم، يجب إزالته
├── suppliers/          ← قديم، يجب إزالته
└── parties/            ← جديد، يحتوي على كل شيء
    ├── components/
    │   ├── customers/
    │   └── suppliers/
    └── types/enhanced/
```

**الاستيرادات المشتتة:**
```typescript
// ❌ استيراد من features مختلفة
import { useCustomerSearch } from '../../customers/hooks';        // قديم
import { useSupplierSearch } from '../../suppliers/hooks';        // قديم
import { partiesService } from '../../../../features/parties/service';  // جديد
```

**الحل:**
1. دمج `customers/` و `suppliers/` في `parties/`
2. تحديث جميع الاستيرادات
3. حذف المجلدات القديمة
4. إنشاء barrel exports من `parties/`

---

### 2.8 مشاكل TypeScript Definitions 🔴

#### جداول غير موجودة في `database.types.ts`:

| الجدول | الغرض | Priority |
|--------|-------|----------|
| `customer_activities` | أنشطة العملاء | 🔴 عالية |
| `customer_notes` | ملاحظات العملاء | 🔴 عالية |
| `customer_tags` | وسوم العملاء | 🔴 عالية |
| `customer_tag_assignments` | علاقة العملاء والوسوم | 🔴 عالية |
| `supplier_ratings` | تقييمات الموردين | 🔴 عالية |
| `supplier_price_history` | تاريخ أسعار الموردين | 🟡 متوسطة |

**الأخطاء الناتجة:**
```typescript
// ❌ خطأ: الجدول غير موجود في database.types.ts
const { data, error } = await supabase
    .from('customer_activities')  // ❌ TypeScript error: table not found
    .select('*');
```

---

## 3. خطة التصحيح العاجلة

### المرحلة 1: إصلاحات حرجة (1-2 يوم)

#### 3.1 إضافة RLS Policies المفقودة
```sql
-- customer_tag_assignments
ALTER TABLE customer_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_tag_assignments_select" ON customer_tag_assignments
    FOR SELECT USING (customer_id IN (
        SELECT id FROM parties WHERE company_id IN (
            SELECT company_id FROM user_company_roles WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "customer_tag_assignments_insert" ON customer_tag_assignments
    FOR INSERT WITH CHECK (customer_id IN (
        SELECT id FROM parties WHERE company_id IN (
            SELECT company_id FROM user_company_roles WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "customer_tag_assignments_delete" ON customer_tag_assignments
    FOR DELETE USING (customer_id IN (
        SELECT id FROM parties WHERE company_id IN (
            SELECT company_id FROM user_company_roles WHERE user_id = auth.uid()
        )
    ));
```

#### 3.2 إضافة الفهارس المفقودة
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_journal_entry_lines_party_id ON journal_entry_lines(party_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_account_id ON payments(account_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expense_categories_account_id ON expense_categories(account_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_stock_product_id ON product_stock(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id);
```

#### 3.3 إصلاح Constraint المفقود
```sql
ALTER TABLE products 
ADD CONSTRAINT check_cost_price_non_negative 
CHECK (cost_price >= 0::numeric);
```

### المرحلة 2: تحديث TypeScript Types (1 يوم)

```bash
# إعادة توليد أنواع Supabase
npx supabase gen types typescript --project-id <project-id> > src/core/database.types.ts
```

أو إضافة الأنواع يدوياً:
```typescript
// src/core/database.types.ts
export interface Database {
  public: {
    Tables: {
      // ... existing tables
      customer_activities: {
        Row: {
          id: string;
          company_id: string | null;
          customer_id: string | null;
          activity_type: 'call' | 'email' | 'meeting' | 'visit' | 'note' | 'task' | 'invoice_created' | 'payment_received' | 'complaint' | 'follow_up';
          subject: string;
          description: string | null;
          // ... etc
        };
      };
      // ... other missing tables
    };
  };
}
```

### المرحلة 3: توحيد Naming Convention (2-3 أيام)

**الخيار 1: استخدام snake_case في TypeScript (مستحسن)**
```typescript
// ✅ تغيير جميع الأنواع لاستخدام snake_case
export interface EnhancedParty extends Party {
    customer_type?: 'individual' | 'company' | 'government';
    lead_source?: string;
    preferred_contact_method?: 'phone' | 'email' | 'whatsapp';
    credit_limit?: number;
    // ... etc
}
```

**الخيار 2: استخدام مكتبة للتحويل**
```typescript
import snakecaseKeys from 'snakecase-keys';
import camelcaseKeys from 'camelcase-keys';

// عند الإرسال إلى DB
const dbData = snakecaseKeys(typescriptData);

// عند الاستلام من DB
const typescriptData = camelcaseKeys(dbData);
```

### المرحلة 4: دمج الجداول المكررة (1 يوم)

```sql
-- دمج supplier_price_history في product_supplier_prices
ALTER TABLE product_supplier_prices 
ADD COLUMN IF NOT EXISTS effective_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS is_current boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'SAR'::text;

-- نقل البيانات
INSERT INTO product_supplier_prices 
    (company_id, product_id, supplier_id, cost_price, currency, effective_date, is_current, last_updated)
SELECT 
    company_id, product_id, supplier_id, unit_price, currency, effective_date, true, created_at
FROM supplier_price_history;

-- حذف الجدول القديم
DROP TABLE supplier_price_history;

-- إنشاء index للأسعار الحالية
CREATE INDEX idx_product_supplier_prices_current 
ON product_supplier_prices(product_id, supplier_id, is_current) 
WHERE is_current = true;
```

---

## 4. ملخص التوصيات

| الأولوية | المهمة | الجهد | التأثير |
|----------|--------|-------|---------|
| 🔴 عاجل | إضافة RLS Policies | 2-3 ساعات | أمان البيانات |
| 🔴 عاجل | إضافة الفهارس | 1 ساعة | أداء الاستعلامات |
| 🔴 عاجل | إصلاح Constraint | 30 دقيقة | سلامة البيانات |
| 🟡 عالي | تحديث TypeScript types | 4-6 ساعات | Type Safety |
| 🟡 عالي | توحيد Naming Convention | 1-2 يوم | صيانة الكود |
| 🟢 متوسط | دمج الجداول المكررة | 4-6 ساعات | تبسيط Schema |

---

*هذا التقرير تم إنشاؤه باستخدام مهارة supabase-architecture*
