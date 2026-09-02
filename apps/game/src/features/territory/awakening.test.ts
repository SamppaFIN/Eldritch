import { describe, expect, it } from 'vitest';
import { cellAt, destination } from '@es3/core';
import { awakeningFeatures } from './awakening.js';
import { AWAKENING_MS, TEAR_ALPHA_STOPS, WRAP_ALPHA_STOPS } from './AwakeningLayer.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };

describe('awakeningFeatures', () => {
  it('has nothing to reveal for an empty claim', () => {
    expect(awakeningFeatures([]).features).toEqual([]);
  });

  it('gives a lone cell a usable delay rather than NaN', () => {
    // It is its own centre and its own furthest point. Dividing one by the other used
    // to hand the layer NaN, which renders as an invisible reveal.
    const [only] = awakeningFeatures([cellAt(ORIGIN)]).features;
    expect(Number.isFinite(only?.properties?.delay)).toBe(true);
  });

  it('ripples outward: the middle lights before the edge', () => {
    const cells = [
      cellAt(ORIGIN),
      ...[0, 90, 180, 270].map((b) => cellAt(destination(ORIGIN, b, 300))),
    ];
    const delays = new Map(
      awakeningFeatures(cells).features.map((f) => [f.id as string, f.properties?.delay as number]),
    );

    const middle = delays.get(cellAt(ORIGIN)) as number;
    const edges = [0, 90, 180, 270].map((b) => delays.get(cellAt(destination(ORIGIN, b, 300))) as number);

    expect(middle).toBeLessThan(Math.min(...edges));
    expect(Math.max(...delays.values())).toBeCloseTo(1, 5);
  });

  it('keeps every delay inside the range the layer animates over', () => {
    const cells = [0, 60, 120, 180, 240, 300].map((b) => cellAt(destination(ORIGIN, b, 200)));
    for (const f of awakeningFeatures(cells).features) {
      expect(f.properties?.delay).toBeGreaterThanOrEqual(0);
      expect(f.properties?.delay).toBeLessThanOrEqual(1);
    }
  });

  it('staggers each cell inside one AWAKENING_MS window (BRDC-CLAIM-008)', () => {
    const cells = [
      cellAt(ORIGIN),
      ...[0, 72, 144, 216, 288].map((b) => cellAt(destination(ORIGIN, b, 250))),
    ];
    const waits = awakeningFeatures(cells).features.map(
      (f) => (f.properties?.delay as number) * AWAKENING_MS,
    );
    expect(Math.min(...waits)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...waits)).toBeLessThanOrEqual(AWAKENING_MS);
    expect(Math.min(...waits)).toBeLessThan(Math.max(...waits)); // the middle opens first
    expect(new Set(waits).size).toBeGreaterThan(1); // they are not simultaneous
  });
});

describe('the reveal curve is an unwrapping, not a flare (BRDC-CLAIM-008)', () => {
  it('holds the wrapping opaque until the cell reaches its moment, then drops it to nothing', () => {
    // Stops are [progress - delay, alpha]. Below/at 0 the cell is still wrapped.
    expect(WRAP_ALPHA_STOPS[0]?.[1]).toBeGreaterThanOrEqual(0.8);
    expect(WRAP_ALPHA_STOPS.find(([x]) => x === 0)?.[1]).toBeGreaterThanOrEqual(0.8);
    expect(WRAP_ALPHA_STOPS.at(-1)?.[1]).toBe(0);
    const alphas = WRAP_ALPHA_STOPS.map(([, a]) => a);
    expect([...alphas].sort((a, b) => b - a)).toEqual(alphas); // non-increasing
  });

  it('flares the edge as the lid lifts, then leaves nothing behind', () => {
    const alphas = TEAR_ALPHA_STOPS.map(([, a]) => a);
    expect(Math.max(...alphas)).toBe(1); // a bright tear
    expect(TEAR_ALPHA_STOPS[0]?.[1]).toBeLessThan(1); // faint on the wrapped parcel
    expect(TEAR_ALPHA_STOPS.at(-1)?.[1]).toBe(0); // gone, so only the territory stroke stays
  });
});
