import { describe, expect, it } from 'vitest';
import { cellAt, destination } from '@es3/core';
import { awakeningFeatures } from './awakening.js';

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
});
