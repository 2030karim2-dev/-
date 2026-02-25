
import { create } from 'zustand';
import { AuthUser } from './types';
import { supabase } from '../../lib/supabaseClient';
import { authApi } from './api';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _authSubscription: { unsubscribe: () => void } | null;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  _authSubscription: null,

  login: (user) => set({ user, isAuthenticated: true, isLoading: false }),

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  initialize: async () => {
    // Avoid double initialization
    if (get().isAuthenticated && get().user && !get().isLoading) return;

    try {
      set({ isLoading: true });

      // 1. التحقق من الجلسة الحالية مع معالجة التوكن المنتهي
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      // ⚡ إذا فشل الـ Refresh Token، مسح الجلسة فوراً بدل الانتظار
      if (sessionError) {
        console.warn('[Auth] Session check failed, clearing stale token:', sessionError.message);
        await supabase.auth.signOut({ scope: 'local' });
        set({ user: null, isAuthenticated: false, isLoading: false });
        // Continue to set up the listener below
      } else if (session?.user) {
        // 2. جلب ملف المستخدم الكامل
        const { data: profile } = await authApi.getProfile(session.user.id);

        if (profile) {
          set({
            user: profile as AuthUser,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // Fallback if no profile exists yet
          set({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || '',
              role: 'viewer',
            },
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }

      // 3. Unsubscribe from previous listener if exists
      const prev = get()._authSubscription;
      if (prev) prev.unsubscribe();

      // 4. الاستماع لتغييرات الجلسة مع معالجة أخطاء التوكن
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          set({ user: null, isAuthenticated: false, isLoading: false });
        } else if (event === 'TOKEN_REFRESHED') {
          // ⚡ التوكن تجدد بنجاح - تحديث الملف الشخصي إذا لم يكن محمّل
          if (!get().user && session.user) {
            const { data: profile } = await authApi.getProfile(session.user.id);
            if (profile) {
              set({ user: profile as AuthUser, isAuthenticated: true, isLoading: false });
            }
          }
        } else if (event === 'SIGNED_IN') {
          if (session.user) {
            const { data: profile } = await authApi.getProfile(session.user.id);
            if (profile) {
              set({
                user: profile as AuthUser,
                isAuthenticated: true,
                isLoading: false,
              });
            }
          }
        }
      });

      set({ _authSubscription: subscription });

    } catch (err) {
      console.error('[Auth] Initialization error:', err);
      // ⚡ مسح التوكن الفاسد عند أي خطأ غير متوقع
      try { await supabase.auth.signOut({ scope: 'local' }); } catch (_) { }
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
