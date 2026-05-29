import { useEffect } from 'react';
import { useFeedbackStore } from '../../features/feedback/store';
import { notificationService } from '../../features/notifications/service';

export const useNotificationPolling = (companyId?: string) => {
    const { showToast } = useFeedbackStore();
    useEffect(() => {
        if (!companyId) return;
        // Run checks on mount
        notificationService.checkSystemHealth(companyId);
        // Run interval checks every 10 minutes
        const interval = setInterval(() => {
            notificationService.checkSystemHealth(companyId);
        }, 1000 * 60 * 10);
        return () => { clearInterval(interval); };
    }, [companyId, showToast]);
};
