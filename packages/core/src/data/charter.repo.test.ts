/**
 * BRDC-ONBOARD-001 — the Charter in the store: the current step, claimed once for its
 * reward, kept across a season, and a veteran's realm starting where it already is.
 */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { charterApi } from './charterStore.js';
import { resetForSeason } from './seasonReset.js';
import { EMPTY_POOL, TERRAIN_TABLE, terrainForCell } from '../rules/terrain.js';
import { HEARTH_RING } from '../rules/constants.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-13T09:00:00Z');
const HOME = { lat: 61.4729, lng: 23.7258 };
const cell = (h3: string): Cell => ({ h3, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [] });
const ring = cellsWithin(cellAt(HOME), 1).map(cell);
const more = cellsWithin(cellAt(HOME), 2).filter((h) => !ring.some((c) => c.h3 === h)).map(cell);

async function realm(cells: readonly Cell[]): Promise<MemoryStore> {
  const store = new MemoryStore();
  for (const c of cells) await store.set(K.cell(c.h3), c);
  await store.set('resources', { pool: { ...EMPTY_POOL }, since: T0, sinceDay: T0 });
  return store;
}
const pouch = async (store: MemoryStore) => (await store.get<{ pool: typeof EMPTY_POOL }>('resources'))?.pool;

describe('the Charter in the store', () => {
  it('a fresh Hearth starts on the first step; walking finishes it; claiming pays it once', async () => {
    expect(ring).toHaveLength(HEARTH_RING);
    let cells: readonly Cell[] = ring;
    const store = await realm(cells);
    const api = charterApi(() => store, async () => cells);

    expect(await api.view(T0)).toMatchObject({ step: { id: 'first-step' }, ready: false });
    expect(await api.claim('first-step', T0)).toEqual({ ok: false, refused: 'not-done' });

    cells = [...ring, more[0] as Cell];
    expect(await api.view(T0)).toMatchObject({ step: { id: 'first-step' }, ready: true });
    expect(await api.claim('realm', T0)).toEqual({ ok: false, refused: 'not-current' });
    expect(await api.claim('first-step', T0)).toEqual({ ok: true, reward: { wisdom: 10 } });
    expect((await pouch(store))?.wisdom).toBe(10);
    expect(await api.claim('first-step', T0)).toEqual({ ok: false, refused: 'not-current' });
    expect((await api.view(T0))?.step.id).toBe('realm');
  });

  it('a veteran realm ticks off what it already did, unpaid', async () => {
    const cells = [...ring, ...more];
    const store = await realm(cells);
    const api = charterApi(() => store, async () => cells);
    // Past the Hearth and past twelve, nothing revealed: the reveal is the step it starts on.
    expect((await api.view(T0))?.step.id).toBe('reveal');
    expect((await pouch(store))?.wisdom).toBe(0);
  });

  it('Show me picks an unrevealed hex of your own for the reveal step', async () => {
    const cells = [...ring, ...more];
    const store = await realm(cells);
    await store.set(K.revealed, { [ring[0]!.h3]: T0 });
    await store.set(K.charter, { claimed: ['first-step', 'realm'] });
    const v = await charterApi(() => store, async () => cells).view(T0);
    expect(v?.step.id).toBe('reveal');
    expect(v?.ready).toBe(true);
    expect(v?.hex).not.toBe(ring[0]!.h3);
  });

  it('the missing-resource step names its resource and shows a bare hex of the ground that yields it (BRDC-ONBOARD-003)', async () => {
    const cells = [...ring, ...more];
    const store = await realm(cells);
    await store.set(K.charter, { claimed: ['first-step', 'realm', 'reveal', 'lookouts', 'watchtower', 'hands'] });
    const v = await charterApi(() => store, async () => cells).view(T0);
    expect(v?.step.id).toBe('supply');
    const k = v?.title.match(/^Raise (\w+) to/)?.[1];
    expect(['food', 'stone']).toContain(k);
    if (v?.hex) expect(TERRAIN_TABLE[terrainForCell(cells.find((c) => c.h3 === v.hex) as Cell).kind].resource).toBe(k);
  });

  it('outlives the season: the Charter is taught once per realm', async () => {
    const store = await realm(ring);
    await store.set(K.charter, { claimed: ['first-step'] });
    await resetForSeason(store);
    expect(await store.get(K.charter)).toEqual({ claimed: ['first-step'] });
  });
});
