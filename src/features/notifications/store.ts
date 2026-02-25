
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppNotification {
  id: string;
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
  markAllAsRead: () => void;
  clearAll: () => void;
  unreadCount: number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const newNotif: AppNotification = {
          ...notification,
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          isRead: false
        };
        set(state => ({
          notifications: [newNotif, ...state.notifications].slice(0, 50), // Keep last 50
          unreadCount: state.unreadCount + 1
        }));
      },

      markAsRead: (id) => {
        set(state => {
          const newNotifs = state.notifications.map(n => 
            n.id === id ? { ...n, isRead: true } : n
          );
          return {
            notifications: newNotifs,
            unreadCount: newNotifs.filter(n => !n.isRead).length
          };
        });
      },

      markAllAsRead: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, isRead: true })),
          unreadCount: 0
        }));
      },

      clearAll: () => set({ notifications: [], unreadCount: 0 }),
    }),
    { name: 'al-zahra-notifications' }
  )
);
