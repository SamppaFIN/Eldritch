/**
 * BRDC-TRADE-001 — gold for culture, on your own Tavern, standing on it, a day's worth.
 */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { tavernTradeApi } from './tavernTradeStore.js';
import { TAVERN_CULTURE_PER_DAY, TAVERN_GOLD_PER_CULTURE } from '../rules/tavernTrade.js';
import { EMPTY_POOL } from '../rules/terrain.js';
import type { ResourceState } from '../rules/terrain.js';
import { cellAt } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-14T09:00:00Z');
const DAY = 86_400_000;
const H = cellAt({ lat: 61.4729, lng: 23.7258 });
const tavern: Cell = { h3: H, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [], buildings: [{ id: 'tavern', builtAt: T0 }] };
const bare: Cell = { ...tavern, buildings: [] };

async function realm(cell: Cell, gold: number) {
  const store = new MemoryStore();
  await store.set(K.cell(cell.h3), cell);
  await store.set('resources', { pool: { ...EMPTY_POOL, gold }, since: T0, sinceDay: T0 });
  return { store, api: tavernTradeApi(() => store, async () => [cell]) };
}
const pool = async (store: MemoryStore) => ((await store.get<ResourceState>('resources')) as ResourceState).pool;

describe('the Tavern trade in the store', () => {
  it('buys culture standing on your Tavern, and writes it to the History', async () => {
    const { store, api } = await realm(tavern, 100);
    expect(await api.trade(H, H, 4, T0)).toEqual({ ok: true, culture: 4, gold: 4 * TAVERN_GOLD_PER_CULTURE });
    expect(await pool(store)).toMatchObject({ gold: 100 - 4 * TAVERN_GOLD_PER_CULTURE, culture: 4 });
    expect((await api.view(T0)).left).toBe(TAVERN_CULTURE_PER_DAY - 4);
    expect((await store.get<{ kind: string }[]>(K.log))?.at(-1)).toMatchObject({ kind: 'trade', count: 4 });
  });

  it('refuses away from the Tavern, and on a hex with no Tavern', async () => {
    const away = await realm(tavern, 100);
    expect(await away.api.trade(H, null, 1, T0)).toEqual({ ok: false, refused: 'not-here' });
    const none = await realm(bare, 100);
    expect(await none.api.trade(H, H, 1, T0)).toEqual({ ok: false, refused: 'not-here' });
  });

  it('the day’s cap holds until the next UTC day', async () => {
    const { api } = await realm(tavern, 1_000);
    expect((await api.trade(H, H, TAVERN_CULTURE_PER_DAY, T0)).ok).toBe(true);
    expect(await api.trade(H, H, 1, T0 + 60_000)).toEqual({ ok: false, refused: 'cap' });
    expect((await api.trade(H, H, 1, T0 + DAY)).ok).toBe(true);
  });
});
