
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
  const MAX_RETRIES = 3;
  let lastError: any;

  for (let i = 0; i <= MAX_RETRIES; i++) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      try {
        timeoutController.abort('timeout');
      } catch (_) { /* ignore */ }
    }, 30000);

    // Merge signals if options.signal exists
    let signal = timeoutController.signal;
    if (options.signal) {
      // If signal is already aborted, silently bail out
      if (options.signal.aborted) {
        clearTimeout(timeoutId);
        // Return a dummy response instead of throwing to prevent unhandled rejections
        // This happens during HMR and auth token refresh
        throw new DOMException('Request aborted', 'AbortError');
      }
      options.signal.addEventListener('abort', () => {
        try {
          timeoutController.abort(options.signal?.reason || 'signal-merge');
        } catch (_) { /* ignore */ }
      }, { once: true });
    }

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('network_offline');
      }

      const response = await fetch(url, {
        ...options,
        signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Gracefully handle AbortErrors - these happen during:
      // 1. Supabase auth token refresh (internal signal abort)
      // 2. Vite HMR module reloads (component unmount mid-request)
      // 3. Navigation away during pending requests
      if (error.name === 'AbortError') {
        // If it was an external abort (caller cancelled), re-throw it
        if (options.signal?.aborted) {
          throw error;
        }
        // For internal timeouts, continue to retry
        // For other AbortErrors (no reason), just throw without retry
        if (!error.message?.includes('timeout')) {
          throw error;
        }
      }

      const errorMessage = error.message?.toLowerCase() || '';
      const isOffline = errorMessage === 'network_offline';
      const isNetworkError =
        isOffline ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('network') ||
        errorMessage.includes('failed to fetch') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('etimedout') ||
        error.name === 'TypeError';

      if (i < MAX_RETRIES && isNetworkError) {
        const reason = isOffline ? 'offline' : 'network instability';
        logger.warn('Supabase', `Request failed (${reason}), retrying ${i + 1}/${MAX_RETRIES}...`, { attempt: i + 1 });

        const backoff = (Math.pow(2, i) * 1000) + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, backoff));
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
      timeout: 45000,
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
