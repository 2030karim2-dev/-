/**
 * Warehouse API Layer
 * 
 * Centralized API for warehouse and stock operations.
 * Migrated from: src/features/inventory/api/warehouseApi.ts
 */

import { supabase, parseError } from './baseApi';
import type { TableInsert } from '@/core/types/supabase-helpers';

export const warehouseApi = {
    /**
     * Get warehouses with stats via RPC
     */
    getWarehouses: async (companyId: string) => {
        return await supabase.rpc('get_warehouses_with_stats', { p_company_id: companyId });
    },

    /**
     * Create inventory transactions
     */
    createInventoryTransactions: async (transactions: Array<TableInsert<'inventory_transactions'>>) => {
        const response = await supabase
            .from('inventory_transactions')
            .insert(transactions);

        if (response.error) throw parseError(response.error);
        return response;
    },

    /**
     * Get product movements with optional date range
     */
    getProductMovements: async (productId: string, from?: string, to?: string) => {
        let query = supabase
            .from('inventory_transactions')
            .select('*')
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

    /**
     * Record a single inventory transaction
     */
    recordTransaction: async (
        companyId: string,
        userId: string,
        tx: Omit<TableInsert<'inventory_transactions'>, 'company_id' | 'created_by'>
    ) => {
        const response = await supabase
            .from('inventory_transactions')
            .insert({
                ...tx,
                company_id: companyId,
                created_by: userId
            } as TableInsert<'inventory_transactions'>);

        if (response.error) throw parseError(response.error);
        return response;
    },

    /**
     * Initialize stock for a product in a warehouse
     */
    initializeStock: async (
        companyId: string,
        userId: string,
        stockData: { product_id: string; warehouse_id: string; quantity: number }
    ) => {
        const response = await supabase
            .from('inventory_transactions')
            .insert({
                company_id: companyId,
                created_by: userId,
                product_id: stockData.product_id,
                warehouse_id: stockData.warehouse_id,
                quantity: stockData.quantity,
                transaction_type: 'initial',
                reference_type: 'opening_balance'
            });

        if (response.error) throw parseError(response.error);
        return response;
    },

    /**
     * Update stock quantity for a product in a warehouse
     */
    updateStock: async (
        companyId: string,
        productId: string,
        warehouseId: string,
        quantity: number,
        userId?: string
    ) => {
        // Step 1: Get current stock
        const { data: currentStock } = await supabase
            .from('product_stock')
            .select('quantity')
            .eq('product_id', productId)
            .eq('warehouse_id', warehouseId)
            .maybeSingle();

        const currentQty = currentStock?.quantity || 0;
        const adjustment = quantity - currentQty;

        if (adjustment === 0) return { data: null, error: null };

        const response = await supabase
            .from('inventory_transactions')
            .insert({
                company_id: companyId,
                created_by: userId,
                product_id: productId,
                warehouse_id: warehouseId,
                quantity: adjustment,
                transaction_type: 'adjustment',
                reference_type: 'manual_update'
            });

        if (response.error) throw parseError(response.error);
        return response;
    },

    /**
     * Save (create or update) a warehouse
     */
    saveWarehouse: async (companyId: string, data: { id?: string; name_ar: string; location: string }) => {
        const { id, ...formData } = data;
        if (id) {
            const response = await supabase
                .from('warehouses')
                .update(formData as any)
                .eq('id', id);

            if (response.error) throw parseError(response.error);
            return response;
        } else {
            const response = await supabase
                .from('warehouses')
                .insert({
                    ...formData,
                    company_id: companyId,
                    status: 'active'
                } as any);

            if (response.error) throw parseError(response.error);
            return response;
        }
    },

    /**
     * Soft-delete a warehouse
     */
    deleteWarehouse: async (id: string) => {
        const response = await supabase
            .from('warehouses')
            .update({ deleted_at: new Date().toISOString() } as any)
            .eq('id', id);

        if (response.error) throw parseError(response.error);
    }
};
