
import { supabase } from '../../../lib/supabaseClient';

export const warehouseApi = {
  fetchWarehouses: async (companyId: string) => {
    return await supabase
      .from('warehouses')
      .select('*')
      .eq('company_id', companyId)
      .order('name_ar', { ascending: true });
  },

  upsertWarehouse: async (data: any) => {
    return await supabase.from('warehouses').upsert(data).select().single();
  },

  deleteWarehouse: async (id: string) => {
    return await supabase.from('warehouses').delete().eq('id', id);
  }
};
