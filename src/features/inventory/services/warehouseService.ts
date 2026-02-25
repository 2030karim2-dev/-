// Warehouse Service - Handles all warehouse-related operations
import { supabase } from '../../../lib/supabaseClient';
import { inventoryApi } from '../api';

export const warehouseService = {
    /**
     * Get all warehouses for a company
     */
    getWarehouses: async (companyId: string) => {
        const { data, error } = await inventoryApi.getWarehouses(companyId);
        if (error) throw error;
        return data || [];
    },

    /**
     * Get products for a specific warehouse
     */
    getProductsForWarehouse: async (companyId: string, warehouseId: string) => {
        const { data, error } = await supabase
            .from('product_stock')
            .select('*, products(*)')
            .eq('warehouse_id', warehouseId);
        if (error) throw error;

        interface StockRecord {
            quantity: number;
            products: {
                name_ar: string;
                sale_price: number;
                [key: string]: unknown;
            };
        }

        return (data || []).map((s: unknown) => {
            const stock = s as StockRecord;
            return {
                ...stock.products,
                stock_quantity: stock.quantity,
                name_ar: stock.products.name_ar,
                sale_price: stock.products.sale_price
            } as unknown as any;
        });
    }
};

export default warehouseService;
