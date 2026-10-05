import { describe, expect, it } from 'vitest';
import { cellAt, neighboursOf } from '@es3/core';
import { citizenFeatures } from './citizenLayer.js';

const A = cellAt({ lat: 61.4729, lng: 23.7258 });
const B = neighboursOf(A)[0] as string;

describe('citizens on the map (BRDC-MAP-009)', () => {
  it('one figure a staffed hex, a count only when more than one works there', () => {
    const f = citizenFeatures({ [A]: 1, [B]: 3, x: 0 }).features;
    expect(f.map((x) => x.properties)).toEqual([{ count: '' }, { count: '×3' }]);
  });
});
