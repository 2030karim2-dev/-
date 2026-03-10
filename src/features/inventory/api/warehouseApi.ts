import { supabase } from '../../../lib/supabaseClient';
import { TableInsert } from '@/core/types/supabase-helpers';

/** Warehouse and stock management */
export const warehouseApi = {
    getWarehouses: async (companyId: string) => {
        return await supabase.rpc('get_warehouses_with_stats', { p_company_id: companyId });
    },

    createInventoryTransactions: async (transactions: TableInsert<'inventory_transactions'>[]) => {
        return await supabase.from('inventory_transactions')
            .insert(transactions);
    },

    getProductMovements: async (productId: string, from?: string, to?: string) => {
        let query = supabase.from('inventory_transactions')
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

    recordTransaction: async (companyId: string, userId: string, tx: Omit<TableInsert<'inventory_transactions'>, 'company_id' | 'created_by'>) => {
        return await supabase.from('inventory_transactions')
            .insert({
                ...tx,
                company_id: companyId,
                created_by: userId
            } as TableInsert<'inventory_transactions'>);
    },

    initializeStock: async (stockData: TableInsert<'product_stock'> | TableInsert<'product_stock'>[]) => {
        return await supabase.from('product_stock')
            .insert(stockData as any);
    },

    updateStock: async (companyId: string, productId: string, warehouseId: string, quantity: number) => {
        const { data } = await supabase.from('product_stock')
            .select('id')
            .eq('product_id', productId)
            .eq('warehouse_id', warehouseId)
            .single();

        if (data) {
            return await supabase.from('product_stock')
                .update({ quantity })
                .eq('product_id', productId)
                .eq('warehouse_id', warehouseId);
        } else {
            return await supabase.from('product_stock')
                .insert({ company_id: companyId, product_id: productId, warehouse_id: warehouseId, quantity });
        }
    },

    saveWarehouse: async (companyId: string, data: { id?: string, name_ar: string, location: string }) => {
        const { id, ...formData } = data;
        if (id) {
            return await supabase.from('warehouses').update(formData as any).eq('id', id);
        } else {
            return await supabase.from('warehouses').insert({
                ...formData,
                company_id: companyId,
                status: 'active'
            } as any);
        }
    },

    deleteWarehouse: async (id: string) => {
        return await supabase.from('warehouses')
            .update({ deleted_at: new Date().toISOString() } as any)
            .eq('id', id);
    },
};
