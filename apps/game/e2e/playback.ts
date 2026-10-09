/**
 * Route playback for e2e (BRDC-SIM-002): load a route into the app's own player and play
 * it through the live pipeline — the same filter, trail and claims a phone's fixes go
 * through — at up to ×60. A six-minute walk takes six seconds.
 *
 *   await playRoute(page, { fixture: 'open-line' });
 *   await playRoute(page, { text: gpxText, name: 'walk.gpx' }, 20);
 */
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export type RouteSource = { fixture: 'square' | 'figure-eight' | 'open-line' | 'back-and-forth' | 'gps-noise' } | { text: string; name?: string };

interface PlaybackHook {
  loadFixture: (name: string) => Promise<void>;
  loadText: (text: string, name?: string) => string | null;
  play: (speed?: number) => void;
  stop: () => void;
  state: () => { played: number; done: boolean; playing: boolean; route: { points: unknown[] } | null };
}
type WithHook = { __es3Playback?: PlaybackHook };

/** Load and play to the end; resolves once the last point has been played. */
export async function playRoute(page: Page, source: RouteSource, speed = 60): Promise<void> {
  await page.waitForFunction(() => Boolean((window as unknown as WithHook).__es3Playback), null, { timeout: 20_000 });
  const fault = await page.evaluate(async (src) => {
    const pb = (window as unknown as WithHook).__es3Playback as PlaybackHook;
    if ('fixture' in src) {
      await pb.loadFixture(src.fixture);
      return null;
    }
    return pb.loadText(src.text, src.name);
  }, source);
  expect(fault, 'the route could not be read').toBeNull();
  // The load lands in React state first; play once it has.
  await page.waitForFunction(() => (window as unknown as WithHook).__es3Playback?.state().route !== null);
  await page.evaluate((s) => (window as unknown as WithHook).__es3Playback?.play(s), speed);
  await page.waitForFunction(() => (window as unknown as WithHook).__es3Playback?.state().done === true, null, { timeout: 120_000 });
}

/** Hand the position back to the (emulated) phone; a fresh run begins. */
export async function stopPlayback(page: Page): Promise<void> {
  await page.evaluate(() => (window as unknown as WithHook).__es3Playback?.stop());
}
