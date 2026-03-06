
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
  const MAX_RETRIES = 4;
  let lastError: any;

  for (let i = 0; i <= MAX_RETRIES; i++) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      try {
        timeoutController.abort('timeout');
      } catch (_) { }
    }, 45000); // Increased to 45s for slower connections

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
      // Check if navigator is available and if we are offline
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

      // ⚡ If the error is an AbortError but the EXTERNAL signal wasn't aborted, 
      // it means it was OUR internal timeout.
      const isExternalAbort = options.signal?.aborted;
      const isInternalTimeout = error.name === 'AbortError' && !isExternalAbort;

      if (isExternalAbort) {
        throw error;
      }

      // Retry on timeout or common network failures
      const errorMessage = error.message?.toLowerCase() || '';
      const isOffline = errorMessage === 'network_offline';
      const isNetworkError =
        isOffline ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('network') ||
        errorMessage.includes('failed to fetch') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('etimedout') ||
        errorMessage.includes('proxy_connection_failed') ||
        errorMessage.includes('network_changed') ||
        error.name === 'TypeError'; // TypeError is usually a network failure in fetch

      if (i < MAX_RETRIES && (isInternalTimeout || isNetworkError)) {
        const reason = isInternalTimeout ? 'timeout' : (isOffline ? 'offline' : (errorMessage.includes('proxy') ? 'proxy error' : 'network instability'));
        logger.warn('Supabase', `Request failed (${reason}), retrying ${i + 1}/${MAX_RETRIES}...`, { attempt: i + 1, error });

        // Exponential backoff with jitter
        const backoff = (Math.pow(2, i) * 1000) + Math.random() * 1000;

        // If offline, wait a bit longer or wait for online event? 
        // For now just wait the backoff.
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
