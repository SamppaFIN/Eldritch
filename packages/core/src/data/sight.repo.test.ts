/**
 * Field report 2026-09-30: a Library would not go beside a temple, and a Watchtower
 * revealed nothing around it.
 */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { buildOn, templeAdjacentTo } from './buildStore.js';
import { researchWorkAt } from './worksStore.js';
import { readRevealed } from './revealStore.js';
import { writePouch } from './pouch.js';
import { EMPTY_POOL } from '../rules/terrain.js';
import { cellAt, cellsWithin, neighboursOf } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-01T12:00:00Z');
// Far from Härmälä, so no Worldseed or survey overrides the stored ground.
const TOWER = cellAt({ lat: 60.17, lng: 24.94 });
const BESIDE = neighboursOf(TOWER)[0] as string;
const hill: Cell = { h3: TOWER, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [], terrain: { kind: 'hill', source: 'tiles' } };

describe('temple beside a hex (BRDC-BUILD-003)', () => {
  it('counts a revealed temple place or your own Temple Grove, on the hex or beside it', () => {
    expect(templeAdjacentTo(TOWER, [{ h3: BESIDE }], [])).toBe(true);
    const grove: Cell = { ...hill, h3: BESIDE, buildings: [{ id: 'temple-grove', builtAt: T0 }] };
    expect(templeAdjacentTo(TOWER, [], [grove])).toBe(true);
    expect(templeAdjacentTo(TOWER, [], [{ ...hill, h3: BESIDE }])).toBe(false);
  });
});

describe('a Watchtower sees (BRDC-WORKS-003)', () => {
  it('reveals the six hexes around it when built, and further with the tree', async () => {
    const store = new MemoryStore();
    await store.set(K.cell(TOWER), hill);
    await writePouch(store, { ...EMPTY_POOL, wood: 999, stone: 999, iron: 999 }, T0);
    expect((await buildOn(store, TOWER, 'watchtower', 'me', [hill], [], T0)).ok).toBe(true);
    const ring1 = cellsWithin(TOWER, 1);
    expect(Object.keys(await readRevealed(store)).sort()).toEqual([...ring1].sort());

    const built = (await store.get<Cell>(K.cell(TOWER))) as Cell;
    expect((await researchWorkAt(store, TOWER, 'watchtower.lookout', [built], T0)).ok).toBe(true);
    expect((await researchWorkAt(store, TOWER, 'watchtower.second-platform', [built], T0)).ok).toBe(true);
    expect(Object.keys(await readRevealed(store))).toHaveLength(cellsWithin(TOWER, 2).length);
  });
});
