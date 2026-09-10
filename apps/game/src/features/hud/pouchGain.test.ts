/**
 * BRDC-REVEAL-002 — two payouts, one toast, and neither one shadows the other.
 */
import { describe, expect, it } from 'vitest';
import { latestGain } from './PouchGain.js';
import type { Collected } from '@es3/core';

const gain = (at: number, over: Partial<Collected> = {}): Collected => ({
  delta: { wisdom: 20 },
  total: 20,
  hours: 0,
  at,
  ...over,
});

describe('latestGain', () => {
  it('shows the one that just happened', () => {
    const older = gain(1_000);
    const newer = gain(2_000);
    expect(latestGain(older, newer)).toBe(newer);
    expect(latestGain(newer, older)).toBe(newer);
  });

  /*
   * The failure this guards: wiring the reveal in as `revealGain ?? collected` would have
   * meant the first reveal of a session silently swallowed every Collect after it, since
   * a reveal payout never becomes null again.
   */
  it('does not let one source shadow the other for good', () => {
    const reveal = gain(1_000);
    const collect = gain(5_000, { hours: 3 });
    expect(latestGain(collect, reveal)).toBe(collect);
  });

  it('copes with either side being absent', () => {
    const only = gain(1_000);
    expect(latestGain(null, only)).toBe(only);
    expect(latestGain(only, null)).toBe(only);
    expect(latestGain(null, null)).toBeNull();
  });
});
