/**
 * BRDC-HEX-001 — the ownership-history list stays bounded.
 */
import { describe, expect, it } from 'vitest';
import { MAX_CELL_HISTORY } from './constants.js';
import { appendChange } from './history.js';
import type { OwnershipChange } from './history.js';

const change = (at: number): OwnershipChange => ({ to: `p${at}`, from: null, at, power: 100 });

describe('appendChange', () => {
  it('appends oldest-first', () => {
    const one = appendChange(undefined, change(1));
    const two = appendChange(one, change(2));
    expect(two.map((c) => c.at)).toEqual([1, 2]);
  });

  it('never exceeds MAX_CELL_HISTORY, dropping the oldest', () => {
    let history: OwnershipChange[] = [];
    for (let i = 1; i <= MAX_CELL_HISTORY + 5; i += 1) history = appendChange(history, change(i));

    expect(history).toHaveLength(MAX_CELL_HISTORY);
    expect(history[0]?.at).toBe(6);
    expect(history[history.length - 1]?.at).toBe(MAX_CELL_HISTORY + 5);
  });

  it('does not mutate the list it was given', () => {
    const before = appendChange(undefined, change(1));
    const snapshot = structuredClone(before);
    appendChange(before, change(2));
    expect(before).toEqual(snapshot);
  });
});
