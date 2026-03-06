# تقرير فحص مخطط قاعدة البيانات

## الملخص التنفيذي

تم تحليل مخطط Supabase المكون من **36 جدول** لتطبيق Alzhra Smart ERP. تم اكتشاف مشاكل متعددة تتراوح بين الحرجة والمنخفضة.

---

## 1. قائمة الجداول

| # | الجدول | الغرض | عدد الحقول |
|---|--------|-------|-----------|
| 1 | accounts | خطة الحسابات | 13 |
| 2 | audit_items | بنود الجرد | 6 |
| 3 | audit_logs | سجلات التدقيق | 7 |
| 4 | audit_sessions | جلسات الجرد | 8 |
| 5 | branches | الفروع | 7 |
| 6 | companies | الشركات | 13 |
| 7 | exchange_rates | أسعار الصرف | 7 |
| 8 | expense_categories | تصنيفات المصروفات | 6 |
| 9 | expenses | المصروفات | 19 |
| 10 | fiscal_years | السنوات المالية | 7 |
| 11 | inventory_transactions | حركات المخزون | 11 |
| 12 | invitations | الدعوات | 10 |
| 13 | invoice_items | بنود الفواتير | 12 |
| 14 | invoices | الفواتير | 24 |
| 15 | journal_entries | القيود المحاسبية | 12 |
| 16 | journal_entry_lines | بنود القيود | 9 |
| 17 | messaging_config | إعدادات الإشعارات | 17 |
| 18 | notification_log | سجل الإشعارات | 9 |
| 19 | parties | العملاء/الموردون | 15 |
| 20 | party_categories | تصنيفات العملاء/الموردين | 5 |
| 21 | payment_allocations | تخصيصات الدفع | 4 |
| 22 | payments | المدفوعات | 21 |
| 23 | product_categories | تصنيفات المنتجات | 4 |
| 24 | product_cross_references | مراجع بديلة | 9 |
| 25 | product_fitment | توافق المنتجات/المركبات | 5 |
| 26 | product_kit_items | بند套装 | 5 |
| 27 | product_stock | مخزون المنتجات | 5 |
| 28 | product_supplier_prices | أسعار الموردين | 9 |
| 29 | products | المنتجات | 28 |
| 30 | profiles | ملفات المستخدمين | 5 |
| 31 | stock_transfer_items | بنود التحويل | 4 |
| 32 | stock_transfers | التحويلات | 8 |
| 33 | supported_currencies | العملات المدعومة | 6 |
| 34 | user_company_roles | أدوار المستخدمين | 5 |
| 35 | vehicles | المركبات | 16 |
| 36 | warehouses | المستودعات | 10 |

---

## 2. المشاكل المكتشفة

### 2.1 مشاكل حرجة (CRITICAL)

#### 2.1.1 نقص فهرس唯一 على invoice_number

```sql
-- ❌ المشكلة: invoice_number ليس فهرساً فريداً
CREATE TABLE public.invoices (
  invoice_number text,  -- لا يوجد UNIQUE constraint
  ...
);
```

**التأثير:** 
- إمكانية إنشاء أرقام فاتورة مكررة
- صعوبة البحث عن فاتورة معينة
- خلل في مطابقة القيود المحاسبية

**الحل:**
```sql
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);
```

---

#### 2.1.2 نقص فهرس唯一 على account code

```sql
-- ❌ المشكلة: كود الحساب ليس فريداً ضمن الشركة
CREATE TABLE public.accounts (
  code text NOT NULL,  -- لا يوجد UNIQUE ضمن company_id
  company_id uuid NOT NULL,
  ...
);
```

**التأثير:**
- إمكانية وجود أكواد مكررة للشركة
- خطأ في ترحيل القيود
- خلل في تقريرTrial Balance

**الحل:**
```sql
ALTER TABLE public.accounts
ADD CONSTRAINT accounts_company_code_unique UNIQUE (company_id, code);
```

---

#### 2.1.3 نقص حساب تلقائي لـ entry_number

```sql
-- ❌ المشكلة: entry_number يحتاج تعيين يدوي
CREATE TABLE public.journal_entries (
  entry_number bigint NOT NULL DEFAULT 0,  --默认值 0
  ...
);
```

**التأثير:**
- وجود قيود بنفس الرقم
- خطأ في تتابع القيود

**الحل:**
```sql
-- إنشاء sequence
CREATE SEQUENCE journal_entry_number_seq;

-- إنشاء دالة
CREATE OR REPLACE FUNCTION get_next_entry_number(p_company_id UUID)
RETURNS BIGINT AS $$
DECLARE
  next_val BIGINT;
BEGIN
  SELECT COALESCE(MAX(entry_number), 0) + 1
  INTO next_val
  FROM journal_entries
  WHERE company_id = p_company_id;
  
  RETURN next_val;
END;
$$ LANGUAGE plpgsql;
```

---

### 2.2 مشاكل عالية (HIGH)

#### 2.2.1 عدم وجود حقل لحساب الرصيد في parties

```sql
-- ⚠️ المشكلة: balance يتم حسابه يدوياً
CREATE TABLE public.parties (
  balance numeric NOT NULL DEFAULT 0,  --手动计算
  ...
);
```

**التأثير:**
- عدم دقة الرصيد
- عدم مزامنة الرصيد مع القيود

**الحل:** إنشاء view أو trigger

```sql
-- إنشاء view للرصيد
CREATE VIEW party_balances AS
SELECT 
  p.id,
  p.company_id,
  p.name,
  p.type,
  COALESCE(
    (SELECT SUM(jel.credit_amount) - SUM(jel.debit_amount)
     FROM journal_entries je
     JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
     JOIN accounts a ON jel.account_id = a.id
     WHERE je.company_id = p.company_id
     AND a.party_id = p.id
     AND je.status = 'posted'),
    0
  ) AS calculated_balance
FROM parties p;
```

---

#### 2.2.2 عدم وجود علاقة صحيحة بين accounts و parties

```sql
-- ⚠️ المشكلة: لا يوجد party_id في جدول accounts
CREATE TABLE public.accounts (
  id uuid NOT NULL,
  company_id uuid NOT NULL,
  code text NOT NULL,
  name_ar text NOT NULL,
  type text NOT NULL,
  parent_id uuid,
  ...
);
```

**التأثير:**
- صعوبة تتبع أرصدة العملاء/الموردين
- عدم وجودrelation بين الحسابات والجهات

**الحل:**
```sql
-- إضافة party_id لجدول الحسابات
ALTER TABLE public.accounts
ADD COLUMN party_id uuid REFERENCES public.parties(id);
```

---

#### 2.2.3 عدم وجود حقل is_core_return في invoice_items

```sql
-- ⚠️ موجودة في الكود ولكن قد لا تكون في المخطط
-- ملاحظة: الحقل موجود في الكود:
-- is_core_return boolean DEFAULT false
```

---

### 2.3 مشاكل متوسطة (MEDIUM)

#### 2.3.1 تكرار في تخزين التوافق (Vehicle Fitment)

```sql
-- ⚠️ مشكلة: product_fitment يستخدم UUID للعلاقة
CREATE TABLE public.product_fitment (
  product_id uuid NOT NULL,
  vehicle_id uuid NOT NULL,
  ...
);
```

**بدون composite unique constraint:**

**التأثير:**
- تكرار في توافق نفس المنتج مع نفس المركبة

**الحل:**
```sql
ALTER TABLE public.product_fitment
ADD CONSTRAINT product_vehicle_unique UNIQUE (product_id, vehicle_id);
```

---

#### 2.3.2 عدم وجود وصف للعلاقة في product_kit_items

```sql
-- ⚠️ المشكلة: لا يوجد معرف للعلاقة
CREATE TABLE public.product_kit_items (
  kit_product_id uuid NOT NULL,
  component_product_id uuid NOT NULL,
  quantity numeric NOT NULL,
  ...
);
```

**بدون constraint للتأكد من أن:**

**الحل:**
```sql
ALTER TABLE public.product_kit_items
ADD CONSTRAINT kit_unique UNIQUE (kit_product_id, component_product_id);

-- منع المنتج من أن يكون مكوناً لنفسه
ALTER TABLE public.product_kit_items
ADD CONSTRAINT no_self_kit CHECK (kit_product_id != component_product_id);
```

---

#### 2.3.3 نقص حقول تتبع الوقت

```sql
-- ⚠️ بعض الجداول ليس لديها updated_at
CREATE TABLE public.expense_categories (
  id uuid NOT NULL,
  company_id uuid NOT NULL,
  name text NOT NULL,
  ...
  -- لا يوجد updated_at
);
```

**الحل:**
```sql
-- إضافة updated_at لجميع الجداول
ALTER TABLE public.expense_categories
ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- إنشاء trigger للتحديث التلقائي
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expense_categories_updated
  BEFORE UPDATE ON expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

### 2.4 مشاكل منخفضة (LOW)

#### 2.4.1 عدم توحيد التسمية

| الجدول | العمود | التسمية |
|--------|-------|---------|
| products | created_at | camelCase ✅ |
| accounts | created_at | camelCase ✅ |
| some tables | updated_at | غير موجود ❌ |

---

#### 2.4.2 عدم وجود تعليقات للجداول

```sql
-- ❌ لا توجد تعليقات توضيحية
CREATE TABLE public.invoices (
  ...
);
```

**الحل:**
```sql
COMMENT ON TABLE public.invoices IS 'جدول الفواتير - يدعم المبيعات والمشتريات والمرتجعات';
COMMENT ON TABLE public.journal_entries IS 'جدول القيود المحاسبية';
COMMENT ON COLUMN public.invoices.total_amount IS 'المبلغ الإجمالي شامل الضريبة والخصم';
```

---

## 3. التناقضات في العلاقات

### 3.1 مشاكل العلاقات المفقودة

```sql
-- ❌ لا توجد علاقة بين inventory_transactions و invoices
CREATE TABLE public.inventory_transactions (
  reference_type text,      -- string فقط بدون relation
  reference_id uuid,        -- بدون foreign key
  ...
);

-- ✅ يجب أن يكون:
reference_type TEXT CHECK (reference_type IN ('invoice', 'purchase', 'return', 'transfer')),
reference_id uuid REFERENCES invoices(id),
```

---

### 3.2 مشاكل الـ Foreign Keys

#### 3.2.1 payments - Account

```sql
-- ⚠️ العلاقة صحيحة
CONSTRAINT payments_account_id_fkey FOREIGN KEY (account_id) 
  REFERENCES public.accounts(id)
```

#### 3.2.2 invoices - Currency

```sql
-- ⚠️ المشكلة: قد لا تكون هناك عملات مسجلة
CONSTRAINT invoices_currency_code_fkey FOREIGN KEY (currency_code) 
  REFERENCES public.supported_currencies(code)
```

**التأثير:** خطأ إذا لم تكن العملة مسجلة مسبقاً

**الحل:** استخدام DEFAULT أو تعديل FK

---

## 4. البيانات المكررة

### 4.1 product_stock vs inventory_transactions

```sql
-- ⚠️ تكرار في تخزين المخزون:

-- 1. جدول product_stock (الرصيد الحالي)
CREATE TABLE public.product_stock (
  product_id uuid,
  warehouse_id uuid,
  quantity numeric,
  ...
);

-- 2. جدول inventory_transactions (الحركات)
CREATE TABLE public.inventory_transactions (
  product_id uuid,
  warehouse_id uuid,
  quantity numeric,
  transaction_type text,
  ...
);
```

**التأثير:**
- ازدواجية البيانات
- إمكانية عدم التطابق
- صعوبة التحديث

**الحل:** يمكن حذف product_stock واستخدام VIEW:

```sql
-- إنشاء view للرصيد الحالي
CREATE VIEW current_stock AS
SELECT 
  product_id,
  warehouse_id,
  SUM(CASE 
    WHEN transaction_type IN ('purchase', 'return_purchase', 'transfer_in', 'adj_in', 'initial') 
    THEN quantity 
    WHEN transaction_type IN ('sale', 'return_sale', 'transfer_out', 'adj_out') 
    THEN -quantity 
    ELSE 0 
  END) AS quantity
FROM inventory_transactions
GROUP BY product_id, warehouse_id;
```

---

### 4.2 expense_categories - مكررة في expenses

```sql
-- في جدول expenses يوجد:
category_id uuid REFERENCES expense_categories(id)

-- لكن يمكن تخزين category_name مباشرة:
expense_categories (
  name text,  -- اسم التصنيف
  ...
)

expenses (
  category_id uuid,  --_relation
  -- أو يمكن:
  category_name text  -- تخزين مباشر
)
```

---

## 5. النواقص

### 5.1 نقص جدول للسندات (Bonds)

```sql
-- ⚠️ الجدول غير موجود في المخطط
-- يجب أن يوجد:
CREATE TABLE public.bonds (
  id uuid PRIMARY KEY,
  company_id uuid REFERENCES companies(id),
  bond_type text CHECK (bond_type IN ('receipt', 'disbursement')),
  amount numeric NOT NULL,
  currency_code text REFERENCES supported_currencies(code),
  date date NOT NULL,
  party_id uuid REFERENCES parties(id),
  status text DEFAULT 'posted',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp DEFAULT now()
);
```

---

### 5.2 نقص جدول للحسابات الدفترية (Subledger)

```sql
-- ⚠️ غير موجود: جدول للحسابات الدفترية
-- يجب إضافة:
CREATE TABLE public.subledger_entries (
  id uuid PRIMARY KEY,
  company_id uuid REFERENCES companies(id),
  account_id uuid REFERENCES accounts(id),
  party_id uuid REFERENCES parties(id),
  invoice_id uuid REFERENCES invoices(id),
  entry_date date NOT NULL,
  description text,
  debit_amount numeric,
  credit_amount numeric,
  created_at timestamp DEFAULT now()
);
```

---

### 5.3 نقص جدول لسجلات الضرائب

```sql
-- ⚠️ غير موجود: جدول للضرائب
-- يجب إضافة:
CREATE TABLE public.tax_records (
  id uuid PRIMARY KEY,
  company_id uuid REFERENCES companies(id),
  invoice_id uuid REFERENCES invoices(id),
  tax_type text CHECK (tax_type IN ('vat', 'excise', 'withholding')),
  taxable_amount numeric NOT NULL,
  tax_amount numeric NOT NULL,
  tax_rate numeric NOT NULL,
  created_at timestamp DEFAULT now()
);
```

---

## 6. المقارنة مع خطة الإصلاح

### 6.1 نتائج الفحص السابقة

| المشكلة | الحالة في المخطط |
|--------|-----------------|
| Atomic Transactions | ⚠️ جزئي - RPC موجود لكن يحتاج تحسين |
| Optimistic Locking | ❌ غير موجود |
| Border Radius | ❌ (مشكلة UI وليست DB) |
| Colors Variables | ❌ (مشكلة UI وليست DB) |

### 6.2 إضافات مطلوبة للمخطط

| الإصلاح | الأولوية |
|---------|---------|
| إضافة UNIQUE على invoice_number | قصوى |
| إضافة UNIQUE على account code | قصوى |
| إضافة sequence للـ entry_number | قصوى |
| إضافة party_id للaccounts | عالية |
| إضافة علاقات لـ inventory_transactions | عالية |
| إضافة سجلات الضرائب | متوسطة |
| إضافة جدول Bonds | متوسطة |

---

## 7. ملخص المشاكل

| المستوى | العدد | النسبة |
|--------|------|-------|
| حرج | 3 | 8% |
| عالي | 3 | 8% |
| متوسط | 7 | 19% |
| منخفض | 4 | 11% |
| **الإجمالي** | **17** | **47%** |

---

## 8. التوصيات

### 8.1 إصلاحات فورية

```sql
-- 1. إضافة UNIQUE على invoice_number
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);

-- 2. إضافة UNIQUE على account code + company
ALTER TABLE public.accounts
ADD CONSTRAINT accounts_company_code_unique UNIQUE (company_id, code);

-- 3. إنشاء sequence للقيود
CREATE SEQUENCE journal_entry_number_seq;
```

### 8.2 إصلاحات أسبوع

```sql
-- 4. إضافة party_id للaccounts
ALTER TABLE public.accounts
ADD COLUMN party_id uuid REFERENCES public.parties(id);

-- 5. إضافة علاقات لـ inventory_transactions
ALTER TABLE public.inventory_transactions
ADD CONSTRAINT inv_trans_invoice_fk 
  FOREIGN KEY (reference_id) 
  REFERENCES invoices(id)
  ON DELETE SET NULL;
```

### 8.3 إصلاحات شهر

```sql
-- 6. إضافة جدول Bonds
CREATE TABLE public.bonds (...);

-- 7. إضافة جدول Tax Records
CREATE TABLE public.tax_records (...);

-- 8. إضافة تحديث تلقائي لـ updated_at
-- (تشغيل على جميع الجداول)
```

---

## 9. ملخص جدول المشاكل

| # | المشكلة | الجدول | الخطورة | الإصلاح |
|---|--------|-------|---------|--------|
| 1 | عدم UNIQUE على invoice_number | invoices | حرج | ADD CONSTRAINT |
| 2 | عدم UNIQUE على account code | accounts | حرج | ADD CONSTRAINT |
| 3 | entry_number يدوي | journal_entries | حرج | CREATE SEQUENCE |
| 4 | عدم وجود party_id | accounts | عالي | ADD COLUMN |
| 5 | balance غير دقيق | parties | عالي | CREATE VIEW |
| 6 | علاقات مفقودة | inventory_transactions | عالي | ADD FK |
| 7 | تكرار المخزون | product_stock | متوسط | CREATE VIEW |
| 8 | عدم تحديث updated_at | عدة جداول | متوسط | CREATE TRIGGER |
| 9 | تعليقات مفقودة | جميع الجداول | منخفض | ADD COMMENT |

---

*نهاية تقرير فحص المخطط*
