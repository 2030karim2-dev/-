
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve((process as any).cwd(), './src'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000, // رفع حد التحذير
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 1. فصل مكتبات React الأساسية
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          // 2. فصل مكتبات البيانات (Supabase, Query, Zustand)
          if (id.includes('node_modules/@supabase') || 
              id.includes('node_modules/@tanstack') || 
              id.includes('node_modules/zustand')) {
            return 'vendor-data';
          }
          // 3. فصل مكتبات الرسوم البيانية والأيقونات
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // 4. فصل المكتبات الثقيلة جداً (PDF, Excel) لتتحمل فقط عند الحاجة
          if (id.includes('node_modules/xlsx') || 
              id.includes('node_modules/jspdf') || 
              id.includes('node_modules/html2canvas')) {
            return 'vendor-heavy-utils';
          }
        },
      },
    },
  },
});
