import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';
import { seedRealm } from './seedRealm.js';

/**
 * BRDC-PERF-001 — the map measured along the path the game actually draws.
 *
 * `claim.spec.ts`'s five thousand hexagons go straight into `setData` and skip everything
 * slow. This seeds a real held realm, reloads so the app reads it, slows the CPU to a
 * phone's (4×), and counts what the map does: how often each source is re-sent while
 * walking, the long tasks, and frame times while panning. It asserts nothing yet — the
 * budgets are set from these numbers (PERF-002…004).
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
const dLat = (m: number) => m / 111_320;

test.use({ permissions: ['geolocation'], geolocation: HERE });
test.describe.configure({ mode: 'serial' });

interface Perf {
  content: Record<string, number>;
  longtasks: number[];
}

async function instrument(page: Page): Promise<void> {
  await page.evaluate(() => {
    const g = globalThis as unknown as {
      __esMap: { on: (t: string, f: (e: { sourceId?: string; sourceDataType?: string }) => void) => void };
      __perf: Perf;
    };
    g.__perf = { content: {}, longtasks: [] };
    g.__esMap.on('sourcedata', (e) => {
      if (e.sourceDataType !== 'content' || !e.sourceId) return;
      g.__perf.content[e.sourceId] = (g.__perf.content[e.sourceId] ?? 0) + 1;
    });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) g.__perf.longtasks.push(Math.round(entry.duration));
    }).observe({ type: 'longtask' });
  });
}

const readPerf = (page: Page) => page.evaluate(() => (globalThis as unknown as { __perf: Perf }).__perf);

/** Frame times while the camera pans back and forth for `ms`. */
function panFrames(page: Page, ms: number): Promise<number[]> {
  return page.evaluate(async (duration: number) => {
    const map = (globalThis as unknown as {
      __esMap: { panBy: (o: [number, number], a: { duration: number }) => void };
    }).__esMap;
    const frames: number[] = [];
    let last = performance.now();
    let running = true;
    const tick = (t: number) => {
      frames.push(t - last);
      last = t;
      if (running) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    for (let i = 0; i < 1000; i += 1) {
      map.panBy([i % 2 === 0 ? 120 : -120, 0], { duration: 250 });
      await new Promise((r) => setTimeout(r, 300));
      if (frames.length > 0 && frames.reduce((a, b) => a + b, 0) > duration) break;
    }
    running = false;
    return frames.slice(1);
  }, ms);
}

const p95 = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return Math.round(s[Math.min(s.length - 1, Math.floor(s.length * 0.95))] ?? 0);
};

for (const size of [{ label: '1027', rings: 18 }, { label: '5000', count: 5_000 }] as const) {
  test(`map work with ${size.label} held hexes, 4× CPU`, async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile-360', 'measured on the phone viewport only');
    test.setTimeout(420_000);
    await openMap(page, HERE);
    const seeded = await seedRealm(page, { at: HERE, ...('rings' in size ? { rings: size.rings } : { count: size.count }) });
    await page.reload();
    await page.waitForFunction(() => Boolean((globalThis as unknown as { __esMap?: unknown }).__esMap), null, { timeout: 60_000 });
    // Seeded rivals near the Hearth keep a few cells, so the count lands just under the seed.
    await expect
      .poll(async () => Number.parseInt(await page.locator('.hud__value--warded').innerText(), 10) || 0, { timeout: 120_000 })
      .toBeGreaterThanOrEqual(Math.floor(seeded * 0.9));
    await page.waitForTimeout(5_000);

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await instrument(page);

    // Twenty seconds of walking north at 1.4 m/s, one fix a second, inside held ground.
    for (let s = 1; s <= 20; s += 1) {
      await page.context().setGeolocation({ ...HERE, latitude: HERE.latitude + dLat(1.4 * s) });
      await page.waitForTimeout(1_000);
    }
    const walk = await readPerf(page);
    const frames = await panFrames(page, 5_000);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });

    const result = {
      hexes: seeded,
      walk20s: {
        contentEvents: walk.content,
        longtasksOver50: walk.longtasks.filter((d) => d > 50).length,
        longtaskTotalMs: walk.longtasks.reduce((a, b) => a + b, 0),
        longestMs: Math.max(0, ...walk.longtasks),
      },
      pan: { frames: frames.length, p95Ms: p95(frames), maxMs: Math.round(Math.max(0, ...frames)) },
    };
    console.log(`PERF ${JSON.stringify(result)}`);
    await info.attach(`perf-${size.label}.json`, { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
    expect(frames.length).toBeGreaterThan(0);
  });
}
