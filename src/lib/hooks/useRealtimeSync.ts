import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { invalidateByPreset, invalidateKeys, InvalidationPreset } from '../../lib/invalidation';
import { useAuthStore } from '../../features/auth/store';
import { logger } from '../../core/utils/logger';

// Map database tables to invalidation presets
const TABLE_PRESET_MAP: Record<string, InvalidationPreset> = {
    'invoices': 'sale',
    'invoice_items': 'sale',
    'payments': 'account',
    'expenses': 'expense',
    'journal_entries': 'journal',
    'products': 'inventory',
    'parties': 'party',
    'companies': 'settings',
    'product_categories': 'inventory',
    'warehouses': 'settings',
    'expense_categories': 'expense'
};

export const useRealtimeSync = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    useEffect(() => {
        // Only connect if user is logged in
        if (!user?.company_id) return;

        logger.debug('Realtime', '🔌 Connecting to Supabase Realtime for auto-refresh...');

        const channel = supabase.channel('global-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public' },
                (payload) => {
                    const table = payload.table;
                    const preset = TABLE_PRESET_MAP[table];

                    if (preset) {
                        logger.info('Realtime', `🔄 Realtime update on table [${table}], refreshing queries...`);
                        invalidateByPreset(queryClient, preset);
                    } else {
                        // Fallback for unmapped tables that might still need dashboard refresh
                        logger.debug('Realtime', `🔄 Unmapped Realtime update on table [${table}], refreshing dashboard...`);
                        invalidateKeys(queryClient, ['dashboard_data', 'dashboard']);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    logger.debug('Realtime', '✅ Realtime Active');
                }
            });

        return () => {
            logger.debug('Realtime', '🔌 Disconnecting from Supabase Realtime...');
            supabase.removeChannel(channel);
        };
    }, [queryClient, user?.company_id]);
};
