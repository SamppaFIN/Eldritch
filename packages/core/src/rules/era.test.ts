/** BRDC-ERA-001 — who the realm became at each Age. */
import { describe, expect, it } from 'vitest';
import { eraBonus, eraChain, pendingEra } from './era.js';
import type { LoreId } from './lore.js';

const AGE_ONE: LoreId[] = ['husbandry', 'woodcraft', 'kindling'];
const AGE_TWO: LoreId[] = ['granaries', 'stone-and-bellows', 'ley-reading'];

describe('pendingEra', () => {
  it('waits for nothing in Age I', () => {
    expect(pendingEra(['husbandry'], [])).toBeNull();
  });
  it('asks once on entering Age II, and not again until Age III', () => {
    expect(pendingEra(AGE_ONE, [])).toBe(2);
    expect(pendingEra(AGE_ONE, ['merchants'])).toBeNull();
    expect(pendingEra([...AGE_ONE, ...AGE_TWO], ['merchants'])).toBe(3);
  });
});

describe('eraBonus and eraChain', () => {
  it('adds every character chosen, and says the chain in order', () => {
    expect(eraBonus(['merchants', 'seers', 'merchants'])).toEqual({ gold: 4, wisdom: 1, mana: 1 });
    expect(eraBonus([])).toEqual({});
    expect(eraChain(['wardens', 'seers'])).toBe('Wardens → Seers');
  });
});
