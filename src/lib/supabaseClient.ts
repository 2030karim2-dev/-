
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../core/database.types';

// تكوين الاتصال من متغيرات البيئة
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment variables.');
}

export const isSupabasePlaceholder = false;

// Custom fetch with timeout and retry logic
const customFetch = async (url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // If it's an abort error (timeout), try once more
    if (error.name === 'AbortError') {
      console.warn('[Supabase] Request timeout, retrying...');
      const retryController = new AbortController();
      const retryTimeoutId = setTimeout(() => retryController.abort(), 30000);

      try {
        const retryResponse = await fetch(url, {
          ...options,
          signal: retryController.signal,
        });
        clearTimeout(retryTimeoutId);
        return retryResponse;
      } catch (retryError: any) {
        clearTimeout(retryTimeoutId);
        throw new Error(`[Supabase] Request failed after retry: ${retryError.message}`);
      }
    }

    throw error;
  }
};

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'alz_auth_session',
    },
    global: {
      fetch: customFetch,
      headers: {
        'x-application-name': 'alzahra-smart-erp-v5-prod',
      },
    },
    db: {
      schema: 'public',
    },
    // Add retry configuration
    realtime: {
      timeout: 30000,
    },
  }
);

// Export a helper function to handle auth errors gracefully
export const handleSupabaseError = (error: any): { message: string; isAuthError: boolean } => {
  const errorMessage = error?.message || error?.error_description || 'Unknown error occurred';
  const isAuthError = errorMessage.includes('token') || errorMessage.includes('auth') || errorMessage.includes('JWT');

  return {
    message: isAuthError
      ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
      : errorMessage,
    isAuthError
  };
};
