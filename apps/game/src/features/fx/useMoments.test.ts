/**
 * BRDC-FX-001 — the parts of the moment layer that are logic, not pixels.
 *
 * The hook and the component are visual and this repo renders neither in tests; what is
 * worth pinning is the kind→geometry mapping, and that reduced motion
 * turns the draw-in off without turning the moment off.
 */
import { describe, expect, it } from 'vitest';
import { FlowerOfLife, HexMandala, MetatronsCube } from '@es3/ui';
import { geometryFor, shouldAnimate } from './MomentFx.js';

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
