
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { persister } from './persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // ⚡ Keep data fresh throughout the session
      gcTime: 1000 * 60 * 60 * 48, // Keep in cache for 48 hours
      retry: (failureCount, error: any) => {
        // ⚡ عدم إعادة المحاولة لأخطاء المصادقة - توجيه فوري للواجهة
        const code = error?.code || error?.status || '';
        const msg = (error?.message || '').toLowerCase();
        if (
          code === 401 || code === 403 ||
          code === 'PGRST301' ||
          msg.includes('jwt expired') ||
          msg.includes('refresh token') ||
          msg.includes('not authenticated')
        ) {
          return false; // لا تعيد المحاولة
        }
        return failureCount < 1; // محاولة واحدة فقط للأخطاء الأخرى
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false, // ⚡ Prevent re-fetching when navigating back to a page
      refetchOnReconnect: false, // Prevent re-fetching on network reconnect (offline-first focus)
    },
    mutations: {
      networkMode: 'always',
    },
  },
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: Infinity,
});
