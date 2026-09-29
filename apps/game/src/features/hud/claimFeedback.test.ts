import { describe, expect, it } from 'vitest';
import { cellAt, neighboursOf, resourceOf } from '@es3/core';
import type { CaptureOutcome } from '@es3/core';
import { isRewardClaim } from './claimFeedback.js';

/**
 * A patch of real cells, grown outward from one point until we have enough. Started
 * well away from the Härmälä survey box (BRDC-TERRAIN-003) so the terrain here is the
 * hash and every resource kind actually turns up.
 */
function sample(n = 1500): string[] {
  const start = cellAt({ lat: 62.6, lng: 25.7 });
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

function oc(kind: CaptureOutcome['kind'], h3: string): CaptureOutcome {
  return { h3, kind, strengthBefore: 0, strengthAfter: 100, previousOwner: null };
}

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
