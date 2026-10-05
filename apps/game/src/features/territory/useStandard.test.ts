import { describe, expect, it } from 'vitest';
import { cellAt, neighboursOf } from '@es3/core';
import type { Cell } from '@es3/core';
import { standardWhy } from './useStandard.js';

const MINE = cellAt({ lat: 61.4729, lng: 23.7258 });
const OTHER = neighboursOf(MINE)[0] as string;
const held: Cell[] = [{ h3: MINE, ownerId: 'me', strength: 100, lastVisitedAt: 0, visitDays: [] }];

describe('where a standard may be planted (BRDC-STANDARD-001)', () => {
  it('only on your own ground underfoot, and not twice in one place', () => {
    expect(standardWhy(null, held, null)).toBe('no-position');
    expect(standardWhy(OTHER, held, null)).toBe('not-yours');
    expect(standardWhy(MINE, held, MINE)).toBe('here');
    expect(standardWhy(MINE, held, null)).toBeNull();
  });
});
