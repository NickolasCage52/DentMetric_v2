import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { writeFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Root-domain hosting: `/`. Subpath (e.g. GitHub Pages project site): set VITE_BASE_PATH=/RepoName */
function normalizeViteBase(raw) {
  if (raw == null || String(raw).trim() === '' || String(raw).trim() === '/') return '/'
  const inner = String(raw).trim().replace(/^\/+|\/+$/g, '')
  if (!inner) return '/'
  return `/${inner}/`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = normalizeViteBase(env.VITE_BASE_PATH)
  /** PWA icons: using existing JPEG; replace with192/512 PNG + maskable when assets are ready. */
  const pwaIcon = `${base === '/' ? '' : base.replace(/\/$/, '')}/new_logo.jpg`.replace(/([^:]\/)\/+/g, '$1')

  return {
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.0'),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    /** Явный порт; host: true — слушать все интерфейсы (иногда снимает отказ localhost на Windows). */
    port: 5173,
    strictPort: false,
    host: true,
    // 127.0.0.1: на Windows прокси на `localhost` иногда даёт ECONNREFUSED (IPv4/IPv6).
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['dm-logo.svg', 'new_logo.jpg'],
      manifest: {
        name: 'DentMetric',
        short_name: 'DentMetric',
        description: 'PDR Masters — Расчёт стоимости ремонта вмятин',
        theme_color: '#0f0f0f',
        background_color: '#0f0f0f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base === '/' ? '/' : base,
        scope: base === '/' ? '/' : base,
        icons: [
          { src: pwaIcon, sizes: '192x192', type: 'image/jpeg' },
          { src: pwaIcon, sizes: '512x512', type: 'image/jpeg' },
          { src: pwaIcon, sizes: '512x512', type: 'image/jpeg', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/admin/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff,woff2}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60,
              },
            },
          },
        ],
      },
    }),
    {
      name: 'meta-json',
      closeBundle() {
        const meta = {
          version: process.env.npm_package_version || '0.0.0',
          buildTime: new Date().toISOString(),
          buildHash: Date.now().toString(36),
        }
        writeFileSync(
          join(process.cwd(), 'dist', 'meta.json'),
          JSON.stringify(meta, null, 2)
        )
      },
    },
  ],
  base,
}
})
