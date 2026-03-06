import { supabase } from '../../../lib/supabaseClient';
// import { Database } from '../../../core/database.types';

import { TableInsert, TableUpdate } from '@/core/types/supabase-helpers';

/** Products CRUD and search */
export const productsApi = {
    getProducts: async (companyId: string, page: number = 1, limitNum: number = 1000) => {
        const from = (page - 1) * limitNum;
        const to = from + limitNum - 1;

        return await supabase.from('products')
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
                cost_price,
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
                stock:product_stock!product_stock_product_id_fkey(
                    quantity,
                    warehouse_id,
                    warehouses!product_stock_warehouse_id_fkey(name_ar)
                )
            `)
            .eq('company_id', companyId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(from, to);
    },

    getProductById: async (id: string) => {
        return await supabase.from('products')
            .select('*')
            .eq('id', id)
            .single();
    },

    createProduct: async (productData: TableInsert<'products'>) => {
        return await supabase.from('products')
            .insert(productData)
            .select()
            .single();
    },

    updateProduct: async (id: string, updates: TableUpdate<'products'>) => {
        return await supabase.from('products')
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
            .update({ deleted_at: new Date().toISOString() })
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
            .update({ deleted_at: new Date().toISOString() })
            .in('id', ids);
    },

    searchProduct: async (companyId: string, term: string) => {
        const sanitized = term.replace(/[%_\\*()]/g, '');
        if (!sanitized.trim()) return { data: [], error: null };

        return await supabase.from('products')
            .select('id, name_ar, sku, sale_price, part_number, alternative_numbers, quantity:product_stock(quantity)')
            .eq('company_id', companyId)
            .eq('status', 'active')
            .or(`name_ar.ilike.%${sanitized}%,sku.ilike.%${sanitized}%,part_number.ilike.%${sanitized}%,alternative_numbers.ilike.%${sanitized}%,brand.ilike.%${sanitized}%,size.ilike.%${sanitized}%,description.ilike.%${sanitized}%`)
            .limit(15);
    },

    searchProductForFitment: async (companyId: string, term: string) => {
        const sanitized = term.replace(/[%_\\*()]/g, '');
        if (!sanitized.trim() || sanitized.length < 2) return [];

        const { data, error } = await supabase.from('products')
            .select('id, name_ar, name_en, sku, part_number, brand')
            .eq('company_id', companyId)
            .or(`name_ar.ilike.%${sanitized}%,name_en.ilike.%${sanitized}%,part_number.ilike.%${sanitized}%,sku.ilike.%${sanitized}%,brand.ilike.%${sanitized}%,size.ilike.%${sanitized}%,description.ilike.%${sanitized}%`)
            .limit(10);

        if (error) throw error;
        return data || [];
    },

    getSupplier: async (id: string) => {
        return await supabase.from('parties')
            .select('name')
            .eq('id', id)
            .single();
    },

    getCategories: async (companyId: string) => {
        const { data, error } = await supabase.from('product_categories')
            .select('*')
            .eq('company_id', companyId)
            .is('deleted_at', null)
            .order('name', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    createCategory: async (companyId: string, name: string) => {
        return await supabase.from('product_categories')
            .insert({ company_id: companyId, name })
            .select()
            .single();
    },

    deleteCategory: async (id: string) => {
        return await supabase.from('product_categories').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    },
};
