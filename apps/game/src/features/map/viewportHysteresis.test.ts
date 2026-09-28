import { describe, expect, it } from 'vitest';
import { contains, nextLoaded, padBBox } from './viewportHysteresis.js';

const VIEW = { west: 23.72, east: 23.73, south: 61.47, north: 61.475 };
const shift = (dx: number) => ({ ...VIEW, west: VIEW.west + dx, east: VIEW.east + dx });

describe('viewport hysteresis (BRDC-PERF-002)', () => {
  it('pads a street-level view half a screen each way', () => {
    const loaded = nextLoaded(null, VIEW);
    expect(loaded).toEqual(padBBox(VIEW));
    expect(contains(loaded, VIEW)).toBe(true);
  });

  it('keeps the same area — same identity — while the view stays inside it', () => {
    const loaded = nextLoaded(null, VIEW);
    expect(nextLoaded(loaded, shift(0.003))).toBe(loaded);
  });

  it('reads anew once the view leaves the loaded area', () => {
    const loaded = nextLoaded(null, VIEW);
    expect(nextLoaded(loaded, shift(0.02))).not.toBe(loaded);
  });

  it('does not pad a country-wide view', () => {
    const wide = { west: 23, east: 24, south: 61, north: 61.5 };
    expect(nextLoaded(null, wide)).toEqual(wide);
  });

  it('shrinks back after zooming far in', () => {
    const wide = { west: 23, east: 24, south: 61, north: 61.5 };
    expect(nextLoaded(wide, VIEW)).toEqual(padBBox(VIEW));
  });
});
