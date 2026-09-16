/**
 * BRDC-WONDER-002 — the nine local wonders' identity and their hard placement gate.
 * Effects are not implemented yet (each is its own follow-up); this only covers what
 * this ticket's foundation actually built.
 */
import { describe, expect, it } from 'vitest';
import { HARMALA_WONDERS, HARMALA_WONDER_IDS, harmalaWonderFits } from './harmalaWonder.js';

describe('HARMALA_WONDERS', () => {
  it('has exactly nine, confirmed against the seed\'s expectedCounts', () => {
    expect(HARMALA_WONDER_IDS).toHaveLength(9);
    expect(new Set(HARMALA_WONDER_IDS).size).toBe(9);
  });

  it('gives every wonder a name, lore, effect and at least one required terrain', () => {
    for (const id of HARMALA_WONDER_IDS) {
      const w = HARMALA_WONDERS[id];
      expect(w.name.length).toBeGreaterThan(0);
      expect(w.lore.length).toBeGreaterThan(0);
      expect(w.effect.length).toBeGreaterThan(0);
      expect(w.requireTerrain.length).toBeGreaterThan(0);
    }
  });

  it('traces every wonder back to a real worldseed.ts id', () => {
    const sourceIds = [
      'sunken_bell',
      'drowned_spire',
      'eye_of_the_lake',
      'great_sauna',
      'ley_observatory',
      'whispering_grove',
      'iron_bell',
      'the_boy_who_waits',
      'ten_thousand_steps',
    ];
    const traced = HARMALA_WONDER_IDS.map((id) => HARMALA_WONDERS[id].worldseedId);
    expect(traced.sort()).toEqual(sourceIds.sort());
  });

  it('names no two wonders alike', () => {
    const names = HARMALA_WONDER_IDS.map((id) => HARMALA_WONDERS[id].name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('harmalaWonderFits', () => {
  it('accepts a hex whose terrain and every required flag match', () => {
    expect(harmalaWonderFits('yhanthlei-bell', 'marsh', [])).toBe(true);
    expect(harmalaWonderFits('dagon-spire', 'lake', ['deepWater'])).toBe(true);
  });

  it('rejects a hex on the wrong terrain, even with the right flags', () => {
    expect(harmalaWonderFits('yhanthlei-bell', 'plain', [])).toBe(false);
  });

  it('rejects a hex missing a required flag, even on the right terrain', () => {
    expect(harmalaWonderFits('dagon-spire', 'lake', [])).toBe(false);
    expect(harmalaWonderFits('dunwich-grove', 'forest', [])).toBe(false);
    expect(harmalaWonderFits('dunwich-grove', 'forest', ['oldGrowth'])).toBe(true);
  });

  it('never forces a wonder onto the wrong ground — no flag requirement is trivially satisfied', () => {
    // A wonder with no requireFlags at all must still gate on terrain alone.
    expect(harmalaWonderFits('carcosa-foundry', 'lake', [])).toBe(false);
    expect(harmalaWonderFits('carcosa-foundry', 'market', [])).toBe(true);
  });
});
