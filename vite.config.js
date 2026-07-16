import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import { writeFileSync, mkdirSync } from 'fs'

// Build stamp: baked into the bundle AND published as /version.json so the
// running app can notice when a newer deployment exists (UpdateToast).
const BUILD_ID = String(Date.now())

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
export default defineConfig({
  logLevel: 'error',
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [react(), versionFilePlugin()],
  resolve: {
    alias: [
      { find: '@/entities/all', replacement: path.resolve(__dirname, 'src/api/entities.js') },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
});
