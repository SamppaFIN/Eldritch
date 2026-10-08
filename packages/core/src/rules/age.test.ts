/** BRDC-AGE-001 — the week's golden or dark age. */
import { describe, expect, it } from 'vitest';
import { ageFor, rollWeek, weekEffect, weekKey } from './age.js';

const MON = Date.parse('2026-10-05T08:00:00Z');
const WEEK = 7 * 86_400_000;

describe('ageFor', () => {
  it('golden at a fifth more, dark at four-tenths less, plain between', () => {
    expect(ageFor(120, 100)).toBe('golden');
    expect(ageFor(119, 100)).toBe('plain');
    expect(ageFor(60, 100)).toBe('dark');
    expect(ageFor(61, 100)).toBe('plain');
  });
  it('a dark week’s promise makes matching the week before enough', () => {
    expect(ageFor(100, 100, true)).toBe('golden');
    expect(ageFor(99, 100, true)).toBe('plain');
  });
  it('after a week of nothing, any growth is golden', () => {
    expect(ageFor(5, 0)).toBe('golden');
    expect(ageFor(0, 0)).toBe('plain');
  });
});

describe('weekKey', () => {
  it('is the Monday the week starts on, UTC', () => {
    expect(weekKey(MON)).toBe('2026-10-05');
    expect(weekKey(Date.parse('2026-10-11T23:59:00Z'))).toBe('2026-10-05');
    expect(weekKey(Date.parse('2026-10-12T00:00:00Z'))).toBe('2026-10-12');
  });
});

describe('rollWeek', () => {
  it('the season’s first weeks are plain, then the pace decides', () => {
    const w1 = rollWeek(undefined, MON, 0);
    expect(w1.kind).toBe('plain');
    const w2 = rollWeek(w1, MON + WEEK, 100);
    expect(w2.kind).toBe('plain');
    expect(rollWeek(w2, MON + WEEK + 3_600_000, 999)).toBe(w2);
    const w3 = rollWeek(w2, MON + 2 * WEEK, 220);
    expect(w3).toMatchObject({ kind: 'golden', week: '2026-10-19' });
    expect(Object.keys(w3.marks)).toHaveLength(3);
  });

  it('a dark week leaves a promise, and the next golden week spends it', () => {
    const w2 = rollWeek(rollWeek(undefined, MON, 0), MON + WEEK, 100);
    const dark = rollWeek(w2, MON + 2 * WEEK, 140);
    expect(dark).toMatchObject({ kind: 'dark', promise: true });
    const golden = rollWeek(dark, MON + 3 * WEEK, 180);
    expect(golden.kind).toBe('golden');
    expect(golden.promise).toBeUndefined();
  });

  it('a week away breaks the run: plain again', () => {
    const w2 = rollWeek(rollWeek(undefined, MON, 0), MON + WEEK, 100);
    expect(rollWeek(w2, MON + 3 * WEEK, 500).kind).toBe('plain');
  });
});

describe('weekEffect', () => {
  it('a record for another week counts for nothing', () => {
    const golden = { week: '2026-10-05', kind: 'golden' as const, marks: {}, boon: 'tithe' as const };
    expect(weekEffect(golden, MON)).toEqual({ factor: 1.1, kind: 'golden', boon: 'tithe' });
    expect(weekEffect(golden, MON + WEEK)).toEqual({ factor: 1, kind: 'plain' });
    expect(weekEffect({ ...golden, kind: 'dark' }, MON).factor).toBe(0.9);
  });
});
