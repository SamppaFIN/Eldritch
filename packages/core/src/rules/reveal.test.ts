/**
 * BRDC-REVEAL-001 — the reveal tier is deterministic, and the distribution holds.
 */
import { describe, expect, it } from 'vitest';
import { cellAt, cellsWithin } from '../geo/cells.js';
import { RARITY_SHARE, revealOf } from './reveal.js';
import type { Rarity } from './reveal.js';

// ~7500 real res-11 cells around central Tampere — the same ground a player walks.
const SAMPLE = cellsWithin(cellAt({ lat: 61.4978, lng: 23.7610 }), 50);

describe('revealOf', () => {
  it('is deterministic — the same cell gives the same tier, always', () => {
    const h3 = SAMPLE[100] as string;
    const first = revealOf(h3);
    for (let i = 0; i < 1000; i += 1) expect(revealOf(h3)).toBe(first);
  });

  it('depends on the cell, not on call order', () => {
    const a = SAMPLE.map(revealOf);
    const b = [...SAMPLE].reverse().map(revealOf).reverse();
    expect(a).toEqual(b);
  });

  it('only ever returns one of the four tiers', () => {
    const tiers = new Set<Rarity>(SAMPLE.map(revealOf));
    for (const t of tiers) expect(['common', 'uncommon', 'rare', 'legendary']).toContain(t);
  });
});

describe('distribution over a large real sample', () => {
  const count: Record<Rarity, number> = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
  for (const h3 of SAMPLE) count[revealOf(h3)] += 1;
  const share = (t: Rarity) => count[t] / SAMPLE.length;

  it('has more than five thousand cells to judge from', () => {
    expect(SAMPLE.length).toBeGreaterThan(5000);
  });

  it('wonders are about one per cent', () => {
    expect(share('legendary')).toBeGreaterThan(0.003);
    expect(share('legendary')).toBeLessThan(0.025);
  });

  it('anomalies are about five per cent', () => {
    expect(share('rare')).toBeGreaterThan(0.03);
    expect(share('rare')).toBeLessThan(0.08);
  });

  it('every tier is within a reasonable band of its share', () => {
    for (const t of ['common', 'uncommon', 'rare', 'legendary'] as Rarity[]) {
      expect(Math.abs(share(t) - RARITY_SHARE[t])).toBeLessThan(0.04);
    }
  });

  it('RARITY_SHARE sums to one', () => {
    const total = (Object.values(RARITY_SHARE) as number[]).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
  });
});
