import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'
import { writeFileSync, mkdirSync } from 'fs'

// Build stamp: baked into the bundle AND published as /version.json so the
// running app can notice when a newer deployment exists (UpdateToast).
const BUILD_ID = String(Date.now())

// Deployed previews also offer a route back to the current production app.
// Local development and local preview builds stay quiet.
const BUILD_ENVIRONMENT = process.env.VERCEL_ENV || 'development'

const versionFilePlugin = () => ({
  name: 'emit-version-json',
  closeBundle() {
    mkdirSync(path.resolve(__dirname, 'dist'), { recursive: true })
    writeFileSync(
      path.resolve(__dirname, 'dist/version.json'),
      JSON.stringify({ build: BUILD_ID, environment: BUILD_ENVIRONMENT })
    )
  },
})

// Supabase build: the @base44/vite-plugin virtual modules are replaced by
// real adapter modules; the aliases keep every existing import path working.
export default defineConfig(({ mode }) => ({
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
    __BUILD_ENVIRONMENT__: JSON.stringify(BUILD_ENVIRONMENT),
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
