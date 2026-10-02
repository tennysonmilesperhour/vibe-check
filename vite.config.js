import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'
import { writeFileSync, mkdirSync, readFileSync } from 'fs'

// Build stamp: baked into the bundle AND published as /version.json so the
// running app can notice when a newer deployment exists (UpdateToast).
const BUILD_ID = String(Date.now())

// Deployed previews also offer a route back to the current production app.
// Local development and local preview builds stay quiet.
const BUILD_ENVIRONMENT = process.env.VERCEL_ENV || 'development'

// Written next to the build it describes, whichever folder that is.
const versionFilePlugin = () => {
  let outDir
  return {
    name: 'emit-version-json',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      mkdirSync(outDir, { recursive: true })
      writeFileSync(
        path.join(outDir, 'version.json'),
        JSON.stringify({ build: BUILD_ID, environment: BUILD_ENVIRONMENT })
      )
    },
  }
}

// `vite preview` sends the headers Vercel sends for every page (vercel.json),
// so local previews and the browser tests run under the production
// Content-Security-Policy. A missing or reshaped rule leaves preview without
// them (the browser tests check they arrive) rather than breaking builds.
function productionHeaders() {
  try {
    const rules = JSON.parse(readFileSync(path.resolve(__dirname, 'vercel.json'), 'utf8')).headers || []
    const everyPage = rules.find((rule) => rule.source === '/(.*)')
    return Object.fromEntries((everyPage?.headers || []).map(({ key, value }) => [key, value]))
  } catch {
    return {}
  }
}

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
    // Per-chunk warning (pre-gzip). The charts and PDF chunks sit just under
    // this and load only on the pages that need them; first-load size is
    // enforced separately by `npm run check:bundle`.
    chunkSizeWarningLimit: 400,
    // Fonts stay files: the Content-Security-Policy (font-src 'self') refuses
    // a font inlined as a data: URL, which small subsets would otherwise be.
    assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined),
    rollupOptions: {
      output: {
        // Stable vendor chunks: app-code pushes don't invalidate the big,
        // rarely-changing libraries in the browser cache. Match exact package
        // paths: the object form pulled shared helpers (clsx) into the charts
        // chunk and made every page preload recharts. Charts, PDF, and canvas
        // libraries stay with the lazy pages that use them.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          const pkg = id.split(/node_modules[\\/]/).pop()
          if (/^(react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(pkg)) return 'react-vendor'
          if (/^@supabase[\\/]/.test(pkg)) return 'supabase'
          if (/^(framer-motion|motion-dom|motion-utils)[\\/]/.test(pkg)) return 'motion'
          if (/^(lucide-react|date-fns|clsx|tailwind-merge)[\\/]/.test(pkg)) return 'ui-vendor'
          // Only the Patterns page draws charts; this chunk must never load on first paint.
          if (/^(recharts|recharts-scale|react-smooth|victory-vendor|d3-[^\\/]+|internmap|decimal\.js-light)[\\/]/.test(pkg)) return 'charts'
          return undefined
        },
      },
    },
  },
  preview: {
    headers: productionHeaders(),
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
}));
