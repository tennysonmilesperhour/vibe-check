import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// Supabase build: the @base44/vite-plugin virtual modules are replaced by
// real adapter modules; the aliases keep every existing import path working.
export default defineConfig({
  logLevel: 'error',
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@/entities/all', replacement: path.resolve(__dirname, 'src/api/entities.js') },
      { find: '@/functions/generateCosmicWisdom', replacement: path.resolve(__dirname, 'src/api/functions.js') },
      { find: '@/functions/generateDailyWeather', replacement: path.resolve(__dirname, 'src/api/functions.js') },
      { find: '@/integrations/Core', replacement: path.resolve(__dirname, 'src/api/integrations.js') },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
});
