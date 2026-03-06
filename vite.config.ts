
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['stream', 'buffer', 'process', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-icon-512.png'],
      manifest: {
        name: 'نظام الزهراء الذكي',
        short_name: 'الزهراء ERP',
        description: 'نظام إدارة المبيعات والمخزون والمحاسبة الذكي',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve((process as any).cwd(), './src'),
    },
  },
  define: {
    'process.env': {},
  },
  optimizeDeps: {
    include: ['stream', 'buffer', 'process'],
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
          if (id.includes('node_modules/xlsx-js-style') ||
            id.includes('node_modules/jspdf') ||
            id.includes('node_modules/html2canvas')) {
            return 'vendor-heavy-utils';
          }
        },
      },
    },
  },
});
