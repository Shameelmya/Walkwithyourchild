import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['robots.txt', 'theme-init.js', 'icon.svg'],
      manifest: {
        name: 'Walking With Your Child',
        short_name: 'Walk With',
        description: 'A guide and notebook for families of children with progressive neurological conditions.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F4F6FB',
        theme_color: '#F4F6FB',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,ico,json,txt,mp3}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // New versions take over straight away, so the next time the app opens it is up to date.
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  define: { __APP_VERSION__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')) },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
  },
});
