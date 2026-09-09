import { describe, expect, it } from 'vitest';
import { BASE_STRENGTH } from '@es3/core';
import type { StepClaimOutcome } from '@es3/core';
import { nextDiscovery } from './useDiscovery.js';

/**
 * The commit-once rule the "New ground" screen depends on (BRDC-CLAIM-011).
 *
 * A step-claim is a write that has already happened by the time its promise resolves, so
 * the outcome is committed unconditionally. `claimStep` can resolve more than once for the
 * same cell — a re-fired effect, border jitter, a retry — and only the first may surface.
 */
const H3 = '8b1fb46622dcfff';
/** A step-claim now carries the outcome it took, so the claim can be announced. */
const took: StepClaimOutcome = {
  claimed: H3,
  outcome: {
    h3: H3,
    kind: 'claimed',
    strengthBefore: 0,
    strengthAfter: BASE_STRENGTH,
    previousOwner: null,
  },
};

describe('nextDiscovery', () => {
  it('is nothing when the step claimed nothing', () => {
    expect(nextDiscovery({ claimed: null }, new Set())).toBeNull();
  });

  it('surfaces a hex the first time it is claimed', () => {
    expect(nextDiscovery(took, new Set())).toBe(H3);
  });

  it('never surfaces the same hex twice', () => {
    expect(nextDiscovery(took, new Set([H3]))).toBeNull();
  });
});
