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
    getProductsForWarehouse: async (warehouseId: string) => {
        const { data, error } = await supabase
            .from('product_stock')
            .select('product_id, quantity')
            .eq('warehouse_id', warehouseId);
        if (error) throw error;

        const stockRows = (data || []) as Array<{ product_id: string; quantity: number }>;
        const productIds = stockRows.map((stock) => stock.product_id).filter(Boolean);

        if (productIds.length === 0) return [];

        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds)
            .is('deleted_at', null);

        if (productsError) throw productsError;

        const productsMap = new Map((products || []).map((product) => [product.id, product as Record<string, unknown>]));

        return stockRows.map((stock) => {
            const product = productsMap.get(stock.product_id) || {};
            return {
                ...product,
                stock_quantity: stock.quantity,
                name_ar: (product.name_ar as string | undefined) || '',
                sale_price: Number(product.sale_price) || 0,
            };
        });
    }
};

export default warehouseService;
