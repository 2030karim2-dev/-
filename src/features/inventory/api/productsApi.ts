import { supabase } from '../../../lib/supabaseClient';

/** Products CRUD and search */
export const productsApi = {
    getProducts: async (companyId: string) => {
        return await supabase.from('products')
            .select(`
        *,
        stock:product_stock!product_stock_product_id_fkey(
          quantity,
          warehouse_id,
          warehouses!product_stock_warehouse_id_fkey(name_ar)
        )
      `)
            .eq('company_id', companyId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });
    },

    createProduct: async (productData: any) => {
        return await (supabase.from('products') as any)
            .insert(productData)
            .select()
            .single();
    },

    updateProduct: async (id: string, updates: any) => {
        return await (supabase.from('products') as any)
            .update(updates)
            .eq('id', id)
            .select()
            .single();
    },

    deleteProduct: async (id: string) => {
        // Safety check: prevent deleting products with existing invoice items
        const { count: invoiceCount, error: invErr } = await supabase.from('invoice_items')
            .select('id', { count: 'exact', head: true })
            .eq('product_id', id);
        if (invErr) throw invErr;
        if (invoiceCount && invoiceCount > 0) {
            throw new Error('لا يمكن حذف منتج له فواتير مرتبطة. قم بأرشفته بدلاً من ذلك.');
        }

        // Safety check: prevent deleting products with inventory transactions
        const { count: txCount, error: txErr } = await supabase.from('inventory_transactions')
            .select('id', { count: 'exact', head: true })
            .eq('product_id', id);
        if (txErr) throw txErr;
        if (txCount && txCount > 0) {
            throw new Error('لا يمكن حذف منتج له حركات مخزون مرتبطة. قم بأرشفته بدلاً من ذلك.');
        }

        return await supabase.from('products')
            .delete()
            .eq('id', id);
    },

    bulkDeleteProducts: async (ids: string[]) => {
        // Safety check: prevent deleting products with existing references
        const { count: invoiceCount, error: invErr } = await supabase.from('invoice_items')
            .select('id', { count: 'exact', head: true })
            .in('product_id', ids);
        if (invErr) throw invErr;
        if (invoiceCount && invoiceCount > 0) {
            throw new Error(`لا يمكن حذف المنتجات: ${invoiceCount} عنصر فاتورة مرتبط بها. قم بأرشفتها بدلاً من ذلك.`);
        }

        return await supabase.from('products')
            .delete()
            .in('id', ids);
    },

    searchProduct: async (companyId: string, term: string) => {
        const sanitized = term.replace(/[%_\\*()]/g, '');
        if (!sanitized.trim()) return { data: [], error: null };

        return await (supabase.from('products') as any)
            .select('id, name_ar, sku, sale_price, part_number, alternative_numbers, quantity:product_stock(quantity)')
            .eq('company_id', companyId)
            .eq('status', 'active')
            .or(`name_ar.ilike.%${sanitized}%,sku.ilike.%${sanitized}%,part_number.ilike.%${sanitized}%,alternative_numbers.ilike.%${sanitized}%`)
            .limit(15);
    },

    getSupplier: async (id: string) => {
        return await (supabase.from('suppliers') as any)
            .select('name')
            .eq('id', id)
            .single();
    },

    getCategories: async (companyId: string) => {
        const { data, error } = await (supabase.from('product_categories') as any)
            .select('*')
            .eq('company_id', companyId)
            .order('name', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    createCategory: async (companyId: string, name: string) => {
        return await (supabase.from('product_categories') as any)
            .insert({ company_id: companyId, name })
            .select()
            .single();
    },

    deleteCategory: async (id: string) => {
        return await (supabase.from('product_categories') as any).delete().eq('id', id);
    },
};
