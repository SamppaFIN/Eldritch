import { describe, expect, it } from 'vitest';
import { BUILDINGS, EMPTY_POOL, WORKS_DEFS } from '@es3/core';
import { REFUSAL_TEXT, STATE_LABEL, effectResource, givesOf, shortLine } from './worksCopy.js';

describe('worksCopy (BRDC-WORKS-001)', () => {
  it('every state has a mark and a word, never colour alone', () => {
    for (const label of Object.values(STATE_LABEL)) expect(label).toMatch(/[A-Za-z]/);
  });

  it('every refusal says what to do', () => {
    for (const text of Object.values(REFUSAL_TEXT)) expect(text.length).toBeGreaterThan(10);
  });

  it('gives: the base output plus what has been learned', () => {
    const forge = givesOf(WORKS_DEFS.forge, ['forge.hot-hearth']);
    expect(forge.iron).toBe((BUILDINGS.forge.produces?.iron ?? 0) + 2);
  });

  it('gives: a place pays its mana', () => {
    expect(givesOf(WORKS_DEFS.keep, [], 6)).toEqual({ mana: 6 });
  });

  it('the highlighted words take the colour of what they are about', () => {
    const [stalls] = WORKS_DEFS.market.tree.tiers[0]!.nodes;
    expect(effectResource(stalls!.effects)).toBe('gold');
    expect(effectResource([{ kind: 'special', id: 'questSlot' }])).toBeNull();
  });

  it('short says what is missing, not what failed', () => {
    expect(shortLine({ stone: 40 }, { ...EMPTY_POOL, stone: 20 }, (k) => k)).toBe('Short 20 stone.');
    expect(shortLine({ stone: 40 }, { ...EMPTY_POOL, stone: 50 }, (k) => k)).toBeNull();
  });
});
