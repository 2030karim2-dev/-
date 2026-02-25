import { supabase } from '../../../lib/supabaseClient';

/** Analytics and reporting functions */
export const analyticsApi = {
    getInventoryAnalytics: async (companyId: string, from?: string, to?: string) => {
        let query = (supabase.from('invoice_items') as any)
            .select(`
        quantity,
        unit_price,
        total,
        product_id,
        products!inner(id, name_ar, sku, cost_price),
        invoices!inner(id, issue_date, type, status)
      `)
            .eq('invoices.company_id', companyId)
            .neq('invoices.status', 'void')
            .in('invoices.type', ['sale', 'return_sale']);

        if (from) {
            query = query.gte('invoices.issue_date', from);
        }
        if (to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            query = query.lte('invoices.issue_date', toDate.toISOString());
        }

        return await query;
    },

    getDeadStock: async (daysThreshold: number) => {
        return await (supabase as any).rpc('get_dead_stock', { days_threshold: daysThreshold });
    },

    getProductAnalytics: async (productId: string) => {
        return await (supabase as any).rpc('get_product_analytics', { p_product_id: productId });
    },

    getLowStockProducts: async () => {
        return await (supabase as any).rpc('get_low_stock_products');
    },
};
