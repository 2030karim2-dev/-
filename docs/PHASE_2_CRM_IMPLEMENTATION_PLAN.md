# خطة المرحلة الثانية: نظام CRM المتكامل

## 🎯 نظرة عامة
**المدة:** 6-8 أسابيع  
**الهدف:** بناء نظام CRM متكامل يتضمن إدارة الفرص البيعية، الأنشطة، الشكاوى، والحملات التسويقية  
**الفريق:** 2-3 مطورين

---

## 📋 هيكل قاعدة البيانات (Supabase)

### الجداول الرئيسية:

```sql
-- ============================================
-- 1. الفرص البيعية (Opportunities)
-- ============================================
CREATE TABLE crm_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES parties(id) ON DELETE CASCADE,
    
    -- معلومات الفرصة
    title TEXT NOT NULL,
    description TEXT,
    value DECIMAL(15,2),
    currency TEXT DEFAULT 'SAR',
    
    -- مراحل خط الأنابيب
    stage TEXT NOT NULL CHECK (stage IN (
        'lead',           -- عميل محتمل
        'qualified',      -- مؤهل
        'proposal',       -- عرض سعر
        'negotiation',    -- تفاوض
        'closed_won',     -- تم الإغلاق (نجاح)
        'closed_lost'     -- تم الإغلاق (فشل)
    )) DEFAULT 'lead',
    
    -- احتمالية الإغلاق (0-100)
    probability INTEGER CHECK (probability BETWEEN 0 AND 100),
    
    -- التواريخ
    expected_close_date DATE,
    actual_close_date DATE,
    
    -- المصدر والتسويق
    source TEXT, -- مصدر الفرصة (تسويق، توصية، ...)
    campaign_id UUID REFERENCES crm_campaigns(id),
    
    -- المسؤول والإنشاء
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- سبب الخسارة (إذا كانت خسارة)
    loss_reason TEXT,
    loss_notes TEXT,
    
    -- التكامل مع AI
    ai_score DECIMAL(3,2), -- AI score for likelihood of closing
    ai_recommendations TEXT
);

-- Indexes
CREATE INDEX idx_crm_opportunities_company ON crm_opportunities(company_id);
CREATE INDEX idx_crm_opportunities_customer ON crm_opportunities(customer_id);
CREATE INDEX idx_crm_opportunities_stage ON crm_opportunities(stage);
CREATE INDEX idx_crm_opportunities_assigned ON crm_opportunities(assigned_to);

-- ============================================
-- 2. الأنشطة والتواصل (Activities)
-- ============================================
CREATE TABLE crm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- الارتباط (فرصة أو عميل مباشرة)
    opportunity_id UUID REFERENCES crm_opportunities(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES parties(id) ON DELETE CASCADE,
    
    -- نوع النشاط
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'call',      -- مكالمة
        'email',     -- بريد
        'meeting',   -- اجتماع
        'visit',     -- زيارة
        'task',      -- مهمة
        'note',      -- ملاحظة
        'follow_up'  -- متابعة
    )),
    
    -- المحتوى
    subject TEXT NOT NULL,
    description TEXT,
    
    -- الحالة والجدولة
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',
        'completed',
        'cancelled',
        'overdue'
    )),
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- الأولوية
    priority TEXT DEFAULT 'medium' CHECK (priority IN (
        'low', 'medium', 'high', 'urgent'
    )),
    
    -- المدة والنتيجة
    duration_minutes INTEGER,
    outcome TEXT,
    
    -- المسؤول
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_activities_opportunity ON crm_activities(opportunity_id);
CREATE INDEX idx_crm_activities_customer ON crm_activities(customer_id);
CREATE INDEX idx_crm_activities_scheduled ON crm_activities(scheduled_at);
CREATE INDEX idx_crm_activities_status ON crm_activities(status);

-- ============================================
-- 3. الشكاوى والتذاكر (Tickets/Support)
-- ============================================
CREATE TABLE crm_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES parties(id) ON DELETE CASCADE,
    
    -- رقم التذكرة (تلقائي)
    ticket_number TEXT UNIQUE,
    
    -- المحتوى
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- التصنيف والأولوية
    category TEXT, -- فئة الشكوى
    priority TEXT DEFAULT 'medium' CHECK (priority IN (
        'low', 'medium', 'high', 'urgent'
    )),
    
    -- الحالة
    status TEXT DEFAULT 'open' CHECK (status IN (
        'open',           -- مفتوحة
        'in_progress',    -- قيد المعالجة
        'waiting',        -- في الانتظار
        'resolved',       -- تم الحل
        'closed'          -- مغلقة
    )),
    
    -- الموظفين
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    
    -- التواريخ
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    
    -- SLA
    sla_deadline TIMESTAMPTZ,
    sla_breached BOOLEAN DEFAULT FALSE,
    
    -- التقييم
    satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
    satisfaction_comment TEXT,
    
    -- وقت الحل
    resolution_time_minutes INTEGER
);

CREATE INDEX idx_crm_tickets_company ON crm_tickets(company_id);
CREATE INDEX idx_crm_tickets_customer ON crm_tickets(customer_id);
CREATE INDEX idx_crm_tickets_status ON crm_tickets(status);
CREATE INDEX idx_crm_tickets_assigned ON crm_tickets(assigned_to);

-- ============================================
-- 4. ردود التذاكر (Ticket Replies)
-- ============================================
CREATE TABLE crm_ticket_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES crm_tickets(id) ON DELETE CASCADE,
    reply_text TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- رد داخلي (لا يراه العميل)
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_ticket_replies_ticket ON crm_ticket_replies(ticket_id);

-- ============================================
-- 5. الحملات التسويقية (Campaigns)
-- ============================================
CREATE TABLE crm_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- المعلومات الأساسية
    name TEXT NOT NULL,
    description TEXT,
    
    -- النوع والحالة
    type TEXT CHECK (type IN (
        'email',      -- بريد
        'sms',        -- رسائل
        'social',     -- تواصل اجتماعي
        'event',      -- فعالية
        'other'       -- أخرى
    )),
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft',      -- مسودة
        'scheduled',  -- مجدولة
        'running',    -- قيد التشغيل
        'paused',     -- متوقفة
        'completed',  -- منتهية
        'cancelled'   -- ملغاة
    )),
    
    -- التواريخ
    start_date DATE,
    end_date DATE,
    
    -- الميزانية
    budget DECIMAL(15,2),
    currency TEXT DEFAULT 'SAR',
    
    -- الجمهور المستهدف
    target_audience JSONB,
    
    -- الإحصائيات
    metrics JSONB DEFAULT '{}',
    -- {
    --   "sent": 1000,
    --   "opened": 300,
    --   "clicked": 100,
    --   "converted": 10
    -- }
    
    -- المسؤول
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_campaigns_company ON crm_campaigns(company_id);
CREATE INDEX idx_crm_campaigns_status ON crm_campaigns(status);

-- ============================================
-- 6. قوالب الرسائل (Message Templates)
-- ============================================
CREATE TABLE crm_message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    
    -- النوع
    type TEXT CHECK (type IN ('email', 'sms', 'whatsapp')),
    
    -- متغيرات القالب
    variables JSONB DEFAULT '[]',
    -- ["customer_name", "company_name", "offer_details"]
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. إعدادات خط الأنابيب (Pipeline Settings)
-- ============================================
CREATE TABLE crm_pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    
    -- احتمالية الإغلاق الافتراضية لهذه المرحلة
    default_probability INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Functions and Triggers
-- ============================================

-- Function to auto-generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
    year_text TEXT;
    sequence_number INTEGER;
    new_ticket_number TEXT;
BEGIN
    year_text := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Get the count of tickets this year for this company
    SELECT COUNT(*) + 1 INTO sequence_number
    FROM crm_tickets
    WHERE company_id = NEW.company_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    new_ticket_number := 'TKT-' || year_text || '-' || LPAD(sequence_number::TEXT, 5, '0');
    
    NEW.ticket_number := new_ticket_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_ticket_number
BEFORE INSERT ON crm_tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_number();

-- Function to update opportunity probability based on stage
CREATE OR REPLACE FUNCTION update_opportunity_probability()
RETURNS TRIGGER AS $$
BEGIN
    -- Update probability based on stage if not manually set
    IF TG_OP = 'INSERT' OR NEW.probability IS NULL OR OLD.stage != NEW.stage THEN
        NEW.probability := CASE NEW.stage
            WHEN 'lead' THEN 10
            WHEN 'qualified' THEN 25
            WHEN 'proposal' THEN 50
            WHEN 'negotiation' THEN 75
            WHEN 'closed_won' THEN 100
            WHEN 'closed_lost' THEN 0
            ELSE COALESCE(NEW.probability, 10)
        END;
    END IF;
    
    -- Update actual_close_date when closed
    IF NEW.stage IN ('closed_won', 'closed_lost') AND OLD.stage NOT IN ('closed_won', 'closed_lost') THEN
        NEW.actual_close_date := CURRENT_DATE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_opportunity_probability
BEFORE INSERT OR UPDATE ON crm_opportunities
FOR EACH ROW
EXECUTE FUNCTION update_opportunity_probability();

-- ============================================
-- RPC Functions for Analytics
-- ============================================

-- Get sales pipeline stats
CREATE OR REPLACE FUNCTION get_pipeline_stats(p_company_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalOpportunities', COUNT(*),
        'totalValue', COALESCE(SUM(value), 0),
        'byStage', json_object_agg(
            stage,
            json_build_object(
                'count', cnt,
                'value', val
            )
        )
    )
    INTO result
    FROM (
        SELECT 
            stage,
            COUNT(*) as cnt,
            COALESCE(SUM(value), 0) as val
        FROM crm_opportunities
        WHERE company_id = p_company_id
        AND stage NOT IN ('closed_won', 'closed_lost')
        GROUP BY stage
    ) subquery;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get CRM dashboard stats
CREATE OR REPLACE FUNCTION get_crm_dashboard_stats(p_company_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'opportunities', (
            SELECT json_build_object(
                'total', COUNT(*),
                'thisMonth', COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)),
                'wonThisMonth', COUNT(*) FILTER (WHERE stage = 'closed_won' AND actual_close_date >= DATE_TRUNC('month', CURRENT_DATE)),
                'totalValue', COALESCE(SUM(value) FILTER (WHERE stage NOT IN ('closed_won', 'closed_lost')), 0)
            )
            FROM crm_opportunities
            WHERE company_id = p_company_id
        ),
        'activities', (
            SELECT json_build_object(
                'today', COUNT(*) FILTER (WHERE scheduled_at::date = CURRENT_DATE),
                'overdue', COUNT(*) FILTER (WHERE scheduled_at < NOW() AND status = 'pending'),
                'upcoming', COUNT(*) FILTER (WHERE scheduled_at > NOW() AND scheduled_at < NOW() + INTERVAL '7 days')
            )
            FROM crm_activities
            WHERE company_id = p_company_id
        ),
        'tickets', (
            SELECT json_build_object(
                'open', COUNT(*) FILTER (WHERE status IN ('open', 'in_progress')),
                'resolvedToday', COUNT(*) FILTER (WHERE status = 'resolved' AND resolved_at::date = CURRENT_DATE)
            )
            FROM crm_tickets
            WHERE company_id = p_company_id
        )
    )
    INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_pipeline_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (example for opportunities)
CREATE POLICY "crm_opportunities_select" ON crm_opportunities
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "crm_opportunities_insert" ON crm_opportunities
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "crm_opportunities_update" ON crm_opportunities
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
    ));
```

---

## 📁 هيكل الملفات

```
src/features/crm/
├── index.ts
├── types/
│   └── index.ts          # أنواع CRM
├── api/
│   ├── opportunitiesApi.ts
│   ├── activitiesApi.ts
│   ├── ticketsApi.ts
│   └── campaignsApi.ts
├── hooks/
│   ├── useOpportunities.ts
│   ├── useActivities.ts
│   ├── useTickets.ts
│   └── useCRMDashboard.ts
├── components/
│   ├── opportunities/
│   │   ├── OpportunitiesPipeline.tsx
│   │   ├── OpportunityCard.tsx
│   │   ├── OpportunityModal.tsx
│   │   └── OpportunityDetails.tsx
│   ├── activities/
│   │   ├── ActivitiesList.tsx
│   │   ├── ActivityCalendar.tsx
│   │   └── ActivityModal.tsx
│   ├── tickets/
│   │   ├── TicketsList.tsx
│   │   ├── TicketDetails.tsx
│   │   └── TicketReply.tsx
│   └── dashboard/
│       ├── CRMDashboard.tsx
│       ├── PipelineChart.tsx
│       └── ActivityStats.tsx
└── pages/
    └── CRMPage.tsx
```

---

## 🗓️ خطة التنفيذ (6 أسابيع)

### الأسبوع 1: الأساسيات
- [ ] إنشاء SQL migration
- [ ] إنشاء Types
- [ ] إنشاء APIs الأساسية
- [ ] إعداد هيكل الملفات

### الأسبوع 2-3: الفرص البيعية
- [ ] قائمة الفرص
- [ ] خط الأنابيب (Pipeline) المرئي
- [ ] إضافة/تعديل الفرص
- [ ] سحب وإفلات بين المراحل
- [ ] تفاصيل الفرصة الكاملة

### الأسبوع 3-4: الأنشطة
- [ ] تقويم الأنشطة
- [ ] قائمة الأنشطة
- [ ] إضافة أنشطة
- [ ] التذكيرات والإشعارات
- [ ] التكامل مع العملاء

### الأسبوع 4-5: التذاكر والشكاوى
- [ ] قائمة التذاكر
- [ ] إنشاء تذكرة
- [ ] ردود التذاكر
- [ ] SLA ومتوسط وقت الحل

### الأسبوع 5-6: الحملات والتقارير
- [ ] إدارة الحملات
- [ ] قوالب الرسائل
- [ ] لوحة تحكم CRM
- [ ] التقارير والإحصائيات

### الأسبوع 6-8: التكامل والاختبار
- [ ] تكامل مع نظام العملاء
- [ ] تكامل مع المبيعات
- [ ] تكامل مع AI
- [ ] الاختبار والإصلاحات

---

## 🔗 نقاط التكامل

### مع الوحدات الحالية:
```
CRM ←→ العملاء (الأطراف)
  - إنشاء فرصة من صفحة العميل
  - عرض تاريخ العميل

CRM ←→ المبيعات
  - تحويل الفرصة إلى فاتورة
  - تحديث قيمة الفرصة

CRM ←→ الإشعارات
  - تذكير بالأنشطة
  - تنبيهات التذاكر

CRM ←→ الذكاء الاصطناعي
  - توقع احتمالية إغلاق الفرصة
  - اقتراح أفضل وقت للاتصال
  - تصنيف أولوية التذاكر تلقائياً
```

---

## 🧠 تكامل الذكاء الاصطناعي

### 1. توقع إغلاق الفرص (Opportunity Scoring)
```typescript
// AI يحلل:
// - تاريخ العميل
// - نوع الفرصة
// - المرحلة الحالية
// - الأنشطة السابقة
// ويعطي score من 0-100
```

### 2. أفضل وقت للاتصال
```typescript
// AI يحلل:
// - ساعات عمل العميل
// - ردود العميل السابقة
// - أيام الأسبوع
```

### 3. تصنيف أولوية التذاكر
```typescript
// AI يقرأ محتوى التذكرة ويحدد:
// - مستوى الأولوية (عالي/منخفض)
// - فئة المشكلة
// - القسم المسؤول
```

---

## 📊 معايير النجاح

- [ ] إنشاء فرصة بيعية جديدة
- [ ] نقل الفرصة عبر خط الأنابيب
- [ ] إضافة أنشطة وملاحظات
- [ ] إنشاء تذكرة دعم فني
- [ ] إغلاق التذكرة مع تقييم
- [ ] إنشاء حملة تسويقية
- [ ] عرض لوحة التحكم مع الإحصائيات
- [ ] التكامل الكامل مع العملاء

---

**الخطة جاهزة للتنفيذ! 🚀**