/**
 * BRDC-REVEAL-001 — the reveal tier is deterministic, and the distribution holds.
 */
import { describe, expect, it } from 'vitest';
import { cellAt, cellsWithin } from '../geo/cells.js';
import {
  PLAIN_REVEAL_RESOURCE,
  RARITY_SHARE,
  REVEAL_MULT,
  revealBonus,
  revealOf,
} from './reveal.js';
import type { Rarity } from './reveal.js';
import { CLAIM_YIELD, resourceOf } from './terrain.js';

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

  it('wonders stay rare, at about one cell in fifty', () => {
    expect(share('legendary')).toBeGreaterThan(0.008);
    expect(share('legendary')).toBeLessThan(0.04);
  });

  it('anomalies are about one cell in ten', () => {
    expect(share('rare')).toBeGreaterThan(0.05);
    expect(share('rare')).toBeLessThan(0.16);
  });

  /*
   * Raised 2026-09-10. The old split put three reveals in four on `common`, which pays
   * double a claim and reads as nothing — for an action a player takes on every hex they
   * hold. Ordinary is still the single likeliest outcome, but it is no longer most of
   * them.
   */
  it('leaves common as the ordinary case without letting it be nearly all of them', () => {
    expect(share('common')).toBeGreaterThan(0.4);
    expect(share('common')).toBeLessThan(0.65);
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

describe('revealBonus (BRDC-CLAIM-009)', () => {
  it('pays the cell terrain resource, scaled by its tier', () => {
    const withResource = SAMPLE.find((h3) => resourceOf(h3) !== null) as string;
    const res = resourceOf(withResource) as string;
    const bonus = revealBonus(withResource);
    expect(bonus[res as keyof typeof bonus]).toBe(CLAIM_YIELD * REVEAL_MULT[revealOf(withResource)]);
  });

  it('is deterministic and matches the cell tier', () => {
    const h3 = SAMPLE[250] as string;
    expect(revealBonus(h3)).toEqual(revealBonus(h3));
  });

  it('gives a rare or legendary site a token or two on top', () => {
    const rare = SAMPLE.find((h3) => revealOf(h3) === 'rare');
    if (rare) expect(revealBonus(rare).tokens).toBe(1);
    const legendary = SAMPLE.find((h3) => revealOf(h3) === 'legendary');
    if (legendary) expect(revealBonus(legendary).tokens).toBe(3);
  });

  /*
   * This test used to assert the opposite, and asserting it did not make it right.
   * `TERRAIN_TABLE.plain.resource` is null and plain is about two thirds of the map, so
   * two reveals in three paid nothing at all — a button that genuinely did nothing, with
   * a passing test standing over it saying that was the design.
   */
  it('pays plain ground in wisdom rather than nothing at all', () => {
    const plain = SAMPLE.find((h3) => resourceOf(h3) === null && revealOf(h3) === 'common');
    expect(plain).toBeDefined();
    if (!plain) return;
    expect(revealBonus(plain)).toEqual({ [PLAIN_REVEAL_RESOURCE]: CLAIM_YIELD * REVEAL_MULT.common });
  });

  it('never pays nothing, on any cell in the sample', () => {
    for (const h3 of SAMPLE) {
      const total = Object.values(revealBonus(h3)).reduce((a, b) => a + b, 0);
      expect(total).toBeGreaterThan(0);
    }
  });
});
