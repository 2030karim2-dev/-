import { supabase } from '../../../lib/supabaseClient';

/** Vehicle management and fitment */
export const vehiclesApi = {
    getVehicles: async (filters?: { make?: string, year?: number, vin?: string }) => {
        let query = (supabase.from('vehicles') as any)
            .select('*')
            .order('make', { ascending: true })
            .order('model', { ascending: true });

        if (filters?.make) query = query.ilike('make', `%${filters.make}%`);
        if (filters?.year) query = query.lte('year_start', filters.year).gte('year_end', filters.year);
        if (filters?.vin) query = query.eq('vin_prefix', filters.vin.substring(0, 8));

        return await query;
    },

    upsertVehicle: async (vehicle: any) => {
        return await (supabase.from('vehicles') as any)
            .upsert(vehicle)
            .select()
            .single();
    },

    deleteVehicle: async (id: string) => {
        return await (supabase.from('vehicles') as any)
            .delete()
            .eq('id', id);
    },

    searchVehicles: async (term: string) => {
        const sanitized = term.replace(/[%_\\*()]/g, '');
        if (!sanitized.trim()) return { data: [], error: null };

        return await (supabase.from('vehicles') as any)
            .select('*')
            .or(`make.ilike.%${sanitized}%,model.ilike.%${sanitized}%`)
            .limit(20);
    },

    // Fitment
    getFitment: async (productId: string) => {
        return await (supabase.from('product_fitment') as any)
            .select('*, vehicle:vehicles(*)')
            .eq('product_id', productId);
    },

    addFitment: async (fitmentData: any) => {
        return await (supabase.from('product_fitment') as any)
            .insert(fitmentData)
            .select('*, vehicle:vehicles(*)')
            .single();
    },

    removeFitment: async (id: string) => {
        return await (supabase.from('product_fitment') as any)
            .delete()
            .eq('id', id);
    },

    getVehicleProducts: async (vehicleId: string) => {
        return await (supabase as any).rpc('get_vehicle_products', { v_id: vehicleId });
    },
};
