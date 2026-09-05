/**
 * BRDC-FX-001 — the parts of the moment layer that are logic, not pixels.
 *
 * The hook and the component are visual and this repo renders neither in tests; what is
 * worth pinning is the per-minute cap, the kind→geometry mapping, and that reduced motion
 * turns the draw-in off without turning the moment off.
 */
import { describe, expect, it } from 'vitest';
import { FlowerOfLife, HexMandala, MetatronsCube } from '@es3/ui';
import { MOMENTS_PER_MIN, withinCap } from './useMoments.js';
import { geometryFor, shouldAnimate } from './MomentFx.js';

describe('withinCap', () => {
  const NOW = 1_000_000;

  it('lets a moment start while fewer than the cap began in the last minute', () => {
    expect(withinCap([], NOW)).toBe(true);
    expect(withinCap([NOW - 1_000, NOW - 2_000], NOW)).toBe(true);
  });

  it('drops the one that would exceed the cap', () => {
    const full = Array.from({ length: MOMENTS_PER_MIN }, (_, i) => NOW - i * 1_000);
    expect(withinCap(full, NOW)).toBe(false);
  });

  it('does not count starts older than a minute', () => {
    const old = Array.from({ length: MOMENTS_PER_MIN }, () => NOW - 61_000);
    expect(withinCap(old, NOW)).toBe(true);
  });
});

describe('geometryFor', () => {
  it('gives every named effect its own shape', () => {
    expect(geometryFor('levelUp')).toBe(FlowerOfLife);
    expect(geometryFor('achievement')).toBe(MetatronsCube);
    expect(geometryFor('riteComplete')).toBe(HexMandala);
    expect(geometryFor('questEnd')).toBe(MetatronsCube);
    expect(geometryFor('wonderFound')).toBe(MetatronsCube);
  });
});

describe('shouldAnimate', () => {
  it('draws itself in normally, appears at once under reduced motion', () => {
    expect(shouldAnimate(false)).toBe(true);
    expect(shouldAnimate(true)).toBe(false);
  });
});
