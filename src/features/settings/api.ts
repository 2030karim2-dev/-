
import { supabase } from '../../lib/supabaseClient';
import { CompanyFormData, WarehouseFormData, FiscalYearFormData, ExchangeRateFormData } from './types';

export const settingsApi = {
  getCompany: async (companyId: string) => {
    return await (supabase.from('companies') as any)
      .select('*')
      .eq('id', companyId)
      .single();
  },

  updateCompany: async (companyId: string, data: CompanyFormData) => {
    return await (supabase.from('companies') as any)
      .update(data)
      .eq('id', companyId)
      .select()
      .single();
  },

  // إدارة الفريق والدعوات (Team Management)
  getInvitations: async (companyId: string) => {
    return await (supabase.from('invitations') as any)
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
  },

  inviteUser: async (email: string, role: string, companyId: string, userId: string) => {
    return await (supabase.from('invitations') as any)
      .insert({
        email,
        role,
        company_id: companyId,
        created_by: userId
      })
      .select()
      .single();
  },

  revokeInvitation: async (id: string) => {
    return await (supabase.from('invitations') as any).delete().eq('id', id);
  },

  getAuditLogs: async (companyId: string) => {
    return await (supabase.from('audit_logs') as any)
      .select('*, profiles:user_id(full_name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(100);
  },

  getWarehouses: async (companyId: string) => {
    return await (supabase.from('warehouses') as any)
      .select('*')
      .eq('company_id', companyId)
      .order('name_ar', { ascending: true });
  },

  createWarehouse: async (companyId: string, data: WarehouseFormData) => {
    return await (supabase.from('warehouses') as any)
      .insert({ ...data, company_id: companyId })
      .select()
      .single();
  },

  deleteWarehouse: async (id: string) => {
    return await (supabase.from('warehouses') as any)
      .delete()
      .eq('id', id);
  },

  setPrimaryWarehouse: async (companyId: string, warehouseId: string) => {
    // أولاً: إلغاء أساسي من جميع المستودعات
    const { error: resetError } = await (supabase.from('warehouses') as any)
      .update({ is_primary: false })
      .eq('company_id', companyId);

    if (resetError) throw resetError;

    // ثانياً: تعيين المستودع المحدد كأساسي
    const result = await (supabase.from('warehouses') as any)
      .update({ is_primary: true })
      .eq('id', warehouseId)
      .select()
      .single();

    // Rollback: إذا فشل التعيين، نعيد المستودع الأصلي
    if (result.error) {
      console.error('[Settings] setPrimaryWarehouse failed, attempting no rollback available:', result.error);
    }

    return result;
  },

  getSupportedCurrencies: async () => {
    return await (supabase.from('supported_currencies') as any).select('*');
  },

  createCurrency: async (data: { code: string, name_ar: string, symbol: string, exchange_operator?: 'multiply' | 'divide' }) => {
    return await (supabase.from('supported_currencies') as any).insert({ ...data, is_base: false });
  },

  deleteCurrency: async (code: string) => {
    return await (supabase.from('supported_currencies') as any).delete().eq('code', code);
  },

  getExchangeRates: async (companyId: string) => {
    return await (supabase.from('exchange_rates') as any)
      .select('*')
      .eq('company_id', companyId)
      .order('effective_date', { ascending: false })
      .order('created_at', { ascending: false });
  },

  updateExchangeRate: async (companyId: string, data: ExchangeRateFormData, userId: string) => {
    return await (supabase.from('exchange_rates') as any)
      .insert({
        company_id: companyId,
        currency_code: data.currency_code,
        rate_to_base: data.rate_to_base,
        effective_date: data.effective_date,
        created_by: userId
      })
      .select()
      .single();
  },

  getFiscalYears: async (companyId: string) => {
    return await (supabase.from('fiscal_years') as any)
      .select('*')
      .eq('company_id', companyId)
      .order('start_date', { ascending: false });
  },

  createFiscalYear: async (companyId: string, data: FiscalYearFormData) => {
    return await (supabase.from('fiscal_years') as any)
      .insert({ ...data, company_id: companyId, is_closed: false })
      .select()
      .single();
  },

  closeFiscalYear: async (id: string) => {
    return await (supabase.from('fiscal_years') as any)
      .update({ is_closed: true })
      .eq('id', id);
  }
};
