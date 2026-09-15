/**
 * BRDC-DETAIL-002 — the hex's own arithmetic.
 *
 * The point of the line is that a player can check it, so these lock the two things that
 * would make it a lie: that the parts add up to the total, and that a part only appears
 * when its cause is actually on the cell.
 */
import { describe, expect, it } from 'vitest';
import { TRICKLE_PER_HOUR, cellAt } from '@es3/core';
import type { Cell } from '@es3/core';
import { cellIncome } from './income.js';

const T0 = Date.parse('2026-09-15T10:00:00Z');
/** A shoreline hex — terrain that pays — held and walked just now. */
const cell = (over: Partial<Cell> = {}): Cell => ({
  h3: cellAt({ lat: 61.4729, lng: 23.7259 }),
  ownerId: 'me',
  strength: 300,
  lastVisitedAt: T0,
  visitDays: [],
  terrain: { kind: 'coast', source: 'seed' },
  ...over,
});

const sum = (t: Partial<Record<string, number>>): number =>
  Object.values(t).reduce<number>((a, b) => a + (b ?? 0), 0);

describe('cellIncome', () => {
  it('starts with the ground itself', () => {
    const income = cellIncome(cell(), {}, [], T0);
    expect(income.parts).toHaveLength(1);
    expect(income.parts[0]?.from).toBe('The ground');
    expect(income.total.food).toBe(TRICKLE_PER_HOUR);
  });

  it('adds the Work standing on it', () => {
    const withFishery = cell({ buildings: [{ id: 'fishery', builtAt: T0 }] });
    const income = cellIncome(withFishery, {}, [], T0);
    expect(income.parts.some((p) => p.from === 'The Work on it')).toBe(true);
    expect(sum(income.total)).toBeGreaterThan(TRICKLE_PER_HOUR);
  });

  it('adds research, but only once it is researched', () => {
    const before = cellIncome(cell(), {}, [], T0);
    const after = cellIncome(cell(), {}, ['tide-lore'], T0);
    expect(after.parts.some((p) => p.from === 'Research')).toBe(true);
    expect(sum(after.total)).toBeGreaterThan(sum(before.total));
  });

  /*
   * The whole reason the line can be trusted: whatever is listed is what was added. If a
   * part is ever shown that is not in the total, or the total grows without a part to
   * explain it, the card has become a claim rather than a sum.
   */
  it('always adds up to exactly what it lists', () => {
    const rich = cell({ buildings: [{ id: 'fishery', builtAt: T0 }] });
    const income = cellIncome(rich, {}, ['tide-lore'], T0);
    const fromParts = income.parts.reduce((n, p) => n + p.perHour, 0);
    expect(fromParts).toBe(sum(income.total));
  });

  it('pays nothing on ground that yields nothing', () => {
    const plain = cellIncome(cell({ terrain: { kind: 'plain', source: 'seed' } }), {}, [], T0);
    expect(plain.parts).toHaveLength(0);
    expect(sum(plain.total)).toBe(0);
  });
});
