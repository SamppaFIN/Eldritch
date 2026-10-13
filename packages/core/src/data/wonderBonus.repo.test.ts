/**
 * BRDC-WONDER-003 — a found wonder pays its bonus to the whole realm, while its hex is held.
 */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { yieldContext } from './pouch.js';
import { realmBonus, realmOnlyYield } from '../rules/hexYield.js';
import { WONDERS } from '../rules/wonder.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-13T12:00:00Z');
const ring = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 2);
const cells: Cell[] = ring.map((h3) => ({ h3, ownerId: 'me', strength: 100, lastVisitedAt: T0 + 1, visitDays: [] }));
const WONDER_HEX = ring[5] as string;

describe('a wonder in the pouch', () => {
  it("pays R'lyeh's bonus to the realm, line by line, while its hex is held", async () => {
    const store = new MemoryStore();
    await store.set(K.wonderFinds, { rlyeh: { h3: WONDER_HEX, at: T0 } });
    const ctx = (await yieldContext(store, cells, T0)).ctx;

    for (const [k, v] of Object.entries(WONDERS.rlyeh.bonus)) {
      expect(realmOnlyYield(ctx)).toContainEqual({ resource: k, amount: v, source: 'other', label: `Wonder: ${WONDERS.rlyeh.name}`, sourceId: 'rlyeh' });
      const without = realmBonus({ ...ctx, wonders: [] });
      expect((realmBonus(ctx)[k as keyof typeof without] ?? 0) - (without[k as keyof typeof without] ?? 0)).toBeCloseTo(v as number, 6);
    }
  });

  it('pays nothing once the hex is lost, and nothing before a find', async () => {
    const store = new MemoryStore();
    await store.set(K.wonderFinds, { rlyeh: { h3: WONDER_HEX, at: T0 } });
    const lost = cells.filter((c) => c.h3 !== WONDER_HEX);
    const ctx = (await yieldContext(store, lost, T0)).ctx;
    expect(realmOnlyYield(ctx).some((l) => l.label.startsWith('Wonder:'))).toBe(false);

    const none = (await yieldContext(new MemoryStore(), cells, T0)).ctx;
    expect(none.wonders).toEqual([]);
  });
});
