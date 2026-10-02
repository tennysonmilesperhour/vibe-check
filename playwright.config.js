// Browser tests against a production build that talks to an in-memory
// Supabase (e2e/support/mock-supabase.js). Run with `npm run test:e2e`.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4183;
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: CI,
  // A failure is a finding, not something to retry away.
  retries: 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    timezoneId: 'America/Denver',
    locale: 'en-US',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  // Desktop runs with motion, as most people see the app; the phone asks for
  // reduced motion, so both paths are covered.
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], contextOptions: { reducedMotion: 'reduce' } } },
  ],
  webServer: {
    // Its own output folder, so a test build never replaces the real one in
    // dist. vite preview sends the production headers, CSP included.
    command: `vite build --outDir dist-e2e --emptyOutDir && vite preview --outDir dist-e2e --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 180_000,
    env: { VITE_SUPABASE_URL: 'https://mockproj.supabase.co', VITE_SUPABASE_ANON_KEY: 'e2e-anon-key' },
  },
});
