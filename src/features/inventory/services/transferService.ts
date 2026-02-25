// Transfer Service - Handles stock transfer operations
import { CreateTransferDTO } from '../types';
import { supabase } from '../../../lib/supabaseClient';

export const transferService = {
    /**
     * Create a new stock transfer
     */
    createTransfer: async (data: CreateTransferDTO) => {
        const { data: transfer, error } = await supabase.rpc('process_stock_transfer', {
            p_from_warehouse: data.from_warehouse_id,
            p_to_warehouse: data.to_warehouse_id,
            p_items: data.items,
            p_company_id: data.company_id,
            p_user_id: data.user_id,
            p_notes: data.notes
        } as any);
        if (error) throw error;
        return transfer;
    },

    /**
     * Get all transfers for a company
     */
    getTransfers: async (companyId: string) => {
        const { data, error } = await (supabase.from('stock_transfers') as any)
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    }
};

export default transferService;
