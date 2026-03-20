import { supabase } from '../../lib/supabaseClient';
import { logger } from '../../core/utils/logger';

// Registry to deduplicate in-flight profile requests
const profileRequests = new Map<string, Promise<{ data: any, error: any, isAborted?: boolean }>>();

export const authApi = {
  signInWithPassword: async (email: string, pass: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
  },

  signInWithGoogle: async (redirectTo?: string) => {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  },

  // --- MFA Methods ---
  enrollMFA: async () => {
    return await supabase.auth.mfa.enroll({
      factorType: 'totp'
    });
  },

  challengeMFA: async (factorId: string) => {
    return await supabase.auth.mfa.challenge({ factorId });
  },

  verifyMFA: async (factorId: string, challengeId: string, code: string) => {
    return await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code
    });
  },
  // -------------------

  signUp: async (email: string, pass: string, companyName: string, fullName: string) => {
    // Ensure values are strings and trimmed
    const cleanFullName = String(fullName || '').trim();
    const cleanCompanyName = String(companyName || '').trim();

    return await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: cleanFullName,
          company_name: cleanCompanyName,
        }
      }
    });
  },

  getProfile: async (userId: string): Promise<{ data: any, error: any, isAborted?: boolean }> => {
    // 1. Check if a request for this user is already in progress
    if (profileRequests.has(userId)) {
      return profileRequests.get(userId)!;
    }

    const fetchPromise = (async () => {
      try {
        // 1. Try RPC first
        const { data, error } = await (supabase.rpc as any)('get_user_profile', {
          p_user_id: userId,
        });

        if (!error && data && Object.keys(data).length > 2) {
          return { data, error: null };
        }

        // 2. Fallback: Manual fetch if RPC fails (e.g. timeout or connection closed)
        if (error) {
          // ⚡ Skip warning for abortions as they are expected during concurrency
          const isAbort = error.name === 'AbortError' || error.message?.includes('aborted') || error.message === 'signal is aborted without reason';

          if (isAbort) {
            return { data: null, error: null, isAborted: true };
          }

          logger.warn('Auth', `RPC get_user_profile failed (${error.code}: ${error.message}), failing back to manual`, {
            code: error.code,
            message: error.message,
            details: error.details
          });
        } else {
          logger.warn('Auth', 'RPC get_user_profile returned incomplete data, attempting manual fallback');
        }

        const [profileRes, roleRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.from('user_company_roles').select('role, company_id, companies(name_ar)').eq('user_id', userId).single()
        ]);

        if (profileRes.error) {
          return { data: null, error: profileRes.error };
        }

        const profileData = profileRes.data as any;

        // Get email from session user if missing
        const { data: { user } } = await supabase.auth.getUser();

        const fallbackData = {
          id: userId,
          email: user?.email || '',
          full_name: profileData?.full_name || user?.user_metadata?.full_name || '',
          avatar_url: profileData?.avatar_url || user?.user_metadata?.avatar_url,
          role: (roleRes.data as any)?.role || 'viewer',
          company_id: (roleRes.data as any)?.company_id,
          company_name: (roleRes.data as any)?.companies?.name_ar,
        };

        return { data: fallbackData, error: null };
      } catch (err: unknown) {
        // ⚡ Handle AbortError gracefully (common in concurrent auth checks)
        const error = err as Error;
        if (error?.name === 'AbortError' || error?.message?.includes('aborted') || error?.message === 'signal is aborted without reason') {
          return { data: null, error: null, isAborted: true }; // Flag as aborted
        }

        logger.error('Auth', 'Profile fetch exception', error);
        return { data: null, error: err };
      } finally {
        // 3. Clear request from registry once finished/failed
        profileRequests.delete(userId);
      }
    })() as Promise<{ data: any, error: any, isAborted?: boolean }>;

    // Store promise in registry
    profileRequests.set(userId, fetchPromise);
    return fetchPromise;
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  resetPasswordForEmail: async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email);
  },

  updateUserPassword: async (password: string) => {
    return await supabase.auth.updateUser({ password });
  },

  // Note: inviteUser moved to settingsApi.inviteUser (includes created_by field)
};
