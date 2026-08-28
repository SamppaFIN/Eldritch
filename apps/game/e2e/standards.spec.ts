import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { acceptHearth, openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * The standards claude.md §14 commits to, measured rather than assumed.
 *
 * Both halves of this were written down as targets and never checked, which is the
 * state most accessibility statements and performance budgets live in. Automated tools
 * catch about 30% of a11y defects — but 30% caught beats 100% asserted.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: HERE });

/** WCAG 2.2 AA is the floor, so that is what is scanned for. */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function openMap(page: Page) {
  await open(page, HERE);
}

function report(violations: Array<{ id: string; impact?: string | null; nodes: unknown[] }>) {
  return violations
    .map((v) => `${v.impact ?? 'unknown'}: ${v.id} (${v.nodes.length} node(s))`)
    .join('\n');
}

test('the title screen has no automatable accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(report(results.violations)).toBe('');
});

test('the map screen has no automatable accessibility violations', async ({ page }) => {
  await openMap(page);

  const results = await new AxeBuilder({ page })
    .withTags(TAGS)
    // The map canvas is MapLibre's; its internals are not ours to fix, and the game
    // state it shows is duplicated in words in the HUD.
    .exclude('.maplibregl-canvas-container')
    .analyze();
  expect(report(results.violations)).toBe('');
});

test('an open dialog has no automatable accessibility violations', async ({ page }) => {
  await openMap(page);
  await page.getByRole('button', { name: 'Withdraw' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(report(results.violations)).toBe('');
});

test('headings go h1 then h2, with nothing skipped', async ({ page }) => {
  await openMap(page);
  await page.getByRole('button', { name: 'Withdraw' }).click();

  const levels = await page.evaluate(() =>
    [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1])),
  );

  let previous = 0;
  for (const level of levels) {
    if (previous !== 0) expect(level - previous).toBeLessThanOrEqual(1);
    previous = level;
  }
});

test('every interactive element can be reached and shows where focus is', async ({ page }) => {
  // "Close your eyes and navigate with the keyboard only" — ch.4's own test.
  await openMap(page);

  const reached = new Set<string>();
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      return {
        label: el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 40) ?? el.tagName,
        outline: style.outlineStyle,
        width: style.outlineWidth,
      };
    });
    if (!focused) continue;
    reached.add(focused.label);
    // outline: none is banned. A focus ring that is not there is a focus ring
    // nobody can follow.
    expect(focused.outline, `no focus ring on "${focused.label}"`).not.toBe('none');
    expect(focused.width, `zero-width focus ring on "${focused.label}"`).not.toBe('0px');
  }

  // Both HUD controls, at least.
  expect(reached.size).toBeGreaterThanOrEqual(2);
});

test('the page still works at 200% zoom without scrolling sideways', async ({ page }) => {
  await openMap(page);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px';
  });
  await page.waitForTimeout(400);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByRole('button', { name: 'Withdraw' })).toBeVisible();
});

test('Core Web Vitals stay inside the budget', async ({ page }) => {
  // claude.md §14: LCP < 2.5 s, CLS < 0.1. Measured on the title screen, which is
  // what a player waits for; the map is code-split and loads on a deliberate tap.
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForTimeout(2_500);

  const vitals = await page.evaluate(
    () =>
      new Promise<{ lcp: number; cls: number }>((resolve) => {
        let lcp = 0;
        let cls = 0;

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) lcp = entry.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
            // Shifts within 500 ms of an interaction are the user's doing, not ours.
            if (!shift.hadRecentInput) cls += shift.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });

        setTimeout(() => resolve({ lcp, cls }), 600);
      }),
  );

  expect(vitals.lcp, `LCP ${Math.round(vitals.lcp)} ms`).toBeLessThan(2_500);
  expect(vitals.cls, `CLS ${vitals.cls.toFixed(3)}`).toBeLessThan(0.1);
});

test('nothing shifts under the player as the map arrives', async ({ page }) => {
  // CLS on a map application is the least forgivable kind: a control that moves
  // while a thumb is heading for it.
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the Awakening' }).click();
  await acceptHearth(page, HERE);
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  const cls = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
            if (!shift.hadRecentInput) total += shift.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => resolve(total), 1_500);
      }),
  );

  expect(cls, `CLS ${cls.toFixed(3)} across the map transition`).toBeLessThan(0.1);
});
