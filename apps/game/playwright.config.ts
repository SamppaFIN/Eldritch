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
    baseURL: 'http://localhost:4174',
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
    // Its own build: `.env.e2e` points the shared-world Worker at nothing, so tests never
    // touch the live one (2026-09-29: a live Season 2 put its welcome over every test,
    // and test realms had been landing in the real Chronicles as "Seeker").
    command: 'pnpm exec vite build --mode e2e --outDir dist-e2e && pnpm exec vite preview --outDir dist-e2e --port 4174 --strictPort',
    // Its own port, and never reused: a preview of the production build left on 4173
    // was once picked up silently and the tests ran against the live Worker.
    url: 'http://localhost:4174',
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
