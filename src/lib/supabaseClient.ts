
import { createClient } from '@supabase/supabase-js';
import { Database } from '../core/database.types';
import { logger } from '../core/utils/logger';

// تكوين الاتصال من متغيرات البيئة
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment variables.');
}

export const isSupabasePlaceholder = false;

// Custom fetch with timeout and retry logic
const customFetch = async (url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
  const MAX_RETRIES = 2;
  let lastError: any;

  for (let i = 0; i <= MAX_RETRIES; i++) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      try {
        timeoutController.abort('timeout');
      } catch (_) { }
    }, 30000);

    // Merge signals if options.signal exists
    let signal = timeoutController.signal;
    if (options.signal) {
      if (options.signal.aborted) {
        clearTimeout(timeoutId);
        throw options.signal.reason || new DOMException('Request aborted', 'AbortError');
      }
      options.signal.addEventListener('abort', () => {
        try {
          timeoutController.abort(options.signal?.reason || 'signal-merge');
        } catch (_) { }
      }, { once: true });
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);

      // ⚡ If the error is an AbortError but the EXTERNAL signal wasn't aborted, 
      // it means it was OUR internal timeout.
      const isExternalAbort = options.signal?.aborted;
      const isInternalTimeout = error.name === 'AbortError' && !isExternalAbort;

      if (isExternalAbort) {
        // Silently exit or return a special "aborted" response
        throw error;
      }

      // Retry on timeout or generic network failures (like ERR_NETWORK_CHANGED)
      const isNetworkError = error.message?.includes('fetch') || error.message?.includes('network');

      // Use internal timeout flag to provide better logging if needed
      if (isInternalTimeout) {
        // We could log specifically that OUR timeout hit, but for now we follow general flow
      }

      if (i < MAX_RETRIES && (isInternalTimeout || isNetworkError)) {
        logger.warn('Supabase', `Request failed (${error.message}), retrying ${i + 1}/${MAX_RETRIES}...`, { attempt: i + 1, error });
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, i * 1000 + 500));
        continue;
      }

      lastError = error;
      break;
    }
  }

  throw lastError;
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
