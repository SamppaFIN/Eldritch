import { describe, expect, it } from 'vitest';
import { CLAIM_YIELD, cellAt, neighboursOf, resourceOf } from '@es3/core';
import type { CaptureOutcome } from '@es3/core';
import { gainsLine, isRewardClaim, resourceGainsFor } from './claimFeedback.js';

/** A patch of real cells, grown outward from one point until we have enough. */
function sample(n = 400): string[] {
  const start = cellAt({ lat: 61.47290805294704, lng: 23.725882485862012 });
  const seen = new Set<string>([start]);
  const queue = [start];
  while (seen.size < n && queue.length) {
    for (const nb of neighboursOf(queue.shift() as string)) {
      if (!seen.has(nb)) {
        seen.add(nb);
        queue.push(nb);
      }
    }
  }
  return [...seen];
}

const CELLS = sample();
const wood = CELLS.find((h) => resourceOf(h) === 'wood') as string;
const gold = CELLS.find((h) => resourceOf(h) === 'gold') as string;
const plain = CELLS.find((h) => resourceOf(h) === null) as string;

function oc(kind: CaptureOutcome['kind'], h3: string): CaptureOutcome {
  return { h3, kind, strengthBefore: 0, strengthAfter: 100, previousOwner: null };
}

describe('resourceGainsFor', () => {
  it('pays CLAIM_YIELD of the cell resource for a fresh claim', () => {
    expect(resourceGainsFor([oc('claimed', wood)])).toEqual({ wood: CLAIM_YIELD });
  });

  it('pays for a stolen cell too', () => {
    expect(resourceGainsFor([oc('taken', gold)])).toEqual({ gold: CLAIM_YIELD });
  });

  it('sums cells of the same resource', () => {
    const two = CELLS.filter((h) => resourceOf(h) === 'wood').slice(0, 2);
    expect(resourceGainsFor(two.map((h) => oc('claimed', h)))).toEqual({ wood: 2 * CLAIM_YIELD });
  });

  it('a reinforce or a mere hit earns nothing', () => {
    expect(resourceGainsFor([oc('reinforced', wood), oc('damaged', gold), oc('unchanged', wood)])).toEqual({});
  });

  it('plain ground pays nothing', () => {
    expect(resourceGainsFor([oc('claimed', plain)])).toEqual({});
  });
});

describe('gainsLine', () => {
  it('reads the gains in order', () => {
    expect(gainsLine({ wood: 30, gold: 10 })).toBe('+30 wood · +10 gold');
  });

  it('is empty when nothing was gained', () => {
    expect(gainsLine({})).toBe('');
  });
});

describe('isRewardClaim', () => {
  it('is true when a cell was claimed or taken', () => {
    expect(isRewardClaim([oc('claimed', wood)])).toBe(true);
    expect(isRewardClaim([oc('taken', gold)])).toBe(true);
  });

  it('is false for a reinforce-only loop and for nothing at all', () => {
    expect(isRewardClaim([oc('reinforced', wood)])).toBe(false);
    expect(isRewardClaim([])).toBe(false);
  });
});
