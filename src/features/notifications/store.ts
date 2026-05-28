
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '../../core/utils/logger';

export interface AppNotification {
  id: string;
  companyId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: number;
  isRead: boolean;
  link?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (companyId?: string) => void;
  clearAll: (companyId?: string) => void;
  deleteNotification: (id: string) => void;
  getCompanyNotifications: (companyId: string) => AppNotification[];
  getCompanyUnreadCount: (companyId: string) => number;
  unreadCount: number;
}

// Sound notification system
interface SoundState {
  isSoundEnabled: boolean;
  hasUserInteracted: boolean;
  toggleSound: () => void;
  setUserInteracted: () => void;
  playNotificationSound: () => Promise<void>;
}


export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        if (!notification.companyId) {
          logger.warn('Notifications', 'addNotification called without companyId — skipping');
          return;
        }
        const newNotif: AppNotification = {
          ...notification,
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          isRead: false
        };

        set(state => {
          const newNotifs = [newNotif, ...state.notifications].slice(0, 20);
          // O(1) incremental update instead of O(n) full scan
          const newUnread = newNotif.isRead ? state.unreadCount : state.unreadCount + 1;
          return { notifications: newNotifs, unreadCount: newUnread };
        });

        // Play sound if enabled and user has interacted
        const soundStore = useSoundStore.getState();
        if (soundStore.isSoundEnabled && soundStore.hasUserInteracted) {
          soundStore.playNotificationSound();
        }
      },

      getCompanyNotifications: (companyId: string) => {
        return get().notifications.filter(n => n.companyId === companyId);
      },

      getCompanyUnreadCount: (companyId: string) => {
        return get().notifications.filter(n => n.companyId === companyId && !n.isRead).length;
      },

      markAsRead: (id) => {
        set(state => {
          const notif = state.notifications.find(n => n.id === id);
          if (!notif || notif.isRead) return state; // No change needed

          const newNotifs = state.notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
          );
          return {
            notifications: newNotifs,
            unreadCount: Math.max(0, state.unreadCount - 1)
          };
        });
      },

      markAllAsRead: (companyId?: string) => {
        set(state => {
          let decrement = 0;
          const newNotifs = state.notifications.map(n => {
            if ((!companyId || n.companyId === companyId) && !n.isRead) {
              decrement++;
              return { ...n, isRead: true };
            }
            return n;
          });
          return {
            notifications: newNotifs,
            unreadCount: Math.max(0, state.unreadCount - decrement)
          };
        });
      },

      deleteNotification: (id) => {
        set(state => {
          const notif = state.notifications.find(n => n.id === id);
          const newNotifs = state.notifications.filter(n => n.id !== id);
          return {
            notifications: newNotifs,
            unreadCount: Math.max(0, state.unreadCount - (notif && !notif.isRead ? 1 : 0))
          };
        });
      },

      clearAll: (companyId?: string) => set(state => {
        let removedUnread = 0;
        const remaining = companyId
          ? state.notifications.filter(n => {
            const keep = n.companyId !== companyId;
            if (!keep && !n.isRead) removedUnread++;
            return keep;
          })
          : [];
        if (!companyId) {
          removedUnread = state.unreadCount;
        }
        return {
          notifications: remaining,
          unreadCount: Math.max(0, state.unreadCount - removedUnread)
        };
      }),
    }),
    { name: 'al-zahra-notifications' }
  )
);

export const useSoundStore = create<SoundState>()(
  persist(
    (set, get) => ({
      isSoundEnabled: true,
      hasUserInteracted: false,

      toggleSound: () => {
        set(state => {
          const newValue = !state.isSoundEnabled;
          // Mark user as interacted when they toggle sound
          if (!state.hasUserInteracted) {
            return { isSoundEnabled: newValue, hasUserInteracted: true };
          }
          return { isSoundEnabled: newValue };
        });
      },

      setUserInteracted: () => set({ hasUserInteracted: true }),

      playNotificationSound: async () => {
        const state = get();
        // Don't even try if sound is disabled or no interaction yet
        if (!state.isSoundEnabled || !state.hasUserInteracted) return;

        // Modern browsers explicit gesture check to prevent harsh console warnings
        if (typeof navigator !== 'undefined' && 'userActivation' in navigator) {
          if (!(navigator as any).userActivation.hasBeenActive) return;
        }

        try {
          // Try to use the Web Audio API for a subtle notification sound
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContext) return;

          const audioContext = new AudioContext();

          // Resume context if suspended (browser autoplay policy)
          if (audioContext.state === 'suspended') {
            try {
              await audioContext.resume();
            } catch (e) {
              // If resume fails, it's almost certainly a user gesture requirement
              return;
            }
          }

          // Ensure it's active
          if (audioContext.state !== 'running') return;

          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          // Create a gentle, modern notification sound (two-tone chime)
          const now = audioContext.currentTime;

          // First tone (higher)
          oscillator.frequency.setValueAtTime(987.77, now); // B5
          oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.08);

          // Gentle envelope
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.08, now + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

          oscillator.start(now);
          oscillator.stop(now + 0.15);

          // Second tone (lower, slightly delayed for harmony)
          setTimeout(() => {
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);

            osc2.frequency.setValueAtTime(783.99, audioContext.currentTime); // G5
            gain2.gain.setValueAtTime(0, audioContext.currentTime);
            gain2.gain.linearRampToValueAtTime(0.06, audioContext.currentTime + 0.02);
            gain2.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.12);

            osc2.start(audioContext.currentTime);
            osc2.stop(audioContext.currentTime + 0.12);
          }, 60);

        } catch (error) {
          // Silently fail if audio can't be played
          logger.warn('Notifications', 'Audio playback prevented by browser policy');
        }
      },
    }),
    { name: 'al-zahra-sound-settings' }
  )
);
