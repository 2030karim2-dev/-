import { supabase } from '../../../lib/supabaseClient';
import { ProductCrossReference, ProductKitItem, ProductSupplierPrice } from '../types';
import { TableInsert } from '@/core/types/supabase-helpers';

export const autoPartsApi = {
    // --- Cross References ---
    async getCrossReferences(productId: string) {
        const { data, error } = await supabase
            .from('product_cross_references')
            .select(`
        *,
        alternative_product:products!alternative_product_id (
          id, name_ar, name_en, sku, part_number, brand, sale_price, image_url
        )
      `)
            .eq('base_product_id', productId);

        if (error) throw error;
        // Map camelCase for frontend where necessary
        return data?.map((req) => {
            type AltProduct = { name_ar?: string; name_en?: string };
            const alt = req.alternative_product as unknown as AltProduct | null;
            return {
                ...req,
                alternative_product: {
                    ...(req.alternative_product as object || {}),
                    name: alt?.name_ar || alt?.name_en
                }
            };
        }) as unknown as ProductCrossReference[];
    },

    async addCrossReference(payload: TableInsert<'product_cross_references'>) {
        const { data, error } = await supabase
            .from('product_cross_references')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteCrossReference(id: string) {
        const { error } = await supabase
            .from('product_cross_references')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Assembly Kits ---
    async getKitComponents(kitId: string) {
        const { data, error } = await supabase
            .from('product_kit_items')
            .select(`
        *,
        component_product:products!component_product_id (
          id, name_ar, name_en, sku, part_number, brand, purchase_price, sale_price, unit
        )
      `)
            .eq('kit_product_id', kitId);

        if (error) throw error;
        return data?.map((req) => {
            type CompProduct = { name_ar?: string; name_en?: string };
            const comp = req.component_product as unknown as CompProduct | null;
            return {
                ...req,
                component_product: {
                    ...(req.component_product as object || {}),
                    name: comp?.name_ar || comp?.name_en
                }
            };
        }) as unknown as ProductKitItem[];
    },

    async addKitComponent(payload: TableInsert<'product_kit_items'>) {
        const { data, error } = await supabase
            .from('product_kit_items')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async removeKitComponent(id: string) {
        const { error } = await supabase
            .from('product_kit_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Supplier Prices (Sourcing) ---
    async getSupplierPrices(productId: string) {
        const { data, error } = await supabase
            .from('product_supplier_prices')
            .select(`
        *,
        supplier:parties!supplier_id (
          id, name
        )
      `)
            .eq('product_id', productId);

        if (error) throw error;

        return data?.map((item) => {
            type Sup = { name?: string };
            const sup = item.supplier as unknown as Sup | null;
            return {
                ...item,
                supplier_name: sup?.name
            };
        }) as unknown as ProductSupplierPrice[];
    },

    async addSupplierPrice(payload: TableInsert<'product_supplier_prices'>) {
        const { data, error } = await supabase
            .from('product_supplier_prices')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
