/**
 * BRDC-KEEP-004 — the Keep's temple list, pure parts.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_POOL, MAX_TEMPLE_EXPANSION, expansionCost } from '@es3/core';
import type { ResourcePool, RevealedPlace } from '@es3/core';
import { cannotExpand, templeRows } from './KeepTemples.js';

const place = (kind: RevealedPlace['kind'], over: Partial<RevealedPlace> = {}): RevealedPlace => ({
  h3: `${kind}-${over.rank ?? 0}`,
  kind,
  dwellMs: 0,
  rank: 0,
  ...over,
});
const pool = (over: Partial<ResourcePool> = {}): ResourcePool => ({ ...EMPTY_POOL, ...over });

describe('templeRows', () => {
  it('keeps temples and drops the Anchor and anything else', () => {
    const places = [place('anchor'), place('temple', { rank: 1 }), place('temple', { rank: 2 })];
    expect(templeRows(places).map((p) => p.kind)).toEqual(['temple', 'temple']);
  });
});

describe('cannotExpand', () => {
  it('is true at the ceiling', () => {
    expect(cannotExpand(MAX_TEMPLE_EXPANSION, pool({ stone: 999, gold: 999 }))).toBe(true);
  });

  it('is true when the pouch cannot cover the next step', () => {
    const cost = expansionCost(1);
    expect(cannotExpand(0, pool({ stone: (cost.stone ?? 0) - 1, gold: cost.gold ?? 0 }))).toBe(true);
    expect(cannotExpand(0, null)).toBe(true);
  });

  it('is false when it is affordable and below the ceiling', () => {
    const cost = expansionCost(1);
    expect(cannotExpand(0, pool({ stone: cost.stone ?? 0, gold: cost.gold ?? 0 }))).toBe(false);
  });
});
