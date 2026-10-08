/** BRDC-TRADEROUTE-001 — a walk from Market to Market, through the walk writer, pays gold. */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { recordWalk } from './walkWriter.js';
import { tradeRouteApi } from './tradeRouteStore.js';
import { yieldContext } from './pouch.js';
import { realmBonus, realmOnlyYield } from '../rules/hexYield.js';
import { simulateWalk } from '../sim/walk.js';
import { cellAt } from '../geo/cells.js';
import type { Cell, H3Index, TrailPoint } from '../types/domain.js';

const T0 = Date.parse('2026-10-08T12:00:00Z');
const walk = simulateWalk({ start: { lat: 61.4729, lng: 23.7258 }, pattern: 'straight', headingDeg: 0, durationMs: (600 / 1.4) * 1000, noiseM: 0, startTime: T0 });
const A = cellAt(walk[0] as TrailPoint);
const B = cellAt(walk[walk.length - 1] as TrailPoint);
const market = (h3: H3Index): Cell => ({ h3, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [], buildings: [{ id: 'market', builtAt: 0 }] });

describe('trade routes in the store', () => {
  it('two batches of one walk make a route that pays while both Markets hold', async () => {
    const store = new MemoryStore();
    await store.set(K.cell(A), market(A));
    await store.set(K.cell(B), market(B));
    const half = Math.floor(walk.length / 2);
    const walker = { id: 'me', level: 1, hasTerritory: true };
    await recordWalk(store, walk.slice(0, half), walker);
    await recordWalk(store, walk.slice(half), walker);

    const owned = [market(A), market(B)];
    const rows = await tradeRouteApi(() => store, async () => owned).view(T0);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ active: true });

    const ctx = (await yieldContext(store, owned, T0)).ctx;
    const line = realmOnlyYield(ctx).find((c) => c.label.startsWith('Trade route:'));
    expect(line?.amount).toBeCloseTo(rows[0]?.goldPerHour ?? 0, 9);
    const without = { ...ctx, routes: [] };
    expect((realmBonus(ctx).gold ?? 0) - (realmBonus(without).gold ?? 0)).toBeCloseTo(rows[0]?.goldPerHour ?? 0, 9);
    // Lose one Market and the route stops paying.
    expect((await tradeRouteApi(() => store, async () => [market(A)]).view(T0))[0]?.active).toBe(false);
  });
});
