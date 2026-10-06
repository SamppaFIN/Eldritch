/** BRDC-MYTHOS-001 — the Mythos tells a three-day story, and some of it bites. */
import { describe, expect, it } from 'vitest';
import { MYTHOS, MYTHOS_CHAINS, dawnsSince, mythosDice, mythosFor } from './doom.js';
import { resolveCheck } from './archetype.js';
import { FIRST_INVESTIGATOR } from './investigator.js';

const T0 = Date.parse('2026-10-01T06:00:00Z');
const DAY = 86_400_000;
const season = { seed: 'season-3', opensAt: T0 };
const chainOf = (id: string) => MYTHOS_CHAINS.findIndex((c) => c.some((m) => m.id === id));

describe('chains', () => {
  it('are five of three, every card with a headline and a rule', () => {
    expect(MYTHOS_CHAINS.map((c) => c.length)).toEqual([3, 3, 3, 3, 3]);
    expect(MYTHOS).toHaveLength(15);
    expect(new Set(MYTHOS.map((c) => c.id)).size).toBe(15);
  });

  it('three days of the season tell one chain, page by page', () => {
    for (let block = 0; block < 6; block += 1) {
      const days = [0, 1, 2].map((d) => mythosFor(season, T0 + (block * 3 + d) * DAY + DAY / 2));
      const chain = chainOf(days[0]?.id as string);
      expect(days.map((c) => chainOf(c.id))).toEqual([chain, chain, chain]);
      expect(days).toEqual(MYTHOS_CHAINS[chain]);
    }
    expect(dawnsSince(T0, T0 + 3 * DAY + DAY / 2)).toBe(3);
  });
});

describe('effects', () => {
  it('a dice card moves its own skill and no other', () => {
    const bells = MYTHOS.find((c) => c.id === 'bells') ?? null;
    expect(mythosDice(bells, 'will')).toBe(-1);
    expect(mythosDice(bells, 'lore')).toBe(0);
    expect(mythosDice(null, 'will')).toBe(0);
  });

  it('resolveCheck rolls the extra dice', () => {
    const inv = FIRST_INVESTIGATOR(0);
    const plain = resolveCheck(inv, { skill: 'will', need: 1 }, () => 0.5);
    const fewer = resolveCheck(inv, { skill: 'will', need: 1 }, () => 0.5, 0, -1);
    expect(fewer.faces).toHaveLength(plain.faces.length - 1);
  });
});
