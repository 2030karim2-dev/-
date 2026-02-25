
// Add missing SettingsSection type used in SettingsPage.tsx
export type SettingsSection = 'company' | 'financial' | 'appearance' | 'backup' | 'security' | 'notifications' | 'team' | 'invoice' | 'pos' | 'inventory' | 'print' | 'integrations' | 'localization';

export interface Company {
  id: string;
  name_ar: string;
  name_en?: string | null;
  tax_number?: string | null;
  base_currency: string;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyFormData {
  name?: string;
  name_ar?: string;
  english_name?: string;
  name_en?: string | null;
  tax_number?: string | null;
  base_currency?: string;
  address?: string | null;
  phone?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
  [key: string]: any; // السماح بحقول إضافية للتوافق مع أعمدة DB المختلفة
}

export interface Invitation {
  id: string;
  email: string;
  role_id: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  role_name?: string; // For UI display
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  user_name?: string;
  created_at: string;
  details?: string;
}

export interface Warehouse {
  id: string;
  name_ar: string;
  location: string | null;
  status: string;
}

export interface WarehouseFormData {
  name_ar: string;
  location: string;
}

export interface FiscalYear {
  id: string;
  company_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
}

export interface FiscalYearFormData {
  name: string;
  start_date: string;
  end_date: string;
}

export interface SupportedCurrency {
  code: string;
  name_ar: string;
  symbol: string;
  is_base: boolean;
  exchange_operator: 'multiply' | 'divide';
}

export interface ExchangeRate {
  id: string;
  currency_code: string;
  rate_to_base: number;
  effective_date: string;
}

export interface ExchangeRateFormData {
  currency_code: string;
  rate_to_base: number;
  effective_date: string;
}

/**
 * Fix: Added missing AutoBackupConfig export as it is utilized by settingsService
 */
export interface AutoBackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  includeImages: boolean;
  lastBackupStatus: 'success' | 'failed' | 'idle';
  lastBackupTime?: string;
}
