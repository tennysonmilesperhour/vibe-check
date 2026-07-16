import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.js'],
  },
  resolve: {
    alias: [
      { find: '@/entities/all', replacement: path.resolve(__dirname, 'src/test/mocks/entities.js') },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
});
