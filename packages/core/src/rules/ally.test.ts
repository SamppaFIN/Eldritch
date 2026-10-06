/** BRDC-ALLY-001 — an ally adds a die or bargains a price. */
import { describe, expect, it } from 'vitest';
import { ALLIES, allyDice, allyDiscount } from './ally.js';
import { FIRST_INVESTIGATOR, diceFor } from './investigator.js';
import { priceFor } from './archetype.js';

describe('allies', () => {
  it('Cornelius adds a Lore die, Grug a Vigor die, and only on their own skill', () => {
    expect(allyDice('cornelius', 'lore')).toBe(1);
    expect(allyDice('cornelius', 'will')).toBe(0);
    expect(allyDice('grug', 'fight')).toBe(1);
    expect(allyDice(undefined, 'lore')).toBe(0);
    const inv = { ...FIRST_INVESTIGATOR(0), ally: 'cornelius' as const };
    expect(diceFor(inv, 'lore')).toBe(diceFor(FIRST_INVESTIGATOR(0), 'lore') + 1);
  });

  it('the Merchant takes a tenth off, and stacks with the Dockworker on what is left', () => {
    expect(allyDiscount('merchant')).toBe(0.1);
    expect(priceFor({ wood: 100 }, undefined, 'merchant')).toEqual({ wood: 90 });
    expect(priceFor({ wood: 100 }, 'dockworker', 'merchant')).toEqual({ wood: 81 });
    const cost = { wood: 100 };
    expect(priceFor(cost, undefined, 'grug')).toBe(cost);
  });

  it('each says what they bring', () => {
    for (const a of Object.values(ALLIES)) expect(a.gift.length).toBeGreaterThan(5);
  });
});
