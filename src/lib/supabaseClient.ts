
import { createClient } from '@supabase/supabase-js';
import { Database } from '../core/database.types';

// تكوين الاتصال من متغيرات البيئة
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment variables.');
}

export const isSupabasePlaceholder = false;

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'alz_auth_session'
    },
    global: {
      headers: {
        'x-application-name': 'alzahra-smart-erp-v5-prod',
      },
    },
    db: {
      schema: 'public',
    },
  }
);
