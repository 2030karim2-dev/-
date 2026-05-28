import { useEffect } from 'react';
import { useAuthStore } from '../../features/auth/store';
import { useSoundStore } from '../../features/notifications/store';
import { useAuthBootstrap } from './useAuthBootstrap';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useNotificationPolling } from './useNotificationPolling';
import { useServiceWorkerSync } from './useServiceWorkerSync';
import { useRealtimeSync } from '../../lib/hooks/useRealtimeSync';

export const useSystemInitialization = () => {
  const { setUserInteracted } = useSoundStore();
  const { user } = useAuthStore();

  // Initialize all specialized hooks
  useAuthBootstrap();
  useKeyboardShortcuts();
  useNotificationPolling(user?.company_id);
  useServiceWorkerSync();
  useRealtimeSync();

  // Track first user interaction for AudioContext / Autoplay policies
  useEffect(() => {
    const handleInteraction = () => {
      setUserInteracted();
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [setUserInteracted]);
};
