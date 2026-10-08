/** BRDC-DREAM-001 — the dream's condition: six hours still, opened in the morning. */
import { describe, expect, it } from 'vitest';
import { DREAMS, dreamFor, dreamt } from './dream.js';
import { cellAt, cellsWithin } from '../geo/cells.js';

const HOME = cellAt({ lat: 61.4729, lng: 23.7258 });
const NEXT_DOOR = cellsWithin(HOME, 1).find((h) => h !== HOME) as string;
const FAR = cellAt({ lat: 61.5, lng: 23.8 });
const H = 3_600_000;
const T = 1_000 * H;

describe('dreamt', () => {
  it('six hours where you were, opened in the morning: a dream', () => {
    expect(dreamt({ h3: HOME, t: T }, { h3: HOME, t: T + 6 * H }, 7)).toBe(true);
    expect(dreamt({ h3: HOME, t: T }, { h3: NEXT_DOOR, t: T + 8 * H }, 5)).toBe(true);
  });
  it('not after a short rest, nor in the afternoon, nor somewhere else', () => {
    expect(dreamt({ h3: HOME, t: T }, { h3: HOME, t: T + 5 * H }, 7)).toBe(false);
    expect(dreamt({ h3: HOME, t: T }, { h3: HOME, t: T + 7 * H }, 11)).toBe(false);
    expect(dreamt({ h3: HOME, t: T }, { h3: HOME, t: T + 7 * H }, 4)).toBe(false);
    expect(dreamt({ h3: HOME, t: T }, { h3: FAR, t: T + 7 * H }, 7)).toBe(false);
    expect(dreamt(null, { h3: HOME, t: T }, 7)).toBe(false);
  });
});

describe('the Dreamlands deck', () => {
  it('holds eight cards, and a day always draws the same one', () => {
    expect(DREAMS).toHaveLength(8);
    expect(new Set(DREAMS.map((d) => d.id)).size).toBe(8);
    expect(dreamFor('2026-10-08')).toBe(dreamFor('2026-10-08'));
    expect(DREAMS).toContain(dreamFor('2026-10-09'));
  });
});
