
import { supabase } from '../../lib/supabaseClient';

export const authApi = {
  signInWithPassword: async (email: string, pass: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
  },

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

  getProfile: async (userId: string) => {
    try {
      // 1. Try RPC first
      const { data, error } = await (supabase.rpc as any)('get_user_profile', {
        p_user_id: userId,
      });

      if (!error && data && Object.keys(data).length > 2) {
        return { data, error: null };
      }

      // 2. Fallback: Manual fetch if RPC fails (e.g. timeout or connection closed)
      console.warn('[Auth] RPC get_user_profile issues, attempting manual fallback...');

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
        full_name: profileData?.full_name || '',
        avatar_url: profileData?.avatar_url,
        role: (roleRes.data as any)?.role || 'viewer',
        company_id: (roleRes.data as any)?.company_id,
        company_name: (roleRes.data as any)?.companies?.name_ar,
      };

      return { data: fallbackData, error: null };
    } catch (err) {
      console.error('[Auth] Profile fetch exception:', err);
      return { data: null, error: err as any };
    }
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
