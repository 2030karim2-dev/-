import { supabase } from '../../../lib/supabaseClient';

/** Warehouse and stock management */
export const warehouseApi = {
    getWarehouses: async (companyId: string) => {
        return await supabase.rpc('get_warehouses_with_stats', { p_company_id: companyId } as any);
    },

    createInventoryTransactions: async (transactions: any[]) => {
        return await (supabase.from('inventory_transactions') as any)
            .insert(transactions);
    },

    getProductMovements: async (productId: string, from?: string, to?: string) => {
        let query = (supabase.from('inventory_transactions') as any)
            .select('*') // Fix: removed invalid created_by(*) relation
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (from) {
            query = query.gte('created_at', from);
        }
        if (to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            query = query.lte('created_at', toDate.toISOString());
        }

        return await query;
    },

    recordTransaction: async (companyId: string, userId: string, tx: any) => {
        return await (supabase.from('inventory_transactions') as any)
            .insert({
                ...tx,
                company_id: companyId,
                created_by: userId
            });
    },

    initializeStock: async (stockData: any) => {
        return await (supabase.from('product_stock') as any)
            .insert(stockData);
    },

    updateStock: async (productId: string, warehouseId: string, quantity: number) => {
        const { data } = await (supabase.from('product_stock') as any)
            .select('id')
            .eq('product_id', productId)
            .eq('warehouse_id', warehouseId)
            .single();

        if (data) {
            return await (supabase.from('product_stock') as any)
                .update({ quantity })
                .eq('product_id', productId)
                .eq('warehouse_id', warehouseId);
        } else {
            return await (supabase.from('product_stock') as any)
                .insert({ product_id: productId, warehouse_id: warehouseId, quantity });
        }
    },
};
