
import { supabase } from '../../../lib/supabaseClient';
import { CompanyFormData } from '../types';

export const companyApi = {
  getCompany: async (companyId: string) => {
    return await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
  },

  updateCompany: async (companyId: string, data: CompanyFormData) => {
    return await (supabase.from('companies') as any)
      .update(data)
      .eq('id', companyId);
  }
};
