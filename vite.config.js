import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'
import { writeFileSync, mkdirSync, readFileSync } from 'fs'
import { attr, tags } from './scripts/html.mjs'

// Build stamp: written into index.html (a vibe-build meta tag) and published
// as /version.json, so the running app can notice a newer deployment
// (UpdateToast). It stays out of the scripts: identical code keeps identical
// file names from build to build, so the service worker's kept pages last.
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
    transformIndexHtml() {
      return [{ tag: 'meta', attrs: { name: 'vibe-build', content: BUILD_ID }, injectTo: 'head' }]
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

// The pages kept from the start for opening without a connection, by chunk
// name: help and practices, which need no records, and the policies. Every
// other page is kept once it has been opened, until an update changes it.
const OFFLINE_PAGES = ['SupportNow', 'HelpNow', 'Practice', 'SomaticPractice', 'Privacy', 'Terms', 'Support']

// Writes /sw.js from src/service-worker.js with this build's id, the files
// it keeps from the start (everything index.html loads, the fonts, and the
// offline pages with what they import) and the list of every built file.
const serviceWorkerPlugin = () => {
  let outDir
  let root
  let bundle = {}
  return {
    name: 'emit-service-worker',
    apply: 'build',
    configResolved(config) {
      root = config.root
      outDir = path.resolve(config.root, config.build.outDir)
    },
    generateBundle(_options, output) {
      bundle = output
    },
    closeBundle() {
      const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
      const scripts = tags(html, 'script')
      const entry = scripts.map((tag) => attr(tag, 'type') === 'module' && attr(tag, 'src')).find(Boolean)
      if (!entry) throw new Error('index.html has no module script for the service worker to check against.')
      const local = (url) => (url?.startsWith('/') ? url : null)
      const files = new Set([...scripts.map((tag) => local(attr(tag, 'src'))), ...tags(html, 'link').map((tag) => local(attr(tag, 'href')))].filter(Boolean))
      const chunks = Object.values(bundle).filter((item) => item.type === 'chunk')
      const visited = new Set()
      const keepChunk = (chunk) => {
        if (visited.has(chunk.fileName)) return
        visited.add(chunk.fileName)
        files.add(`/${chunk.fileName}`)
        for (const css of chunk.viteMetadata?.importedCss || []) files.add(`/${css}`)
        for (const name of chunk.imports) keepChunk(bundle[name])
      }
      const missing = OFFLINE_PAGES.filter((name) => !chunks.some((item) => item.name === name))
      if (missing.length) throw new Error(`The service worker's offline pages aren't chunks of this build: ${missing.join(', ')}. Update OFFLINE_PAGES in vite.config.js.`)
      for (const chunk of chunks.filter((item) => item.isEntry || OFFLINE_PAGES.includes(item.name))) keepChunk(chunk)
      for (const item of Object.values(bundle)) if (item.fileName.endsWith('.woff2')) files.add(`/${item.fileName}`)
      files.delete('/index.html')
      const assets = Object.values(bundle).map((item) => `/${item.fileName}`).filter((name) => name.startsWith('/assets/'))
      const source = readFileSync(path.resolve(root, 'src/service-worker.js'), 'utf8')
        .replace('__SW_BUILD__', JSON.stringify(BUILD_ID))
        .replace('__SW_PRECACHE__', JSON.stringify([...files].sort()))
        .replace('__SW_ASSETS__', JSON.stringify(assets.sort()))
        .replace('__SW_ENTRY__', JSON.stringify(entry))
      writeFileSync(path.join(outDir, 'sw.js'), source)
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
    __BUILD_ENVIRONMENT__: JSON.stringify(BUILD_ENVIRONMENT),
  },
  plugins: [
    react(),
    versionFilePlugin(),
    serviceWorkerPlugin(),
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
