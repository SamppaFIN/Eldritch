/** BRDC-TERROR-001 — the town's terror: the track, its effects, the Markets and the villages. */
import { describe, expect, it } from 'vitest';
import { TERROR_TRADE_LOSS, nextTerror, terrorEffects } from './terror.js';
import { TRADE_LOSS, cityStates, trade } from './cityState.js';
import { EMPTY_POOL, RESOURCE_KINDS } from './terrain.js';
import type { ResourceKind } from './terrain.js';
import { computeHexYield, realmBonus, realmOnlyYield } from './hexYield.js';
import { MemoryStore } from '../data/kv.js';
import { K } from '../data/keys.js';
import { yieldContext } from '../data/pouch.js';
import { placeCityStates, tradeAt } from '../data/cityStateStore.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const NOW = Date.parse('2026-10-09T12:00:00Z');
const H = 3_600_000;

describe('the track', () => {
  it('moves one a gate and stays within 0–10', () => {
    expect(nextTerror(0, 1)).toBe(1);
    expect(nextTerror(0, -1)).toBe(0);
    expect(nextTerror(10, 1)).toBe(10);
  });
  it('bargains harder at 5 and shuts the Markets at 8', () => {
    expect(terrorEffects(4)).toEqual({ tradeLoss: TRADE_LOSS, marketFactor: 1, said: '' });
    expect(terrorEffects(5)).toMatchObject({ tradeLoss: TERROR_TRADE_LOSS, marketFactor: 1 });
    expect(terrorEffects(8)).toMatchObject({ tradeLoss: TERROR_TRADE_LOSS, marketFactor: 0.75 });
    const pool = { ...EMPTY_POOL, food: 20 };
    const calm = trade(pool, 'food', 'gold');
    const afraid = trade(pool, 'food', 'gold', 20, terrorEffects(6).tradeLoss);
    expect(calm.ok && afraid.ok && afraid.got < calm.got).toBe(true);
  });
});

describe('in the realm', () => {
  const ring = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 1);
  const cells: Cell[] = ring.map((h3, i) => ({
    h3, ownerId: 'me', strength: 100, lastVisitedAt: NOW - H, visitDays: [], ...(i === 1 ? { buildings: [{ id: 'market' as const, builtAt: 0 }] } : {}),
  }));

  it('at 8 a Market makes a quarter less gold, on its card and in the settle alike', async () => {
    const s = new MemoryStore();
    await s.set(K.mythos, { seed: 's3', opensAt: NOW - 10 * 24 * H, terror: 8 });
    const ctx = (await yieldContext(s, cells, NOW)).ctx;
    const market = computeHexYield(cells[1] as Cell, ctx).contributions;
    const line = market.find((c) => c.label === 'Terror');
    const gold = market.filter((c) => c.resource === 'gold' && c.label !== 'Terror' && !c.label.startsWith('Terrain:')).reduce((n, c) => n + c.amount, 0);
    expect(gold).toBeGreaterThan(0);
    expect(line?.amount).toBeCloseTo(-gold * 0.25, 9);
    const sum: Partial<Record<ResourceKind, number>> = {};
    for (const c of [...cells.flatMap((x) => computeHexYield(x, ctx).contributions), ...realmOnlyYield(ctx)]) {
      if (!c.label.startsWith('Terrain:')) sum[c.resource] = (sum[c.resource] ?? 0) + c.amount;
    }
    for (const k of RESOURCE_KINDS) expect(sum[k] ?? 0).toBeCloseTo(realmBonus(ctx)[k] ?? 0, 9);
    expect(computeHexYield(cells[1] as Cell, { ...ctx, terror: 7 }).contributions.some((c) => c.label === 'Terror')).toBe(false);
  });

  it('a village at the quay keeps more of the parcel when the town is afraid', async () => {
    const trading = async (terror: number) => {
      const s = new MemoryStore();
      await s.set('resources', { pool: { ...EMPTY_POOL, food: 100 }, since: NOW, sinceDay: NOW });
      await s.set(K.mythos, { seed: 's3', opensAt: NOW, terror });
      await placeCityStates(s, NOW);
      const door = cellAt((cityStates()[0] as { door: { lat: number; lng: number } }).door);
      return tradeAt(s, door, 'food', 'gold', [], NOW);
    };
    const calm = await trading(0);
    const afraid = await trading(6);
    expect(calm.ok && afraid.ok).toBe(true);
    if (calm.ok && afraid.ok) expect(afraid.got).toBeLessThan(calm.got);
  });
});
