import { describe, expect, it } from 'vitest';
import { prng } from '../sim/walk.js';
import {
  BONUS_RESOURCES,
  DEPOSIT_CAP,
  DEPOSIT_DENSITY,
  allocateArea,
  depositCount,
  yieldToResource,
} from './worldseedAllocate.js';
import type { Area } from './worldseedPartition.js';
import type { H3Index } from '../types/domain.js';

const area = (terrain: Area['terrain'], count: number, flags: readonly string[] = []): Area => ({
  id: `${terrain}-test`,
  terrain,
  hexes: Array.from({ length: count }, (_, i) => `hex-${terrain}-${i}` as H3Index),
  flags,
});
const noFlags = (): readonly string[] => [];

describe('depositCount', () => {
  it('matches worldseed.ts\'s own thresholds', () => {
    expect(depositCount(6)).toBe(1);
    expect(depositCount(19)).toBe(1);
    expect(depositCount(20)).toBe(2);
    expect(depositCount(39)).toBe(2);
    expect(depositCount(40)).toBe(3);
    expect(depositCount(200)).toBe(3);
  });
});

describe('yieldToResource', () => {
  it('folds timber onto wood; everything else passes through', () => {
    expect(yieldToResource('timber')).toBe('wood');
    expect(yieldToResource('gold')).toBe('gold');
  });
});

describe('allocateArea', () => {
  it('is deterministic — the same seed gives the same deposits', () => {
    const a = area('forest', 30);
    const first = allocateArea(a, noFlags, prng(7));
    const second = allocateArea(a, noFlags, prng(7));
    expect(second).toEqual(first);
  });

  it('draws depositCount deposits, capped by DEPOSIT_CAP for the terrain', () => {
    const a = area('settlement', 45); // depositCount(45) = 3, but settlement caps at 2
    const deposits = allocateArea(a, noFlags, prng(1));
    expect(deposits.length).toBe(DEPOSIT_CAP.settlement);
  });

  it('never places the same resource on the same hex twice, or reuses a hex', () => {
    const a = area('hill', 40);
    const deposits = allocateArea(a, noFlags, prng(3));
    const hexIds = deposits.map((d) => d.hexId);
    expect(new Set(hexIds).size).toBe(hexIds.length);
  });

  it('only ever picks a resource with a real affinity for the area\'s terrain', () => {
    const a = area('marsh', 30);
    const deposits = allocateArea(a, noFlags, prng(11));
    for (const d of deposits) expect(d.resource.affinity.marsh ?? 0).toBeGreaterThan(0);
  });

  it('skips a resource whose require flags no hex in the area satisfies', () => {
    // leycrystal needs `leyCrossing`; with no hex ever carrying that flag it can never be
    // drawn, however the RNG rolls it — the area still gets its deposit from elsewhere.
    const a = area('marsh', 30);
    const deposits = allocateArea(a, noFlags, prng(42));
    expect(deposits.every((d) => d.resource.id !== 'leycrystal')).toBe(true);
  });

  it('places a require-gated resource only on a hex that actually carries the flag', () => {
    const a = area('forest', 30, []);
    const flagged = new Set([a.hexes[5]]);
    const flagsOf = (h3: H3Index): readonly string[] => (flagged.has(h3) ? ['oldGrowth'] : []);
    // Run many seeds; whenever `oak` (require: oldGrowth) is drawn, it must land on hex 5.
    for (let seed = 0; seed < 40; seed += 1) {
      const deposits = allocateArea(a, flagsOf, prng(seed));
      const oak = deposits.find((d) => d.resource.id === 'oak');
      if (oak) expect(oak.hexId).toBe(a.hexes[5]);
    }
  });

  it('returns nothing for a terrain no resource has any affinity for', () => {
    // Every one of the 28 declares at least one affinity, so a wholly synthetic terrain
    // absent from every affinity table proves the pool-filter actually filters.
    const a: Area = { id: 'mountain-test', terrain: 'mountain', hexes: ['h1' as H3Index], flags: [] };
    const hasMountainAffinity = BONUS_RESOURCES.some((r) => (r.affinity.mountain ?? 0) > 0);
    expect(hasMountainAffinity).toBe(false);
    expect(allocateArea(a, noFlags, prng(1))).toEqual([]);
  });
});

describe('BONUS_RESOURCES', () => {
  it('has exactly the 28 worldseed.ts declares', () => {
    expect(BONUS_RESOURCES).toHaveLength(28);
    expect(new Set(BONUS_RESOURCES.map((r) => r.id)).size).toBe(28);
  });

  it('gives every resource at least one terrain affinity', () => {
    for (const r of BONUS_RESOURCES) {
      expect(Object.values(r.affinity).some((v) => (v ?? 0) > 0)).toBe(true);
    }
  });
});

describe('DEPOSIT_DENSITY', () => {
  it('matches worldseed.ts\'s own ~5% guardrail', () => {
    expect(DEPOSIT_DENSITY.min).toBe(0.03);
    expect(DEPOSIT_DENSITY.max).toBe(0.12);
  });
});
