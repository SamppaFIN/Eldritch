import { describe, expect, it } from 'vitest';
import { MYTHOS, dawnsSince, doomAt, mythosFor } from './doom.js';
import { advanceSeason, openSeason } from './season.js';

const DAY = 86_400_000;
const T0 = Date.parse('2026-10-01T09:00:00Z'); // after dawn

describe('the Doom track (BRDC-DOOM-001)', () => {
  it('counts dawns, not days since opening', () => {
    expect(dawnsSince(T0, T0)).toBe(0);
    expect(dawnsSince(T0, T0 + DAY)).toBe(1);
    expect(dawnsSince(T0, Date.parse('2026-10-02T02:00:00Z'))).toBe(0); // before the next dawn
  });

  it('does not move on the clock unless the season says so', () => {
    const s = openSeason(2, 'x', 'seed', T0);
    expect(doomAt(s, T0 + 90 * DAY)).toBe(0);
    expect(doomAt({ ...s, doomEveryNDawns: 3 }, T0 + 9 * DAY)).toBe(3);
  });

  it('gates shift it, and it stays within 0 … 13', () => {
    const s = { ...openSeason(2, 'x', 'seed', T0), doomEveryNDawns: 3 };
    expect(doomAt({ ...s, doomShift: 2 }, T0 + 3 * DAY)).toBe(3);
    expect(doomAt({ ...s, doomShift: -5 }, T0)).toBe(0);
    expect(doomAt(s, T0 + 100 * DAY)).toBe(13);
  });

  it('the season carries the Doom and wakes the Ancient One at 13', () => {
    const s = { ...openSeason(2, 'x', 'seed', T0), doomEveryNDawns: 3 };
    expect(advanceSeason(s, T0 + 6 * DAY, 6)).toMatchObject({ phase: 'open', doom: 2 });
    expect(advanceSeason(s, T0 + 39 * DAY, 6).phase).toBe('reckoning');
  });
});

describe('the Mythos card', () => {
  it('is the same for everyone on a day, and changes with the dawn', () => {
    const s = { seed: 'season-2', opensAt: T0 };
    expect(mythosFor(s, T0 + 1_000)).toEqual(mythosFor(s, T0 + 2_000));
    const week = new Set(Array.from({ length: 14 }, (_, d) => mythosFor(s, T0 + d * DAY).id));
    expect(week.size).toBeGreaterThan(3);
    expect(MYTHOS.every((c) => c.headline && c.rule)).toBe(true);
  });
});
