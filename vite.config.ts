import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig } from 'vite';
import { APP_NAME, APP_SHORT_NAME, APP_TAGLINE } from './src/constants/appMeta';
import { injectCspMeta } from './src/utils/security/csp';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        // R32: سياسة أمان المحتوى تُحقن في نسخة الإنتاج فقط (خادم التطوير يحقن سكربتات HMR مضمَّنة).
        name: 'inject-csp',
        apply: 'build' as const,
        transformIndexHtml(html: string) {
          return injectCspMeta(html);
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: APP_NAME,
          short_name: APP_SHORT_NAME,
          description: APP_TAGLINE,
          theme_color: '#0d6854',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          dir: 'rtl',
          lang: 'ar',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        output: {
          // R58: مفتاح المسار لا يطابق دائماً "react" في Rollup، فكان chunk فارغاً.
          // التصنيف حسب المعرّف الفعلي يبقي React مشتركاً، ويترك xlsx/recharts ديناميكيتين
          // ما دامت الشاشات التي تحتاجهما لم تُزر.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (
              id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }
            if (id.includes('/node_modules/xlsx/')) return 'vendor-xlsx';
            if (id.includes('/node_modules/recharts/')) return 'vendor-charts';
            if (id.includes('/node_modules/lucide-react/')) return 'vendor-icons';
            return undefined;
          },
        },
      },
    },
  };
});
