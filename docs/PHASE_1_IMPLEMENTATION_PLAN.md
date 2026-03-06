# خطة المرحلة الأولى: استكمال النظام الحالي

## 🎯 نظرة عامة
**المدة:** 4 أسابيع (شهر 1)  
**الهدف:** تطوير نظام الأطراف (العملاء والموردين) بشكل متكامل  
**الفريق:** 2 مطورين React + مطور Backend

---

## 📋 الأسبوع 1-2: تطوير نظام العملاء

### اليوم 1-2: تصميم قاعدة البيانات

#### جداول Supabase المطلوبة:

```sql
-- جدول أنشطة العملاء
CREATE TABLE customer_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES parties(id) ON DELETE CASCADE,
    activity_type TEXT CHECK (activity_type IN (
        'call', 'email', 'meeting', 'visit', 'note', 'task', 
        'invoice_created', 'payment_received', 'complaint', 'follow_up'
    )),
    subject TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'overdue')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES auth.users(id),
    outcome TEXT,
    duration_minutes INTEGER,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_activities_customer_id ON customer_activities(customer_id);
CREATE INDEX idx_customer_activities_company_id ON customer_activities(company_id);
CREATE INDEX idx_customer_activities_scheduled ON customer_activities(scheduled_at);

-- جدول الملاحظات على العملاء
CREATE TABLE customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES parties(id) ON DELETE CASCADE,
    note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'complaint', 'feedback', 'preference', 'warning')),
    content TEXT NOT NULL,
    is_important BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول العلامات (Tags) للعملاء
CREATE TABLE customer_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- ربط العلامات بالعملاء
CREATE TABLE customer_tag_assignments (
    customer_id UUID REFERENCES parties(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES customer_tags(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (customer_id, tag_id)
);

-- تحديث جدول الأطراف لإضافة حقول العملاء
ALTER TABLE parties ADD COLUMN IF NOT EXISTS 
    customer_type TEXT DEFAULT 'individual' CHECK (customer_type IN ('individual', 'company', 'government')),
    lead_source TEXT,
    birth_date DATE,
    preferred_contact_method TEXT DEFAULT 'phone' CHECK (preferred_contact_method IN ('phone', 'email', 'whatsapp')),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 0, -- أيام
    total_invoices_count INTEGER DEFAULT 0,
    total_paid_amount DECIMAL(15,2) DEFAULT 0,
    last_contact_date TIMESTAMPTZ,
    last_invoice_date TIMESTAMPTZ,
    customer_since DATE DEFAULT CURRENT_DATE,
    loyalty_points INTEGER DEFAULT 0,
    satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5);

-- Function لتحديث إحصائيات العميل
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE parties 
    SET 
        total_invoices_count = (
            SELECT COUNT(*) FROM invoices WHERE party_id = NEW.party_id AND type = 'sale'
        ),
        total_paid_amount = (
            SELECT COALESCE(SUM(amount), 0) FROM bonds 
            WHERE party_id = NEW.party_id AND type = 'receipt'
        ),
        last_invoice_date = (
            SELECT MAX(created_at) FROM invoices WHERE party_id = NEW.party_id
        ),
        updated_at = NOW()
    WHERE id = NEW.party_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_customer_stats_invoice
AFTER INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_customer_stats();
```

### اليوم 3-5: إنشاء Types و API

#### ملفات TypeScript الجديدة:

**`src/features/parties/types/enhanced.ts`**
```typescript
export interface CustomerActivity {
  id: string;
  customerId: string;
  activityType: 'call' | 'email' | 'meeting' | 'visit' | 'note' | 'task' | 
                  'invoice_created' | 'payment_received' | 'complaint' | 'follow_up';
  subject: string;
  description?: string;
  scheduledAt?: string;
  completedAt?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  outcome?: string;
  durationMinutes?: number;
  createdBy: string;
  createdAt: string;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  noteType: 'general' | 'complaint' | 'feedback' | 'preference' | 'warning';
  content: string;
  isImportant: boolean;
  createdBy: string;
  createdAt: string;
}

export interface CustomerTag {
  id: string;
  companyId: string;
  name: string;
  color: string;
  assignedCount?: number;
}

export interface EnhancedParty extends Party {
  customerType?: 'individual' | 'company' | 'government';
  leadSource?: string;
  birthDate?: string;
  preferredContactMethod?: 'phone' | 'email' | 'whatsapp';
  creditLimit?: number;
  paymentTerms?: number;
  totalInvoicesCount?: number;
  totalPaidAmount?: number;
  lastContactDate?: string;
  lastInvoiceDate?: string;
  customerSince?: string;
  loyaltyPoints?: number;
  satisfactionScore?: number;
  tags?: CustomerTag[];
  activities?: CustomerActivity[];
  notes?: CustomerNote[];
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newThisMonth: number;
  avgInvoicesPerCustomer: number;
  totalOutstanding: number;
  topCustomersByRevenue: Array<{
    id: string;
    name: string;
    totalRevenue: number;
    invoiceCount: number;
  }>;
}
```

**`src/features/parties/api/customerApi.ts`**
```typescript
import { supabase } from '@/core/lib/supabase';
import type { CustomerActivity, CustomerNote, CustomerTag, EnhancedParty } from '../types/enhanced';

export const customerApi = {
  // الأنشطة
  async getCustomerActivities(customerId: string): Promise<CustomerActivity[]> {
    const { data, error } = await supabase
      .from('customer_activities')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createActivity(activity: Omit<CustomerActivity, 'id' | 'createdAt'>): Promise<CustomerActivity> {
    const { data, error } = await supabase
      .from('customer_activities')
      .insert(activity)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async completeActivity(activityId: string, outcome?: string): Promise<void> {
    const { error } = await supabase
      .from('customer_activities')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString(),
        outcome 
      })
      .eq('id', activityId);
    
    if (error) throw error;
  },

  // الملاحظات
  async getCustomerNotes(customerId: string): Promise<CustomerNote[]> {
    const { data, error } = await supabase
      .from('customer_notes')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async addNote(note: Omit<CustomerNote, 'id' | 'createdAt'>): Promise<CustomerNote> {
    const { data, error } = await supabase
      .from('customer_notes')
      .insert(note)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // العلامات
  async getCompanyTags(companyId: string): Promise<CustomerTag[]> {
    const { data, error } = await supabase
      .from('customer_tags')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async assignTag(customerId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from('customer_tag_assignments')
      .insert({ customer_id: customerId, tag_id: tagId });
    
    if (error) throw error;
  },

  // الإحصائيات
  async getCustomerStats(companyId: string): Promise<CustomerStats> {
    const { data, error } = await supabase
      .rpc('get_customer_stats', { p_company_id: companyId });
    
    if (error) throw error;
    return data;
  }
};
```

### اليوم 6-8: إنشاء المكونات الجديدة

#### مكونات React المطلوبة:

**`src/features/parties/components/CustomerTimeline.tsx`**
- عرض خط زمني لأنشطة العميل
- تصفية حسب نوع النشاط
- إضافة نشاط جديد

**`src/features/parties/components/CustomerActivities.tsx`**
```typescript
// الميزات:
// - قائمة الأنشطة مع الفلترة
// - إضافة نشاط جديد (مكالمة، اجتماع، ملاحظة)
// - تحديد النشاط كمكتمل
// - تقويم الأنشطة المجدولة
```

**`src/features/parties/components/CustomerNotes.tsx`**
```typescript
// الميزات:
// - عرض الملاحظات مع أنواع مختلفة
// - إضافة ملاحظة سريعة
// - تحديد ملاحظات مهمة
```

**`src/features/parties/components/CustomerTags.tsx`**
```typescript
// الميزات:
// - إدارة العلامات (إضافة، تعديل، حذف)
// - ربط العلامات بالعملاء
// - تصفية العملاء حسب العلامة
```

**`src/features/parties/components/CustomerDetailView.tsx`**
```typescript
// المكون الرئيسي يجمع:
// - بيانات العميل الأساسية
// - خط زمني للأنشطة
// - الملاحظات
// - الإحصائيات
// - الفواتير
// - كشف الحساب
```

### اليوم 9-10: تطوير hooks و state management

**`src/features/parties/hooks/useCustomerDetails.ts`**
```typescript
export const useCustomerDetails = (customerId: string) => {
  const queryClient = useQueryClient();
  
  // بيانات العميل
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => partiesApi.getById(customerId)
  });

  // الأنشطة
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['customer-activities', customerId],
    queryFn: () => customerApi.getCustomerActivities(customerId)
  });

  // الملاحظات
  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ['customer-notes', customerId],
    queryFn: () => customerApi.getCustomerNotes(customerId)
  });

  // mutation لإضافة نشاط
  const addActivityMutation = useMutation({
    mutationFn: customerApi.createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries(['customer-activities', customerId]);
    }
  });

  return {
    customer,
    activities,
    notes,
    isLoading: customerLoading || activitiesLoading || notesLoading,
    addActivity: addActivityMutation.mutateAsync
  };
};
```

---

## 📋 الأسبوع 3-4: تطوير نظام الموردين

### اليوم 11-13: تصميم قاعدة البيانات للموردين

```sql
-- تقييمات الموردين
CREATE TABLE supplier_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES parties(id) ON DELETE CASCADE,
    rated_by UUID REFERENCES auth.users(id),
    rating_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- معايير التقييم (1-5)
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    delivery_rating INTEGER CHECK (delivery_rating BETWEEN 1 AND 5),
    price_rating INTEGER CHECK (price_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تاريخ أسعار الموردين
CREATE TABLE supplier_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES parties(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    unit_price DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'SAR',
    effective_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- مقارنة أسعار الموردين
CREATE VIEW supplier_price_comparison AS
SELECT 
    product_id,
    supplier_id,
    unit_price,
    currency,
    effective_date,
    ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY unit_price ASC) as price_rank
FROM supplier_price_history
WHERE effective_date = (
    SELECT MAX(effective_date) 
    FROM supplier_price_history sph 
    WHERE sph.product_id = supplier_price_history.product_id 
    AND sph.supplier_id = supplier_price_history.supplier_id
);

-- تحديث جدول الأطراف لإضافة حقول الموردين
ALTER TABLE parties ADD COLUMN IF NOT EXISTS
    supplier_type TEXT DEFAULT 'local' CHECK (supplier_type IN ('local', 'import', 'manufacturer', 'distributor')),
    tax_number TEXT,
    commercial_registration TEXT,
    payment_terms_days INTEGER DEFAULT 30,
    min_order_amount DECIMAL(15,2) DEFAULT 0,
    delivery_lead_days INTEGER DEFAULT 7,
    is_active_supplier BOOLEAN DEFAULT TRUE,
    avg_rating DECIMAL(3,2),
    total_orders_count INTEGER DEFAULT 0,
    total_purchases_amount DECIMAL(15,2) DEFAULT 0,
    last_purchase_date TIMESTAMPTZ,
    preferred_products UUID[];

-- Function لحساب متوسط تقييم المورد
CREATE OR REPLACE FUNCTION calculate_supplier_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE parties 
    SET avg_rating = (
        SELECT AVG(overall_rating)::DECIMAL(3,2)
        FROM supplier_ratings 
        WHERE supplier_id = NEW.supplier_id
    )
    WHERE id = NEW.supplier_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supplier_rating
AFTER INSERT OR UPDATE ON supplier_ratings
FOR EACH ROW
EXECUTE FUNCTION calculate_supplier_rating();
```

### اليوم 14-16: إنشاء API ومكونات الموردين

**`src/features/parties/api/supplierApi.ts`**
```typescript
export const supplierApi = {
  // التقييمات
  async getSupplierRatings(supplierId: string): Promise<SupplierRating[]> {
    const { data, error } = await supabase
      .from('supplier_ratings')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('rating_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async addRating(rating: Omit<SupplierRating, 'id' | 'ratingDate'>): Promise<SupplierRating> {
    const { data, error } = await supabase
      .from('supplier_ratings')
      .insert(rating)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // تاريخ الأسعار
  async getPriceHistory(supplierId: string, productId?: string): Promise<PriceHistory[]> {
    let query = supabase
      .from('supplier_price_history')
      .select('*, products(name)')
      .eq('supplier_id', supplierId);
    
    if (productId) {
      query = query.eq('product_id', productId);
    }
    
    const { data, error } = await query.order('effective_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // مقارنة الأسعار
  async getPriceComparison(productIds: string[]): Promise<PriceComparison[]> {
    const { data, error } = await supabase
      .from('supplier_price_comparison')
      .select('*')
      .in('product_id', productIds);
    
    if (error) throw error;
    return data || [];
  }
};
```

### اليوم 17-20: المكونات وإكمال التكامل

#### المكونات المطلوبة:

**`src/features/parties/components/SupplierRatings.tsx`**
- عرض التقييمات مع الرسوم البيانية
- إضافة تقييم جديد
- معايير متعددة (جودة، توصيل، سعر، تواصل)

**`src/features/parties/components/SupplierPriceHistory.tsx`**
- عرض تاريخ الأسعار
- رسم بياني لتطور الأسعار
- مقارنة بين الموردين

**`src/features/parties/components/SupplierComparison.tsx`**
- مقارنة جانبية بين موردين أو أكثر
- جدول مقارنة الأسعار
- تقييمات مجمعة

**`src/features/parties/components/SupplierPerformance.tsx`**
- إحصائيات الأداء
- عدد الطلبات والقيمة
- متوسط وقت التسليم
- الرسم البياني للأداء

---

## 🔗 نقاط التكامل مع الوحدات الحالية

### 1. التكامل مع المبيعات
```typescript
// عند إنشاء فاتورة للعميل
// - إضافة نشاط 'invoice_created' تلقائياً
// - تحديث last_invoice_date
// - إضافة loyalty_points (إذا كان النظام مفعل)
```

### 2. التكامل مع المشتريات
```typescript
// عند إنشاء فاتورة مشتريات
// - إضافة 'purchase_order' نشاط للمورد
// - تحديث last_purchase_date
// - تحديث total_purchases_amount
```

### 3. التكامل مع السندات
```typescript
// عند استلام دفعة من العميل
// - إضافة نشاط 'payment_received'
// - تحديث total_paid_amount
// - إرسال إشعار شكر للعميل
```

### 4. التكامل مع المخزون
```typescript
// عند استلام بضاعة من مورد
// - إضافة نشاط 'delivery_received'
// - تحديث تقييم التوصيل
// - اقتراح تحديث الأسعار
```

---

## 📊 معايير النجاح للمرحلة 1

### ✅ اختبارات القبول:

1. **نظام العملاء:**
   - [ ] إضافة نشاط للعميل بأنواع مختلفة
   - [ ] عرض خط زمني كامل للأنشطة
   - [ ] إضافة وعرض الملاحظات
   - [ ] إدارة العلامات (Tags)
   - [ ] تصفية العملاء حسب العلامة
   - [ ] عرض إحصائيات العملاء

2. **نظام الموردين:**
   - [ ] إضافة تقييم للمورد
   - [ ] عرض تاريخ الأسعار
   - [ ] مقارنة أسعار منتج بين موردين
   - [ ] عرض تقييمات مجمعة
   - [ ] تصنيف الموردين حسب الأداء

3. **التكامل:**
   - [ ] إنشاء فاتورة يضيف نشاطاً تلقائياً
   - [ ] استلام دفعة يحدث بيانات العميل
   - [ ] جميع البيانات متزامنة مع قاعدة البيانات

---

## 🚀 خطوات التنفيذ الفعلية

### للبدء فوراً:

1. **إنشاء ملفات SQL:**
   ```bash
   # إنشاء ملف migrations
   touch supabase/migrations/001_customer_enhancements.sql
   touch supabase/migrations/002_supplier_enhancements.sql
   ```

2. **تنفيذ SQL في Supabase:**
   - نسخ SQL مخصوم الأعلى
   - تنفيذ في Supabase Dashboard

3. **إنشاء هيكل الملفات:**
   ```bash
   mkdir -p src/features/parties/types/enhanced
   mkdir -p src/features/parties/api/enhanced
   mkdir -p src/features/parties/components/customers
   mkdir -p src/features/parties/components/suppliers
   mkdir -p src/features/parties/hooks/enhanced
   ```

4. **تطوير بالترتيب:**
   - اليوم 1-3: SQL + Types
   - اليوم 4-7: APIs + Hooks
   - اليوم 8-14: مكونات العملاء
   - اليوم 15-20: مكونات الموردين
   - اليوم 21-28: تكامل واختبار

---

**الخطة جاهزة للتنفيذ! 🚀**