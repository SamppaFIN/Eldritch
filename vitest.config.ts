import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts', 'apps/*/src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['packages/core/src/**'],
      // v2 shipped a coverage report with zero hits. Fail instead.
      thresholds: { lines: 1, functions: 1, statements: 1 },
    },
  },
});
