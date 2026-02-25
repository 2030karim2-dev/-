# خطة تطوير صفحة الإعدادات الكاملة

## نظرة عامة
هذه الخطة توضح الخطوات المطلوبة لإكمال بناء وتطوير صفحة الإعدادات بالكامل.

---

## الحالة الحالية

### الأقسام الموجودة:
| القسم | الحالة | الملف |
|-------|--------|-------|
| الملف الشخصي للمنشأة | ✅ مكتمل | `components/CompanyProfile.tsx` |
| الإعدادات المالية | ✅ مكتمل | `components/financial/FinancialSettings.tsx` |
| إعدادات الأمان | ✅ مكتمل | `components/security/SecuritySettings.tsx` |
| إدارة الصلاحيات | ✅ مكتمل | `components/security/PermissionsManager.tsx` |
| فريق العمل | ✅ مكتمل | `components/security/TeamManager.tsx` |
| الإشعارات | ✅ مكتمل | `components/notifications/NotificationSettings.tsx` |
| المظهر | ✅ مكتمل | `../appearance/AppearancePage.tsx` |
| النسخ الاحتياطي | ✅ مكتمل | `components/backup/BackupPage.tsx` |

### الأنواع المستخرجة:
- `types/invoiceSettings.ts` - إعدادات الفواتير
- `types/inventorySettings.ts` - إعدادات المخزون
- `types/paymentSettings.ts` - إعدادات الدفع
- `types/posSettings.ts` - إعدادات نقطة البيع
- `types/printSettings.ts` - إعدادات الطباعة
- `types/integrationSettings.ts` - إعدادات التكامل
- `types/localizationSettings.ts` - إعدادات اللغة والموقع

---

## المرحلة 1: تحسينات واجهة المستخدم

### 1.1 إضافة أقسام جديدة للإعدادات
**الملفات المطلوب إنشاؤها:**

```
src/features/settings/components/
├── invoice/
│   ├── InvoiceSettings.tsx       # إعدادات الفواتير
│   ├── InvoiceTemplateEditor.tsx # محرر قوالب الفواتير
│   └── InvoiceNumbering.tsx      # ترقيم الفواتير
├── pos/
│   ├── POSSettings.tsx           # إعدادات نقطة البيع
│   └── ReceiptSettings.tsx       # إعدادات الإيصالات
├── inventory/
│   ├── InventorySettings.tsx     # إعدادات المخزون
│   └── StockAlertsSettings.tsx   # إعدادات تنبيهات المخزون
├── print/
│   └── PrintSettings.tsx         # إعدادات الطباعة
├── integrations/
│   ├── IntegrationsSettings.tsx  # إعدادات التكامل
│   ├── ZATCASettings.tsx         # إعدادات هيئة الزكاة
│   └── EmailSettings.tsx         # إعدادات البريد الإلكتروني
└── localization/
    └── LocalizationSettings.tsx  # إعدادات اللغة والموقع
```

### 1.2 تحديث SettingsPage.tsx
إضافة الأقسام الجديدة للقائمة:

```typescript
const menuItems: { id: SettingsSection; label: string; icon: any; }[] = [
  { id: 'company', label: t('company_profile'), icon: Building },
  { id: 'financial', label: t('financial_settings'), icon: Banknote },
  { id: 'invoice', label: t('invoice_settings'), icon: FileText },      // جديد
  { id: 'pos', label: t('pos_settings'), icon: Calculator },            // جديد
  { id: 'inventory', label: t('inventory_settings'), icon: Package },   // جديد
  { id: 'print', label: t('print_settings'), icon: Printer },           // جديد
  { id: 'integrations', label: t('integrations_settings'), icon: Link },// جديد
  { id: 'localization', label: t('localization_settings'), icon: Globe },// جديد
  { id: 'team', label: t('team_settings'), icon: Users },
  { id: 'security', label: t('security_settings'), icon: ShieldCheck },
  { id: 'appearance', label: t('appearance_settings'), icon: Palette },
  { id: 'backup', label: t('backup_settings'), icon: Database },
  { id: 'notifications', label: t('notifications_settings'), icon: Bell },
];
```

---

## المرحلة 2: ربط الإعدادات بالـ Store

### 2.1 تحديث settingsStore.ts
إضافة الحالات الجديدة:

```typescript
interface SettingsState {
  // الإعدادات الحالية
  invoice: InvoiceSettings;
  inventory: InventorySettings;
  payment: PaymentSettings;
  pos: POSSettings;
  print: PrintSettings;
  integration: IntegrationSettings;
  localization: LocalizationSettings;
  
  // إجراءات جديدة مطلوبة
  resetToDefaults: (section: string) => void;
  exportSettings: () => Promise<void>;
  importSettings: (file: File) => Promise<void>;
  validateSettings: () => Promise<boolean>;
}
```

### 2.2 إضافة API للإعدادات
```typescript
// src/features/settings/api/settingsApi.ts
export const settingsApi = {
  // حفظ الإعدادات
  saveSettings: async (section: string, data: any) => {...},
  
  // تحميل الإعدادات
  loadSettings: async (section: string) => {...},
  
  // تصدير الإعدادات
  exportSettings: async () => {...},
  
  // استيراد الإعدادات
  importSettings: async (file: File) => {...},
};
```

---

## المرحلة 3: المكونات التفصيلية

### 3.1 إعدادات الفواتير (InvoiceSettings.tsx)
```typescript
interface InvoiceSettingsProps {
  settings: InvoiceSettings;
  onUpdate: (settings: Partial<InvoiceSettings>) => void;
}

// المحتوى:
// - بادئة رقم الفاتورة
// - تنسيق رقم الفاتورة
// - شروط الدفع الافتراضية
// - قالب الفاتورة
// - عرض الشعار والتفاصيل البنكية
// - الملاحظات الافتراضية
```

### 3.2 إعدادات نقطة البيع (POSSettings.tsx)
```typescript
interface POSSettingsProps {
  settings: POSSettings;
  onUpdate: (settings: Partial<POSSettings>) => void;
}

// المحتوى:
// - طريقة الدفع الافتراضية
// - الطابعة الافتراضية
// - عرض شاشة العميل
// - إيصال الهدايا
// - خصم الموظف
// - وضع عدم الاتصال
```

### 3.3 إعدادات المخزون (InventorySettings.tsx)
```typescript
interface InventorySettingsProps {
  settings: InventorySettings;
  onUpdate: (settings: Partial<InventorySettings>) => void;
}

// المحتوى:
// - طريقة التكلفة (FIFO/LIFO/متوسط)
// - حد التنبيه المنخفض
// - تتبع الأرقام التسلسلية
// - تتبع تواريخ الانتهاء
// - التنبيهات التلقائية
```

### 3.4 إعدادات الطباعة (PrintSettings.tsx)
```typescript
interface PrintSettingsProps {
  settings: PrintSettings;
  onUpdate: (settings: Partial<PrintSettings>) => void;
}

// المحتوى:
// - الطابعة الافتراضية
// - حجم الورق
// - عدد النسخ
// - الهوامش
// - خط الطباعة
// - معاينة الطباعة
```

### 3.5 إعدادات التكامل (IntegrationsSettings.tsx)
```typescript
interface IntegrationsSettingsProps {
  settings: IntegrationSettings;
  onUpdate: (settings: Partial<IntegrationSettings>) => void;
}

// المحتوى:
// - تكامل هيئة الزكاة (ZATCA)
// - تكامل البريد الإلكتروني
// - تكامل SMS
// - Webhooks
// - API Keys
```

### 3.6 إعدادات اللغة والموقع (LocalizationSettings.tsx)
```typescript
interface LocalizationSettingsProps {
  settings: LocalizationSettings;
  onUpdate: (settings: Partial<LocalizationSettings>) => void;
}

// المحتوى:
// - اللغة الافتراضية
// - العملة الافتراضية
// - المنطقة الزمنية
// - تنسيق التاريخ
// - تنسيق الأرقام
```

---

## المرحلة 4: التحسينات والتوسع

### 4.1 إضافة ميزات متقدمة
- [ ] معاينة قالب الفاتورة
- [ ] اختبار اتصال ZATCA
- [ ] اختبار إعدادات البريد
- [ ] تصدير/استيراد الإعدادات
- [ ] إعادة تعيين الإعدادات الافتراضية
- [ ] سجل تغييرات الإعدادات

### 4.2 تحسينات UX
- [ ] حفظ تلقائي للتغييرات
- [ ] إشعارات الحفظ
- [ ] تأكيد قبل إعادة التعيين
- [ ] بحث في الإعدادات
- [ ] اختصارات لوحة المفاتيح

### 4.3 التحقق من الصحة
- [ ] التحقق من صحة البيانات
- [ ] رسائل خطأ واضحة
- [ ] التحقق من التبعيات
- [ ] التحقق من الصلاحيات

---

## ترتيب التنفيذ

### الأولوية العالية (الأسبوع 1)
1. ✅ استخراج الأنواع (مكتمل)
2. 🔲 إنشاء InvoiceSettings.tsx
3. 🔲 إنشاء POSSettings.tsx
4. 🔲 تحديث SettingsPage.tsx

### الأولوية المتوسطة (الأسبوع 2)
5. 🔲 إنشاء InventorySettings.tsx
6. 🔲 إنشاء PrintSettings.tsx
7. 🔲 ربط جميع المكونات بالـ Store

### الأولوية المنخفضة (الأسبوع 3)
8. 🔲 إنشاء IntegrationsSettings.tsx
9. 🔲 إنشاء LocalizationSettings.tsx
10. 🔲 إضافة ميزات متقدمة

---

## الملفات المطلوب إنشاؤها

```
src/features/settings/
├── components/
│   ├── invoice/
│   │   ├── InvoiceSettings.tsx
│   │   ├── InvoiceTemplateEditor.tsx
│   │   └── InvoiceNumbering.tsx
│   ├── pos/
│   │   ├── POSSettings.tsx
│   │   └── ReceiptSettings.tsx
│   ├── inventory/
│   │   ├── InventorySettings.tsx
│   │   └── StockAlertsSettings.tsx
│   ├── print/
│   │   └── PrintSettings.tsx
│   ├── integrations/
│   │   ├── IntegrationsSettings.tsx
│   │   ├── ZATCASettings.tsx
│   │   └── EmailSettings.tsx
│   └── localization/
│       └── LocalizationSettings.tsx
├── api/
│   └── settingsApi.ts
└── hooks/
    └── useSettingsSync.ts
```

---

## ملاحظات تقنية

### استخدام الأنواع الموجودة
```typescript
import { 
  InvoiceSettings, 
  InventorySettings, 
  PaymentSettings,
  POSSettings,
  PrintSettings,
  IntegrationSettings,
  LocalizationSettings 
} from './types';
```

### ربط الترجمة
```typescript
import { useI18nStore } from '@/lib/i18nStore';

const { dictionary: t } = useI18nStore();
// استخدام: t('invoice_settings')
```

### حفظ التغييرات
```typescript
import { useSettingsStore } from '../settingsStore';

const { setInvoiceSettings } = useSettingsStore();
// استخدام: setInvoiceSettings({ invoice_prefix: 'INV-' });
```
