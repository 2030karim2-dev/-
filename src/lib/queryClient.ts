
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { persister } from './persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // البيانات تعتبر قديمة فوراً لضمان التحديث
      gcTime: 1000 * 60 * 60, // الاحتفاظ بالكاش لمدة ساعة
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
      refetchOnWindowFocus: true,
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
