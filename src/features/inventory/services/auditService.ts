// Audit Service - Handles stock audit operations
import { supabase } from '../../../lib/supabaseClient';

interface AuditItemInput {
    id?: string;
    product_id: string;
    counted_quantity: number;
}

export const auditService = {
    /**
     * Start a new audit session
     */
    startAudit: async (data: { warehouse_id: string; title: string }, companyId: string, userId: string) => {
        const response = await supabase
            .from('audit_sessions')
            .insert({
                company_id: companyId,
                warehouse_id: data.warehouse_id,
                title: data.title,
                created_by: userId,
                status: 'active'
            })
            .select()
            .single();

        const session = response.data as unknown as { id: string };
        const error = response.error;

        if (error) throw error;

        const { data: products } = await supabase
            .from('product_stock')
            .select('product_id, quantity')
            .eq('warehouse_id', data.warehouse_id);

        if (products && products.length > 0) {
            const auditItems = products.map((p: { product_id: string; quantity: number }) => ({
                session_id: session.id,
                product_id: p.product_id,
                expected_quantity: p.quantity
            }));
            await supabase.from('audit_items').insert(auditItems);
        }

        return session;
    },

    /**
     * Finalize an audit session
     */
    finalizeAudit: async (sessionId: string, items: AuditItemInput[], userId: string) => {
        const { error } = await supabase.rpc('finalize_audit_session', {
            p_session_id: sessionId,
            p_user_id: userId,
            p_items: items.map(i => ({ product_id: i.product_id, counted_quantity: i.counted_quantity }))
        });
        if (error) throw error;
    },

    /**
     * Get all audit sessions for a company
     */
    getAuditSessions: async (companyId: string) => {
        const { data, error } = await supabase.from('audit_sessions')
            .select('*, warehouses(name_ar)')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map((s: Record<string, unknown>) => ({
            ...s,
            warehouse_name: (s.warehouses as { name_ar?: string })?.name_ar
        }));
    },

    /**
     * Get details of a specific audit session
     */
    getAuditSessionDetails: async (sessionId: string) => {
        const { data: sessionRaw, error: sError } = await supabase
            .from('audit_sessions')
            .select('*, warehouses(name_ar)')
            .eq('id', sessionId)
            .single();
        if (sError) throw sError;
        const session = sessionRaw as Record<string, unknown>;

        const { data: items, error: iError } = await supabase.from('audit_items')
            .select('*, products(*, product_categories(name))')
            .eq('session_id', sessionId);
        if (iError) throw iError;

        return {
            session: { ...session, warehouse_name: (session?.warehouses as { name_ar?: string })?.name_ar } as Record<string, unknown>,
            items: (items || []).map((i: Record<string, unknown>) => {
                const pRaw = i.products as any;
                const p = Array.isArray(pRaw) ? pRaw[0] : pRaw;
                
                return {
                    ...i,
                    products: { 
                        name: p?.name_ar || 'بدون اسم', 
                        sku: p?.sku || '---',
                        part_number: p?.part_number || null,
                        brand: p?.brand || null,
                        size: p?.size || null,
                        category: p?.product_categories?.name || 'عام'
                    }
                };
            })
        };
    },

    /**
     * Save audit progress
     */
    saveAuditProgress: async (items: AuditItemInput[]) => {
        const updates = items.map(i => ({
            id: i.id,
            counted_quantity: i.counted_quantity
        }));
        const { error } = await supabase.from('audit_items').upsert(updates as any); // using any for now since upsert requires full type OR we can map it.
        if (error) throw error;
    }
};

export default auditService;
