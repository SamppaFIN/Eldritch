/** BRDC-CONDITION-001 — lasting conditions: what they do, and every way they end. */
import { describe, expect, it } from 'vitest';
import { activeConditions, conditionDice, conditionLuck, cureByWalking, dueConditions, gainCondition, hasCondition, seizedBy } from './condition.js';
import { FIRST_INVESTIGATOR, diceFor, luckFor } from './investigator.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-06T12:00:00Z');
const H = 3_600_000;
const inv = FIRST_INVESTIGATOR(T0);
const cell = (h3: string, strength: number, lastVisitedAt = T0 - H): Cell => ({ h3, ownerId: 'me', strength, lastVisitedAt, visitDays: [] });

describe('effects', () => {
  it('Paranoia takes a Wit die; a Dark Pact gives two Lore dice', () => {
    const p = gainCondition(inv, 'paranoia', T0);
    expect(conditionDice(p, 'observe', T0)).toBe(-1);
    expect(diceFor(p, 'observe', T0)).toBe(diceFor(inv, 'observe', T0) - 1);
    expect(conditionDice(gainCondition(inv, 'dark-pact', T0), 'lore', T0)).toBe(2);
  });

  it('Cursed and Blessed set the luck, and cancel each other', () => {
    expect(luckFor(gainCondition(inv, 'cursed', T0), T0)).toBe('cursed');
    expect(luckFor(gainCondition(inv, 'blessed', T0), T0)).toBe('blessed');
    expect(conditionLuck(gainCondition(gainCondition(inv, 'cursed', T0), 'blessed', T0), T0)).toBeNull();
  });
});

describe('clocks', () => {
  it('every condition ends on its own; a second of the same restarts the clock', () => {
    const a = gainCondition(inv, 'amnesia', T0);
    expect(hasCondition(a, 'amnesia', T0 + 23 * H)).toBe(true);
    expect(hasCondition(a, 'amnesia', T0 + 24 * H)).toBe(false);
    const again = gainCondition(a, 'amnesia', T0 + 20 * H);
    expect(activeConditions(again, T0 + 30 * H)).toHaveLength(1);
  });

  it('dueConditions names the ended ones and the prices they leave', () => {
    const both = gainCondition(gainCondition(inv, 'debt', T0), 'dark-pact', T0);
    expect(dueConditions(both, T0 + 71 * H)).toEqual({ ended: [], debt: false, pact: false });
    const due = dueConditions(both, T0 + 72 * H);
    expect(due.ended.map((c) => c.id).sort()).toEqual(['dark-pact', 'debt']);
    expect(due).toMatchObject({ debt: true, pact: true });
  });
});

describe('walking cures', () => {
  it('Paranoia lifts on the Hearth hex, a Curse on a temple — walked after it came', () => {
    const held = gainCondition(gainCondition(inv, 'paranoia', T0), 'cursed', T0);
    const before = [cell('home', 300, T0 - H), cell('temple', 100, T0 - H)];
    expect(cureByWalking(held, before, 'home', new Set(['temple']))).toBe(held);
    const after = [cell('home', 300, T0 + H), cell('temple', 100, T0 - H)];
    expect(cureByWalking(held, after, 'home', new Set(['temple'])).conditions?.map((c) => c.id)).toEqual(['cursed']);
    const both = [cell('home', 300, T0 + H), cell('temple', 100, T0 + 2 * H)];
    expect(cureByWalking(held, both, 'home', new Set(['temple'])).conditions).toEqual([]);
  });
});

describe('seizedBy', () => {
  it('takes the weakest hex that is not the Hearth', () => {
    expect(seizedBy([cell('home', 1), cell('a', 300), cell('b', 120)], 'home')).toBe('b');
    expect(seizedBy([cell('home', 1)], 'home')).toBeNull();
  });
});
