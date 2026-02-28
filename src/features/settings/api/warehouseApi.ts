
import { supabase } from '../../../lib/supabaseClient';

export const warehouseApi = {
  fetchWarehouses: async (companyId: string) => {
    return await supabase
      .from('warehouses')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name_ar', { ascending: true });
  },

  upsertWarehouse: async (data: any) => {
    return await supabase.from('warehouses').upsert(data).select().single();
  },

  deleteWarehouse: async (id: string) => {
    return await supabase.from('warehouses').update({ deleted_at: new Date().toISOString() } as any).eq('id', id);
  }
};
