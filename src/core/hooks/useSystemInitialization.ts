import { useEffect } from 'react';
import { useAuth } from '../../features/auth/hooks';
import { useAuthStore } from '../../features/auth/store';
import { useCommandPalette } from '../../features/command/hooks';
import { useI18nStore } from '../../lib/i18nStore';
import { useQueryClient } from '@tanstack/react-query';
import { offlineService } from '../../lib/offlineService';
import { salesService } from '../../features/sales/service';
import { useFeedbackStore } from '../../features/feedback/store';
import { notificationService } from '../../features/notifications/service';
import { useLocalizationSettings } from '../../features/settings/settingsStore';

export const useSystemInitialization = () => {
  const { initialize } = useAuth();
  const { user } = useAuthStore();
  const { openPalette } = useCommandPalette();
  const { initializeLang, setLang } = useI18nStore();
  const queryClient = useQueryClient();
  const { showToast } = useFeedbackStore();
  const localizationSettings = useLocalizationSettings();

  // 1. Initialize Auth & Language
  useEffect(() => {
    initialize();
    initializeLang();
    // Apply localization settings from settings store
    if (localizationSettings?.default_language) {
      setLang(localizationSettings.default_language);
    }
  }, [initialize, initializeLang, setLang, localizationSettings?.default_language]);

  // 2. Smart Notifications & Health Check
  useEffect(() => {
    if (user?.company_id) {
      // Run checks on mount
      notificationService.checkSystemHealth(user.company_id);

      // Run interval checks every 10 minutes
      const interval = setInterval(() => {
        notificationService.checkSystemHealth(user.company_id!);
      }, 1000 * 60 * 10);

      return () => clearInterval(interval);
    }
  }, [user?.company_id]);

  // 3. Global Keyboard Shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openPalette();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openPalette]);

  // 4. Background Synchronization (Service Worker)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'REPLAY_ACTIONS') {
          showToast('إعادة الاتصال بالشبكة، جاري مزامنة البيانات...', 'info');
          const actions = event.data.payload || [];
          let success = true;
          for (const action of actions) {
            try {
              switch (action.type) {
                case 'CREATE_INVOICE':
                  // Fix: Corrected method name from createInvoice to processNewSale and fixed argument ordering
                  await salesService.processNewSale(action.payload.companyId, action.payload.userId, action.payload.data);
                  break;
                // Future: Add cases for CREATE_PURCHASE, etc.
              }
            } catch (error) {
              success = false;
              console.error('Failed to replay action:', action, error);
              showToast(`فشل مزامنة العملية: ${action.type}`, 'error');
              break; // Stop replaying sequence on failure
            }
          }

          if (success) {
            await offlineService.clearQueue();
            showToast('تمت مزامنة جميع البيانات بنجاح!', 'success');
            await queryClient.invalidateQueries(); // Refresh all data
          }
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, [queryClient, showToast]);
};