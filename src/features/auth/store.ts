
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from './types';
import { supabase } from '../../lib/supabaseClient';
import { authApi } from './api';
import { queryClient } from '../../lib/queryClient';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isReady: boolean;
  _authSubscription: { unsubscribe: () => void } | null;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

//_TIMEOUT for session check
const SESSION_CHECK_TIMEOUT = 5000; // 5 seconds

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isReady: false,
      _authSubscription: null,

      login: (user) => set({ user, isAuthenticated: true, isLoading: false, isReady: true }),

      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.error('[Auth] Sign out error:', err);
        } finally {
          // Clear all React Query cache on logout
          queryClient.clear();
          set({ user: null, isAuthenticated: false, isLoading: false, isReady: true });
        }
      },

      initialize: async () => {
        // If we have a persisted user, trust it temporarily while we verify with server
        const persistedUser = get().user;
        if (persistedUser && get().isAuthenticated) {
          // Keep persisted user active, just mark as ready so UI doesn't block
          set({ isLoading: false, isReady: true });
        }

        try {
          if (!persistedUser) {
            set({ isLoading: true });
          }

          // 1. Create a timeout promise
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Session check timeout')), SESSION_CHECK_TIMEOUT)
          );

          // 2. Try to get session with timeout
          let session = null;
          let sessionError = null;

          try {
            const sessionPromise = supabase.auth.getSession();
            const result = await Promise.race([sessionPromise, timeoutPromise]);
            session = (result as any).data?.session;
            sessionError = (result as any).error;
          } catch (timeoutError: any) {
            console.warn('[Auth] Session check timed out, using cached session');
            // If we had a persisted user, keep it; otherwise try once more
            if (persistedUser) {
              set({ isLoading: false, isReady: true });
              // Still set up the listener below
            } else {
              try {
                const { data: cachedSession } = await supabase.auth.getSession();
                session = cachedSession?.session;
              } catch (_) {
                // Give up
              }
            }
          }

          // ⚡ إذا فشل الـ Refresh Token، مسح الجلسة فوراً
          if (sessionError) {
            console.warn('[Auth] Session check failed, clearing stale token:', sessionError.message);
            await supabase.auth.signOut({ scope: 'local' });
            queryClient.clear();
            set({ user: null, isAuthenticated: false, isLoading: false, isReady: true });
          } else if (session?.user) {
            // 2. جلب ملف المستخدم الكامل مع timeout
            let profile = null;
            try {
              const profilePromise = authApi.getProfile(session.user.id);
              const profileTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
              );
              const profileResult = await Promise.race([profilePromise, profileTimeout]);
              profile = (profileResult as any)?.data || profileResult;
            } catch (profileError: any) {
              console.warn('[Auth] Profile fetch failed:', profileError.message);
              // If we have persisted user, keep using it
              if (persistedUser) {
                set({ isLoading: false, isReady: true });
              }
            }

            if (profile && typeof profile === 'object' && profile.id) {
              set({
                user: profile as AuthUser,
                isAuthenticated: true,
                isLoading: false,
                isReady: true,
              });
              // Invalidate all queries to refresh data with the valid session
              queryClient.invalidateQueries();
            } else if (!persistedUser) {
              // Fallback if no profile exists yet and no persisted user
              set({
                user: {
                  id: session.user.id,
                  email: session.user.email || '',
                  full_name: session.user.user_metadata?.full_name || '',
                  role: 'viewer',
                },
                isAuthenticated: true,
                isLoading: false,
                isReady: true,
              });
              queryClient.invalidateQueries();
            }
          } else if (!persistedUser) {
            set({ user: null, isAuthenticated: false, isLoading: false, isReady: true });
          } else {
            // No session but we have persisted user - session might have expired
            // Clear the persisted user since Supabase says no session
            queryClient.clear();
            set({ user: null, isAuthenticated: false, isLoading: false, isReady: true });
          }

          // 3. Unsubscribe from previous listener if exists
          const prev = get()._authSubscription;
          if (prev) prev.unsubscribe();

          // 4. الاستماع لتغييرات الجلسة مع معالجة جميع الأحداث
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[Auth] State change event:', event);

            if (event === 'SIGNED_OUT' || !session) {
              queryClient.clear();
              set({ user: null, isAuthenticated: false, isLoading: false, isReady: true });

            } else if (event === 'INITIAL_SESSION') {
              // ⚡ حدث جديد - يُطلق عند إعادة تحميل الصفحة
              if (session.user && !get().user) {
                try {
                  const profileResult = await authApi.getProfile(session.user.id);
                  const profile = (profileResult as any)?.data || profileResult;
                  if (profile && typeof profile === 'object' && profile.id) {
                    set({ user: profile as AuthUser, isAuthenticated: true, isLoading: false, isReady: true });
                    queryClient.invalidateQueries();
                  }
                } catch (e) {
                  console.warn('[Auth] Profile fetch after INITIAL_SESSION failed');
                }
              }

            } else if (event === 'TOKEN_REFRESHED') {
              // ⚡ التوكن تجدد بنجاح - تحديث الملف الشخصي إذا لم يكن محمّل
              if (!get().user && session.user) {
                try {
                  const profileResult = await authApi.getProfile(session.user.id);
                  const profile = (profileResult as any)?.data || profileResult;
                  if (profile && typeof profile === 'object' && profile.id) {
                    set({ user: profile as AuthUser, isAuthenticated: true, isLoading: false, isReady: true });
                    queryClient.invalidateQueries();
                  }
                } catch (e) {
                  console.warn('[Auth] Profile fetch after token refresh failed');
                }
              }

            } else if (event === 'SIGNED_IN') {
              if (session.user) {
                try {
                  const profileResult = await authApi.getProfile(session.user.id);
                  const profile = (profileResult as any)?.data || profileResult;
                  if (profile && typeof profile === 'object' && profile.id) {
                    set({
                      user: profile as AuthUser,
                      isAuthenticated: true,
                      isLoading: false,
                      isReady: true,
                    });
                    queryClient.invalidateQueries();
                  }
                } catch (e) {
                  console.warn('[Auth] Profile fetch after sign in failed');
                }
              }
            }
          });

          set({ _authSubscription: subscription });

        } catch (err) {
          console.error('[Auth] Initialization error:', err);
          // ⚡ مسح التوكن الفاسد عند أي خطأ غير متوقع
          try { await supabase.auth.signOut({ scope: 'local' }); } catch (_) { }
          queryClient.clear();
          set({ user: null, isAuthenticated: false, isLoading: false, isReady: true });
        }
      }
    }),
    {
      name: 'alzhra-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
