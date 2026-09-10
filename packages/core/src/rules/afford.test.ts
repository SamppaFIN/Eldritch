/**
 * BRDC-STATS-001 — "when can I afford it".
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_POOL } from './terrain.js';
import type { ResourcePool } from './terrain.js';
import { shortOf, timeToAfford } from './afford.js';

const HOUR = 3_600_000;
const pool = (over: Partial<ResourcePool> = {}): ResourcePool => ({ ...EMPTY_POOL, ...over });

describe('timeToAfford', () => {
  it('is zero when the pouch already covers the cost', () => {
    expect(timeToAfford(pool({ wood: 50, stone: 10 }), { wood: 5 }, { wood: 30, stone: 8 })).toBe(0);
  });

  it('is the wait for the slowest resource the cost needs', () => {
    // 20 more wood at 5/h → 4 h; 10 more stone at 5/h → 2 h. The route takes the longer.
    const ms = timeToAfford(pool(), { wood: 5, stone: 5 }, { wood: 20, stone: 10 });
    expect(ms).toBe(4 * HOUR);
  });

  it('rounds up to the next whole hour', () => {
    // 11 wood at 5/h is 2.2 h — the forecast settles in whole hours, so three.
    expect(timeToAfford(pool(), { wood: 5 }, { wood: 11 })).toBe(3 * HOUR);
  });

  it('is null when a needed resource is not being produced at all', () => {
    expect(timeToAfford(pool({ wood: 3 }), { wood: 0 }, { wood: 10 })).toBe(null);
    expect(timeToAfford(pool(), { wood: 5 }, { wood: 10, culture: 2 })).toBe(null);
  });
});

describe('shortOf (BRDC-UI-002)', () => {
  const pool = (over: Partial<ResourcePool> = {}): ResourcePool => ({ ...EMPTY_POOL, ...over });

  it('says nothing when the cost can be paid', () => {
    expect(shortOf(pool({ stone: 200, gold: 100 }), { stone: 120, gold: 80 })).toEqual({});
  });

  it('names only what is missing, and by how much', () => {
    expect(shortOf(pool({ stone: 100, gold: 100 }), { stone: 120, gold: 80 })).toEqual({ stone: 20 });
  });

  /*
   * A pouch still being read is short of everything the cost names. "You need 120 stone"
   * while the number loads is better than a grey button with no explanation at all — and
   * it corrects itself a moment later.
   */
  it('treats an unread pouch as short of the whole cost', () => {
    expect(shortOf(null, { stone: 120, gold: 80 })).toEqual({ stone: 120, gold: 80 });
  });

  it('ignores a resource the cost does not name', () => {
    expect(shortOf(pool({ wood: 0 }), { stone: 10 })).toEqual({ stone: 10 });
  });
});
