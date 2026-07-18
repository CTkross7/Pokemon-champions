import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

// App version is the single source of truth in package.json — bump it there each
// release and the Settings › Info version updates automatically.
const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8'))

// https://vite.dev/config/
export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    tailwindcss(),
    // Emit /version.json carrying the deployed version so a long-lived tab can
    // detect that a newer build shipped (see src/lib/version.ts).
    {
      name: 'emit-version-json',
      apply: 'build',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ version: pkg.version, builtAt: Date.now() }),
        })
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: '챔스노트 — 포켓몬 챔피언스 배틀 파트너',
        short_name: '챔스노트',
        description:
          '포켓몬 챔피언스 랭크배틀을 위한 도감·데미지 계산기·팀 진단 코칭·실전 매치업 어시스턴트를 챔스노트 단 한곳에서.',
        lang: 'ko',
        theme_color: '#0a0a0a',
        background_color: '#050505',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Precache the app shell; large data/sprites are cached at runtime on demand.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // Never serve the SPA shell for API calls or for real files with an
        // extension (ads.txt, app-ads.txt, robots.txt, sitemap.xml, *.apk …) —
        // otherwise a browser navigation to /ads.txt gets index.html from the
        // service worker instead of the actual file.
        navigateFallbackDenylist: [/^\/api\//, /\.[^/]+$/],
        runtimeCaching: [
          {
            // Game data changes on updates — serve fresh, fall back to cache
            // offline. (CacheFirst here caused stale data to persist after
            // redeploys, e.g. old English move names.)
            urlPattern: /\/data\/.*\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'champsnote-data',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            // Sprites are content-hashed by filename and effectively immutable.
            urlPattern: /\/sprites\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'champsnote-sprites',
              expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@data': fileURLToPath(new URL('../data', import.meta.url)),
    },
  },
})
