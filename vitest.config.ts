import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts', 'apps/*/src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['packages/core/src/**'],
      // v2 shipped a coverage report with zero hits. Fail instead — and not only at zero:
      // measured 98 / 96 / 91 % (lines / functions / branches) on 2026-10-13
      // (BRDC-REGRESSION-000), so a few points under that catches a real drop.
      thresholds: { lines: 95, statements: 95, functions: 93, branches: 88 },
    },
  },
});
