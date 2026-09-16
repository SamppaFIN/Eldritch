/**
 * The local chronicle (BRDC-HALL-002) — what a retired kingdom gets when the Worker's
 * AI story could not be written. Always a real sentence, never a "no story" apology.
 */
import { describe, expect, it } from 'vitest';
import { fallbackChronicle } from './kingdomChronicle.js';
import type { HallOfFameEntry } from './hallOfFameStore.js';

const base: HallOfFameEntry = {
  id: 'k',
  name: 'Pyynikin Poika',
  retiredAt: 0,
  level: 4,
  xp: 900,
  cells: 12,
  areaM2: 25_800,
  population: 300,
  provinces: 2,
  achievements: 0,
  secretSites: 0,
  wonders: 0,
  cipherShards: 0,
};

describe('fallbackChronicle', () => {
  it('names the kingdom, its level and its ground, with no finds at all', () => {
    const text = fallbackChronicle(base);
    expect(text).toContain('Pyynikin Poika');
    expect(text).toContain('level 4');
    expect(text).toContain('2 provinces');
    expect(text).toContain('300');
    // Nothing was found or earned — the sentence should not claim otherwise.
    expect(text).not.toContain('uncovered');
    expect(text).not.toContain('deeds were');
  });

  it('mentions achievements when there are some, singular at one', () => {
    expect(fallbackChronicle({ ...base, achievements: 1 })).toContain('One deed was');
    expect(fallbackChronicle({ ...base, achievements: 3 })).toContain('3 deeds were');
  });

  it('lists only the finds that are non-zero', () => {
    const text = fallbackChronicle({ ...base, wonders: 1, secretSites: 2, cipherShards: 0 });
    expect(text).toContain('1 wonder');
    expect(text).toContain('2 secret sites');
    expect(text).not.toContain('cipher shard');
  });

  it('never throws on the smallest possible kingdom', () => {
    const tiny: HallOfFameEntry = { ...base, cells: 0, areaM2: 0, population: 0, provinces: 0 };
    expect(() => fallbackChronicle(tiny)).not.toThrow();
    expect(fallbackChronicle(tiny).length).toBeGreaterThan(0);
  });
});
