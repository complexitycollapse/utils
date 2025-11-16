import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',     // or 'jsdom' if you need browser APIs
    globals: true,           // allows describe/it/expect without importing
    include: ['**/*.test.js'],
    exclude: ['node_modules'],
    coverage: {
      provider: 'v8',        // or 'istanbul'
      reportsDirectory: './coverage',
    },
  },
});
