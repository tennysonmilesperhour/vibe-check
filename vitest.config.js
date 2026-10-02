import { defineConfig } from 'vitest/config';
import path from 'path';

// Tests run in a zone west of Greenwich with daylight saving, where reading a
// day key as UTC would shift the day and fail the date tests.
process.env.TZ = 'America/Los_Angeles';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.js'],
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
});
