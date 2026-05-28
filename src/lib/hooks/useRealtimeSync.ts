import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { InvalidationPreset, INVALIDATION_PRESETS } from '../../lib/invalidation';
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

// Using 'any' for global to avoid complex typing for this specific fix
const globalAny = window as any;

export const useRealtimeSync = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    // useRef to prevent double-subscription in React StrictMode and track lifecycle
    const channelRef = useRef<any>(null);
    const subscribedRef = useRef(false);

    // Batch invalidation state
    const pendingChangesRef = useRef(new Set<string>());
    const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const BATCH_DEBOUNCE_MS = 5000;

    const flushInvalidations = useCallback(() => {
        const pendingChanges = pendingChangesRef.current;
        if (pendingChanges.size === 0) return;

        // Group by preset to avoid duplicate invalidations
        const presetsToInvalidate = new Set<InvalidationPreset>();

        pendingChanges.forEach(table => {
            const preset = (TABLE_PRESET_MAP as any)[table];
            if (preset) presetsToInvalidate.add(preset);
        });

        presetsToInvalidate.forEach(preset => {
            // Use precise invalidation with type: 'active' to only invalidate observed queries
            const keys = INVALIDATION_PRESETS[preset];
            keys.forEach((key: string) => {
                queryClient.invalidateQueries({ queryKey: [key], type: 'active' });
            });
        });

        pendingChanges.clear();
        if (batchTimerRef.current) {
            clearTimeout(batchTimerRef.current);
            batchTimerRef.current = null;
        }
    }, [queryClient]);

    useEffect(() => {
        if (!user?.company_id || subscribedRef.current) return;

        const companyId = user.company_id;
        const channelId = `global-sync-${companyId}`;

        // Initialize global registry if not exists
        if (!globalAny.__ALZ_CHANNELS__) {
            globalAny.__ALZ_CHANNELS__ = new Map<string, any>();
        }

        const registry = globalAny.__ALZ_CHANNELS__;

        // Check if channel already exists in registry (prevents duplicates)
        if (registry.has(channelId)) {
            logger.debug('Realtime', `♻️ Reusing existing channel for company [${companyId}]`);
            return;
        }

        logger.debug('Realtime', `🔌 Initializing persistent channel for company [${companyId}]`);

        const channel = supabase.channel(channelId)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    filter: `company_id=eq.${companyId}`,
                },
                (payload: any) => {
                    pendingChangesRef.current.add(payload.table);

                    if (!batchTimerRef.current) {
                        batchTimerRef.current = setTimeout(flushInvalidations, BATCH_DEBOUNCE_MS);
                    }

                    // Immediate flush if critical table (e.g., invoices during POS)
                    if (payload.table === 'invoices' || payload.table === 'products') {
                        flushInvalidations();
                    }
                }
            );

        channel.subscribe((status: any) => {
            if (status === 'SUBSCRIBED') {
                logger.debug('Realtime', '✅ Realtime Connection Active');
            }
        });

        registry.set(channelId, channel);
        channelRef.current = channel;
        subscribedRef.current = true;

        // Proper cleanup: remove channel on unmount or when companyId changes
        return () => {
            if (channelRef.current) {
                logger.debug('Realtime', `🧹 Cleaning up channel for company [${companyId}]`);
                supabase.removeChannel(channelRef.current);
                registry.delete(channelId);
                channelRef.current = null;
                subscribedRef.current = false;
            }
            if (batchTimerRef.current) {
                clearTimeout(batchTimerRef.current);
                batchTimerRef.current = null;
            }
        };
    }, [queryClient, user?.company_id, flushInvalidations]);
};
