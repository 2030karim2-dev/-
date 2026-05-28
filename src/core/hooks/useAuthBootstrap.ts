import { useEffect, useRef } from 'react';
import { useAuth } from '../../features/auth/hooks';
import { useI18nStore } from '../../lib/i18nStore';
import { initAPM } from '../utils/initAPM';
import { initPerformanceMonitoring } from '../../lib/performance';

export const useAuthBootstrap = () => {
    const { initialize } = useAuth();
    const { initializeLang } = useI18nStore();
    const hasBootstrapped = useRef(false);

    useEffect(() => {
        if (hasBootstrapped.current) return;
        hasBootstrapped.current = true;
        initAPM();
        initPerformanceMonitoring();
        initialize();
        initializeLang();
    }, [initialize, initializeLang]);
};
