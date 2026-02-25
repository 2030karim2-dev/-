import { supabase } from '../../../lib/supabaseClient';
import { ProductCrossReference, ProductKitItem, ProductSupplierPrice } from '../types';

export const autoPartsApi = {
    // --- Cross References ---
    async getCrossReferences(productId: string) {
        const { data, error } = await supabase
            .from('product_cross_references')
            .select(`
        *,
        alternative_product:products!alternative_product_id (
          id, name_ar, name_en, sku, part_number, brand, selling_price, stock_quantity, image_url
        )
      `)
            .eq('base_product_id', productId);

        if (error) throw error;
        // Map camelCase for frontend where necessary
        return data?.map((req: any) => ({
            ...req,
            alternative_product: {
                ...req.alternative_product,
                name: req.alternative_product?.name_ar || req.alternative_product?.name_en
            }
        })) as any[];
    },

    async addCrossReference(payload: { base_product_id: string; alternative_product_id: string; match_quality: string; notes?: string }) {
        const { data, error } = await supabase
            .from('product_cross_references')
            // @ts-ignore
            .insert([payload])
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
          id, name_ar, name_en, sku, part_number, brand, cost_price, selling_price, stock_quantity, unit
        )
      `)
            .eq('kit_product_id', kitId);

        if (error) throw error;
        return data?.map((req: any) => ({
            ...req,
            component_product: {
                ...req.component_product,
                name: req.component_product?.name_ar || req.component_product?.name_en
            }
        })) as any[];
    },

    async addKitComponent(payload: { kit_product_id: string; component_product_id: string; quantity: number }) {
        const { data, error } = await supabase
            .from('product_kit_items')
            // @ts-ignore
            .insert([payload])
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

        return data?.map((item: any) => ({
            ...item,
            supplier_name: item.supplier?.name
        })) as ProductSupplierPrice[];
    },

    async addSupplierPrice(payload: { product_id: string; supplier_id: string; cost_price: number; lead_time_days?: number; supplier_part_number?: string; notes?: string }) {
        const { data, error } = await supabase
            .from('product_supplier_prices')
            // @ts-ignore
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
