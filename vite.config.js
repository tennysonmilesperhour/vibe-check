import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'
import { writeFileSync, mkdirSync } from 'fs'

// Build stamp: baked into the bundle AND published as /version.json so the
// running app can notice when a newer deployment exists (UpdateToast).
const BUILD_ID = String(Date.now())

// Only the production deployment should run the update check. Preview
// deployments and local `vite preview` builds carry their own one-off stamp
// that can never equal production's, so polling from them would nag forever.
// Vercel sets VERCEL_ENV at build time; it's undefined everywhere else.
const IS_PRODUCTION_BUILD = process.env.VERCEL_ENV === 'production'

const versionFilePlugin = () => ({
  name: 'emit-version-json',
  closeBundle() {
    mkdirSync(path.resolve(__dirname, 'dist'), { recursive: true })
    writeFileSync(
      path.resolve(__dirname, 'dist/version.json'),
      JSON.stringify({ build: BUILD_ID })
    )
  },
})

// Supabase build: the @base44/vite-plugin virtual modules are replaced by
// real adapter modules; the aliases keep every existing import path working.
export default defineConfig(({ mode }) => ({
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
    __IS_PRODUCTION_BUILD__: JSON.stringify(IS_PRODUCTION_BUILD),
  },
  plugins: [
    react(),
    versionFilePlugin(),
    // `npm run analyze` writes an interactive treemap to dist/stats.html.
    mode === 'analyze' && visualizer({ filename: 'dist/stats.html', gzipSize: true }),
  ].filter(Boolean),
  build: {
    // The spec's budget: warn when any chunk crosses 350 kB (pre-gzip).
    chunkSizeWarningLimit: 350,
    rollupOptions: {
      output: {
        // Stable vendor chunks: app-code pushes don't invalidate the big,
        // rarely-changing libraries in the browser cache.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'date-fns'],
          'motion': ['framer-motion'],
          'supabase': ['@supabase/supabase-js'],
          'recharts': ['recharts'],
        },
      },
    },
  },
  resolve: {
    alias: [
      { find: '@/entities/all', replacement: path.resolve(__dirname, 'src/api/entities.js') },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
}));
