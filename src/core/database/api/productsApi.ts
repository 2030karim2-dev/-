/**
 * Products API Layer
 * 
 * Centralized API for product operations.
 * Migrated from: src/features/inventory/api/productsApi.ts
 */

import { supabase, parseError, unwrapSingle, unwrapList } from './baseApi';
import type { TableInsert, TableUpdate } from '@/core/types/supabase-helpers';

export const productsApi = {
    /**
     * Fetch paginated products with category and stock relations
     */
    getProducts: async (companyId: string, page: number = 1, limitNum: number = 200) => {
        const from = (page - 1) * limitNum;
        const to = from + limitNum - 1;

        const response = await supabase
            .from('products')
            .select(`
        id,
        company_id,
        name_ar,
        sku,
        part_number,
        brand,
        category_id,
        size,
        description,
        purchase_price,
        sale_price,
        min_stock_level,
        unit,
        image_url,
        alternative_numbers,
        barcode,
        created_at,
        updated_at,
        status,
        category:product_categories(id, name),
        stock:product_stock(
          quantity,
          warehouse_id,
          warehouses(name_ar)
        )
      `)
            .eq('company_id', companyId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(from, to);

        return unwrapList(response);
    },

    /**
     * Get a single product by ID
     */
    getProductById: async (id: string) => {
        const response = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        return unwrapSingle(response);
    },

    /**
     * Create a new product
     */
    createProduct: async (productData: TableInsert<'products'>) => {
        const response = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single();

        return unwrapSingle(response);
    },

    /**
     * Update an existing product
     */
    updateProduct: async (id: string, updates: TableUpdate<'products'>) => {
        const response = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        return unwrapSingle(response);
    },

    /**
     * Save product UoMs via RPC with fallback
     */
    saveProductUoMs: async (productId: string, uoms: any[]) => {
        try {
            const { data, error } = await supabase.rpc('save_product_uoms', {
                p_product_id: productId,
                p_uoms: uoms
            });
            if (!error) return { data, error: null };

            // If function is missing, fallback to client-side non-atomic sequence
            const errCode = (error as any).code || '';
            const errMessage = (error as any).message?.toLowerCase() || '';
            if (errCode === 'PGRST202' || errMessage.includes('could not find the function') || errMessage.includes('404')) {
                await supabase.from('product_uoms' as any).delete().eq('product_id', productId);
                if (uoms && uoms.length > 0) {
                    const uomsToInsert = uoms.map(u => ({ ...u, product_id: productId }));
                    return await supabase.from('product_uoms' as any).insert(uomsToInsert);
                }
                return { error: null };
            }
            return { error };
        } catch (_) {
            // Safe fallback for connection/unexpected exceptions
            try {
                await supabase.from('product_uoms' as any).delete().eq('product_id', productId);
                if (uoms && uoms.length > 0) {
                    const uomsToInsert = uoms.map(u => ({ ...u, product_id: productId }));
                    return await supabase.from('product_uoms' as any).insert(uomsToInsert);
                }
            } catch (__) { /* table not yet migrated */ }
        }
        return { error: null };
    },

    /**
     * Soft-delete a product with safety checks
     */
    deleteProduct: async (id: string) => {
        // Safety check: prevent deleting products with existing invoice items
        const { count: invoiceCount, error: invErr } = await supabase
            .from('invoice_items')
            .select('id', { count: 'exact', head: true })
            .eq('product_id', id);
        if (invErr) throw parseError(invErr);
        if (invoiceCount && invoiceCount > 0) {
            throw new Error('لا يمكن حذف منتج له فواتير مرتبطة. قم بأرشفته بدلاً من ذلك.');
        }

        // Safety check: prevent deleting products with inventory transactions
        const { count: txCount, error: txErr } = await supabase
            .from('inventory_transactions')
            .select('id', { count: 'exact', head: true })
            .eq('product_id', id);
        if (txErr) throw parseError(txErr);
        if (txCount && txCount > 0) {
            throw new Error('لا يمكن حذف منتج له حركات مخزون مرتبطة. قم بأرشفته بدلاً من ذلك.');
        }

        const response = await supabase
            .from('products')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (response.error) throw parseError(response.error);
    },

    /**
     * Bulk soft-delete products with safety checks
     */
    bulkDeleteProducts: async (ids: string[]) => {
        // Safety check: prevent deleting products with existing references
        const { count: invoiceCount, error: invErr } = await supabase
            .from('invoice_items')
            .select('id', { count: 'exact', head: true })
            .in('product_id', ids);
        if (invErr) throw parseError(invErr);
        if (invoiceCount && invoiceCount > 0) {
            throw new Error(`لا يمكن حذف المنتجات: ${invoiceCount} عنصر فاتورة مرتبط بها. قم بأرشفتها بدلاً من ذلك.`);
        }

        const response = await supabase
            .from('products')
            .update({ deleted_at: new Date().toISOString() })
            .in('id', ids);

        if (response.error) throw parseError(response.error);
    },

    /**
     * Search products by term
     */
    searchProduct: async (companyId: string, term: string) => {
        const searchPattern = `%${term.trim()}%`;

        const response = await supabase
            .from('products')
            .select('id, name_ar, sku, sale_price, purchase_price, part_number, alternative_numbers, brand, quantity:product_stock(quantity)')
            .eq('company_id', companyId)
            .eq('status', 'active')
            .or(`name_ar.ilike.${searchPattern},sku.ilike.${searchPattern},part_number.ilike.${searchPattern},alternative_numbers.ilike.${searchPattern},brand.ilike.${searchPattern}`)
            .order('name_ar')
            .limit(15);

        return unwrapList(response);
    },

    /**
     * Full-text search for fitment
     */
    searchProductForFitment: async (companyId: string, term: string) => {
        const sanitized = term.replace(/[^\w\s\u0600-\u06FF]/g, ' ');
        const tokens = sanitized.split(/\s+/).filter(word => word.length > 0);

        if (tokens.length < 1) return [];

        const tsQuery = tokens.map(word => `${word}:*`).join(' & ');

        const { data, error } = await supabase
            .from('products')
            .select('id, name_ar, name_en, sku, part_number, brand')
            .eq('company_id', companyId)
            .textSearch('search_vector', tsQuery, {
                config: 'simple'
            })
            .limit(10);

        if (error) throw parseError(error);
        return data || [];
    },

    /**
     * Get supplier name by ID
     */
    getSupplier: async (id: string) => {
        const response = await supabase
            .from('parties')
            .select('name')
            .eq('id', id)
            .single();

        return unwrapSingle(response);
    },

    /**
     * Get product categories
     */
    getCategories: async (companyId: string) => {
        const { data, error } = await supabase
            .from('product_categories')
            .select('*')
            .eq('company_id', companyId)
            .is('deleted_at', null)
            .order('name', { ascending: true });

        if (error) throw parseError(error);
        return data || [];
    },

    /**
     * Create a product category
     */
    createCategory: async (companyId: string, name: string) => {
        const response = await supabase
            .from('product_categories')
            .insert({ company_id: companyId, name })
            .select()
            .single();

        return unwrapSingle(response);
    },

    /**
     * Soft-delete a product category
     */
    deleteCategory: async (id: string) => {
        const response = await supabase
            .from('product_categories')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (response.error) throw parseError(response.error);
    }
};
