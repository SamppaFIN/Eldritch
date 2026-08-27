import { defineConfig, devices } from '@playwright/test';

/**
 * The 360px mobile project is FIRST, deliberately.
 * v2's mobile layout was a P0 bug in a mobile-only game because desktop was
 * always tested first and the phone was always tested last, in a hurry.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Walking tests move a real clock: MIN_POINT_INTERVAL_MS is five seconds and the
  // fix timestamp comes from the browser, so a walk cannot be fast-forwarded.
  timeout: 90_000,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile-360',
      use: { ...devices['Pixel 5'], viewport: { width: 360, height: 780 } },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },
});
