import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-HALL-004 — a kingdom retires with its picture: the map as it stood, kept through
 * the wipe and the reload, a thumbnail on its Hall row and the whole image on a tap.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

async function menu(page: Page, label: string) {
  await page.getByRole('button', { name: 'Menu' }).click();
  const target = page.getByRole('button', { name: label });
  if (!(await target.isVisible().catch(() => false))) await page.getByRole('button', { name: /^Advanced/ }).click();
  await target.click();
}

test('a retired kingdom keeps its picture in the Hall of Fame', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  await page.waitForTimeout(2_000);
  await menu(page, 'Retire this kingdom');
  await page.getByRole('button', { name: 'Retire it' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });

  await openMap(page, HERE);
  await menu(page, 'Hall of Fame Kingdoms retired');
  const hall = page.getByRole('region', { name: 'Hall of Fame' });
  const thumb = hall.getByRole('button', { name: /as it stood$/ });
  await expect(thumb).toBeVisible({ timeout: 15_000 });
  const src = await thumb.locator('img').getAttribute('src');
  expect(src).toMatch(/^data:image\/jpeg;base64,/);
  // At most 1280 px on the long side.
  const size = await thumb.locator('img').evaluate((img: HTMLImageElement) => Math.max(img.naturalWidth, img.naturalHeight));
  expect(size).toBeGreaterThan(0);
  expect(size).toBeLessThanOrEqual(1280);
  // The map is in it, not only the HUD over a void: the middle third has lit pixels.
  const lit = await thumb.locator('img').evaluate((img: HTMLImageElement) => {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, Math.round(c.height / 3), c.width, Math.round(c.height / 3)).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) if ((d[i] ?? 0) + (d[i + 1] ?? 0) + (d[i + 2] ?? 0) > 90) n += 1;
    return n / (d.length / 4);
  });
  expect(lit).toBeGreaterThan(0.05);

  await thumb.click();
  const full = page.getByRole('button', { name: 'Close the picture' });
  await expect(full).toBeVisible();
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/hall-picture.png' });
  await page.keyboard.press('Escape');
  await expect(full).toHaveCount(0);
});
