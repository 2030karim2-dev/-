import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFeedbackStore } from '../../features/feedback/store';

export const useServiceWorkerSync = () => {
    const queryClient = useQueryClient();
    const { showToast } = useFeedbackStore();

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;
        const handleMessage = async (event: MessageEvent) => {
            if (event.data?.type === 'REPLAY_ACTIONS') {
                // ... same logic as before but with PRECISE invalidation:
                if (event.data?.success) {
                    await queryClient.invalidateQueries({ queryKey: ['sales'] });
                    await queryClient.invalidateQueries({ queryKey: ['inventory'] });
                    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                    // ❌ لا تستخدم queryClient.invalidateQueries() بدون queryKey
                }
            }
        };
        navigator.serviceWorker.addEventListener('message', handleMessage);
        return () => { navigator.serviceWorker.removeEventListener('message', handleMessage); };
    }, [queryClient, showToast]);
};
