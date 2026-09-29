import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { masterworkApi } from './masterworkStore.js';
import { keepApi } from './citizenStore.js';
import { settlePouch, writePouch } from './pouch.js';
import { K } from './keys.js';
import { EMPTY_POOL } from '../rules/terrain.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import { WORKS_DEFS } from '../rules/works/defs/index.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-01T12:00:00Z');
const ring = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 2).slice(0, 5);
const tower = (h3: string): Cell => ({ h3, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [], buildings: [{ id: 'watchtower', builtAt: T0 }] });

describe('masterworkApi (BRDC-PROG-006)', () => {
  it('is absent on a Season 1 save', async () => {
    const store = new MemoryStore();
    expect(await masterworkApi(() => store, async () => []).view(T0)).toBeNull();
  });

  it('five towers, one at level 3, and Signal Fires raise a Fortress on that tower', async () => {
    const store = new MemoryStore();
    for (const h of ring) await store.set(K.cell(h), tower(h));
    const cells = async () => Promise.all(ring.map(async (h) => (await store.get<Cell>(K.cell(h))) as Cell));
    const mw = masterworkApi(() => store, cells);
    await keepApi(() => store, cells).found(T0);
    await writePouch(store, { ...EMPTY_POOL, stone: 400, iron: 400, wood: 400 }, T0);

    expect((await mw.view(T0))?.find((r) => r.id === 'fortress')?.ready).toBe(false);
    expect(await mw.raise('fortress', T0)).toEqual({ ok: false, refused: 'not-ready' });

    const tiers = WORKS_DEFS.watchtower.tree.tiers.slice(0, 3).map((t) => t.nodes[0]?.id as string);
    await store.set(K.worksTree, { [ring[0] as string]: tiers });
    await store.set(K.lore, ['signal-fires']);
    const row = (await mw.view(T0))?.find((r) => r.id === 'fortress');
    expect(row?.needs.every((n) => n.met)).toBe(true);
    expect(await mw.raise('fortress', T0)).toEqual({ ok: true, h3: ring[0] });
    expect((await store.get<Cell>(K.cell(ring[0] as string)))?.buildings?.map((b) => b.id)).toEqual(['fortress']);
    expect((await settlePouch(store, [], T0)).pool).toMatchObject({ stone: 280, iron: 340, wood: 360 });
    expect((await mw.view(T0))?.find((r) => r.id === 'fortress')).toMatchObject({ standing: true, dormant: false });
  });
});
