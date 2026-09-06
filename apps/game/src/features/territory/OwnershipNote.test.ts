/**
 * BRDC-WAGER-JSON-007 — the ownership share, computed for the ring.
 *
 * The component is React and this suite has no renderer, so it locks the number the ring
 * draws from: 100 on a cell you hold alone, 0 on a rival's, and the yield split on one an
 * imported Wager also claims. `localShare` is the rule; this is the framing around it.
 */
import { describe, expect, it } from 'vitest';
import { localShare } from '@es3/core';
import type { Cell } from '@es3/core';

const T0 = Date.parse('2026-09-06T12:00:00Z');
const base: Cell = { h3: 'x', ownerId: 'me', strength: 300, lastVisitedAt: T0, visitDays: [] };

/** The same expression `OwnershipNote` uses for its purple arc. */
const minePct = (cell: Cell, me: string | null): number =>
  Math.round((cell.ownerId === me ? (cell.shared ? localShare(cell) : 1) : 0) * 100);

describe('the ownership ring percentage', () => {
  it('is 100 on a cell you hold outright', () => {
    expect(minePct(base, 'me')).toBe(100);
  });

  it('is 0 on a rival cell', () => {
    expect(minePct({ ...base, ownerId: 'rival' }, 'me')).toBe(0);
  });

  it('is the strength split on a cell an import also claims', () => {
    const shared: Cell = {
      ...base,
      shared: { with: 'rival', mineAtImport: 300, theirsAtImport: 100 },
    };
    expect(minePct(shared, 'me')).toBe(75);
  });

  it('falls back to the days split when strengths were equal at import', () => {
    const shared: Cell = {
      ...base,
      shared: { with: 'rival', mineAtImport: 200, theirsAtImport: 200, myDays: 3, theirDays: 1 },
    };
    expect(minePct(shared, 'me')).toBe(75);
  });
});
