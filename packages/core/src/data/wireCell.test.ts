import { describe, expect, it } from 'vitest';
import { checksum, toWireCell } from './wireCell.js';
import type { Cell } from '../types/domain.js';

const cell: Cell = { h3: '8b1f05600000fff', ownerId: 'me', strength: 123.6, lastVisitedAt: 0, visitDays: [] };

describe('the wire cell the shared world sends', () => {
  it('carries the ground, rounded, and only the extras the cell has', () => {
    expect(toWireCell(cell)).toEqual({ h3: cell.h3, strength: 124 });
    expect(toWireCell({ ...cell, terrain: { kind: 'forest', source: 'tiles' }, buildings: [{ id: 'sawmill', builtAt: 0 }], ownedDays: 3 })).toEqual({
      h3: cell.h3, strength: 124, t: 'forest', b: ['sawmill'], d: 3,
    });
  });

  it('seals a payload: the same text gives the same sum, a changed one does not', () => {
    expect(checksum({ a: 1 })).toBe(checksum({ a: 1 }));
    expect(checksum({ a: 1 })).not.toBe(checksum({ a: 2 }));
    expect(checksum({ a: 1 })).toMatch(/^[0-9a-f]{8}$/);
  });
});
