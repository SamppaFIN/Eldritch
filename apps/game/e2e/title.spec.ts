import { expect, test } from '@playwright/test';

/**
 * BRDC-SETUP-004 — the title screen is the token system's smoke test.
 * These assertions are the GREEN criteria from the ticket, not decoration.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('renders the title and the call to action', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Eldritch\s+Sanctuary/);
  await expect(page.getByRole('button', { name: 'Begin the Awakening' })).toBeVisible();
});

test('the button is a real button, reachable and sized for a thumb', async ({ page }) => {
  const cta = page.getByRole('button', { name: 'Begin the Awakening' });

  // WCAG 2.2 target size.
  const box = await cta.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

  // Keyboard reachable, with a focus ring that is not `outline: none`.
  await cta.focus();
  await expect(cta).toBeFocused();
  const outline = await cta.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
});

test('nothing overflows horizontally', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('survives 200% zoom without horizontal scrolling', async ({ page }) => {
  // AI-Koulu ch.4: text must scale to 200% and still lay out.
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px';
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('makes no requests to third-party hosts', async ({ page }) => {
  const foreign: string[] = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.hostname !== 'localhost' && url.protocol !== 'data:') foreign.push(req.url());
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  expect(foreign).toEqual([]);
});

test('sacred geometry is decorative, not announced', async ({ page }) => {
  // Icons without meaning must not reach a screen reader as noise.
  const svgCount = await page.locator('svg[aria-hidden="true"]').count();
  expect(svgCount).toBeGreaterThan(0);
});
