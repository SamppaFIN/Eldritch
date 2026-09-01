/**
 * BRDC-EVENT-001 — the dark time is read from the calendar, seen coming, and scales
 * production without a timer.
 */
import { describe, expect, it } from 'vitest';
import { DARK_RADIUS_DAYS, DARK_TIME_FACTOR, darkTimeAt } from './darkTime.js';
import { EMPTY_POOL, settleResources } from './terrain.js';
import type { ResourceState } from './terrain.js';
import type { Cell } from '../types/index.js';

const at = (iso: string) => Date.parse(iso);
const DAY = 86_400_000;

describe('darkTimeAt', () => {
  it('the solstice fortnight is dark, the rest of the year is not', () => {
    expect(darkTimeAt(at('2026-12-21T12:00:00Z')).active).toBe(true);
    expect(darkTimeAt(at('2026-12-21T12:00:00Z')).factor).toBe(DARK_TIME_FACTOR);

    for (const iso of ['2026-06-21T12:00:00Z', '2026-09-01T12:00:00Z', '2027-03-15T12:00:00Z']) {
      expect(darkTimeAt(at(iso))).toMatchObject({ active: false, factor: 1 });
    }
  });

  it('opens and closes a week either side of Dec 21', () => {
    const before = at('2026-12-14T00:00:00Z');
    expect(darkTimeAt(before - DAY).active).toBe(false);
    expect(darkTimeAt(before + DAY).active).toBe(true);

    const after = at('2026-12-28T00:00:00Z');
    expect(darkTimeAt(after - DAY).active).toBe(true);
    expect(darkTimeAt(after + DAY).active).toBe(false);
  });

  it('can be seen coming — inDays counts down to the onset', () => {
    const tenDaysOut = darkTimeAt(at('2026-12-04T00:00:00Z'));
    expect(tenDaysOut.active).toBe(false);
    expect(tenDaysOut.inDays).toBeGreaterThan(0);
    expect(tenDaysOut.inDays).toBeLessThanOrEqual(10);

    const oneDayIn = darkTimeAt(at('2026-12-15T00:00:00Z'));
    expect(oneDayIn.active).toBe(true);
    // ~13 days of winter left.
    expect(oneDayIn.inDays).toBeGreaterThan(10);
  });

  it('is deterministic and independent of when it is asked', () => {
    const t = at('2026-12-20T09:41:00Z');
    const first = darkTimeAt(t);
    for (let i = 0; i < 500; i += 1) expect(darkTimeAt(t)).toEqual(first);
  });

  it('handles the turn of the year without a gap or an overlap', () => {
    // Radius is a week and the solstice is Dec 21, so the window never crosses Jan 1 —
    // but the neighbouring-year check must still leave early January correctly not-dark.
    expect(darkTimeAt(at('2027-01-02T00:00:00Z')).active).toBe(false);
    expect(darkTimeAt(at('2027-01-02T00:00:00Z')).inDays).toBeGreaterThan(300);
    expect(DARK_RADIUS_DAYS).toBeLessThan(11); // window stays inside December
  });
});

describe('settleResources under a dark time', () => {
  const T0 = at('2026-09-01T12:00:00Z');
  const cell: Cell = {
    h3: '8b1f',
    ownerId: 'me',
    strength: 300,
    lastVisitedAt: T0,
    visitDays: [],
  };
  const state: ResourceState = { pool: { ...EMPTY_POOL }, since: T0, sinceDay: T0 };
  const HOUR = 3_600_000;

  it('scales per-hour production by the factor', () => {
    const bright = settleResources(state, [cell], T0 + 100 * HOUR, 9_999, { wood: 10 }, {}, 1);
    const dark = settleResources(state, [cell], T0 + 100 * HOUR, 9_999, { wood: 10 }, {}, 0.6);
    expect(dark.pool.wood).toBe(Math.floor(bright.pool.wood * 0.6));
  });

  it('leaves the numbers untouched at factor 1 (the default)', () => {
    const withArg = settleResources(state, [cell], T0 + 50 * HOUR, 9_999, { gold: 4 }, {}, 1);
    const without = settleResources(state, [cell], T0 + 50 * HOUR, 9_999, { gold: 4 }, {});
    expect(withArg).toEqual(without);
  });
});
