/**
 * BRDC-YIELD-001 — the hourly yield as it stood before the per-hex model, pinned.
 *
 * Two realms — Season 1 (Works, research, bounties, a Works tree, a domain spell) and
 * Season 2 (a Keep, staffed Works, rite boons, calm, gates, sanity below zero) — and the
 * per-hour forecast each produced on 2026-10-05, before `hexYield.ts` took over the sum.
 * The refactor must not move a single number: these values are the contract.
 *
 * Moved once on purpose since (BRDC-ADJ-001, 2026-10-06): food +1 in both — the Farm on
 * ring[1] stands beside the Farm on ring[6] (`adjacency.test.ts` pins exactly that).
 */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { forecastRates } from './pouch.js';
import { EMPTY_POOL } from '../rules/terrain.js';
import { TECHS } from '../rules/tech.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import { staffKey } from '../rules/staffing.js';
import type { BuildingId, Cell } from '../types/domain.js';

const NOW = Date.parse('2026-10-05T12:00:00Z');
const H = 3_600_000;
const ring = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 2);
const cell = (i: number, works: BuildingId[] = [], visited = NOW - H): Cell => ({
  h3: ring[i] as string,
  ownerId: 'me',
  strength: 300,
  lastVisitedAt: visited,
  visitDays: [],
  buildings: works.map((id) => ({ id, builtAt: NOW - 10 * H })),
});

/** 19 hexes: Works on a few, one long unwalked (dormant). */
const realm = (): Cell[] => [
  cell(0, ['monument']),
  cell(1, ['farm']),
  cell(2, ['sawmill']),
  cell(3, ['library']),
  cell(4, ['market']),
  cell(5, ['forge']),
  cell(6, ['farm'], NOW - 30 * 24 * H),
  ...ring.slice(7).map((_, i) => cell(7 + i)),
];

async function seedShared(store: MemoryStore, cells: Cell[]) {
  await store.set(K.home, cells[0]?.h3);
  await store.set(K.revealed, Object.fromEntries(cells.map((c) => [c.h3, NOW - 5 * H])));
  await store.set(K.worksTree, {
    [cells[1]?.h3 as string]: ['farm.tilled-rows'],
    [cells[2]?.h3 as string]: ['sawmill.iron-teeth', 'sawmill.charcoal-pits'],
  });
}

describe('the hourly yield before the per-hex model (golden, 2026-10-05)', () => {
  it('Season 1: Works, research, bounties, a Works tree and a running domain spell', async () => {
    const store = new MemoryStore();
    const cells = realm();
    await seedShared(store, cells);
    await store.set(K.researched, Object.keys(TECHS).slice(0, 6));
    await store.set(K.spells, [{ id: 'insight', castAt: NOW - H }]);
    await store.set('resources', { pool: { ...EMPTY_POOL }, since: NOW, sinceDay: NOW });
    const f = await forecastRates(store, cells, NOW);
    expect(f.perHour).toMatchInlineSnapshot(`
      {
        "culture": 2,
        "food": 12,
        "gold": 2,
        "iron": 2,
        "mana": 6,
        "stone": 2,
        "wisdom": 19,
        "wood": 57,
      }
    `);
  });

  it('Season 2: a Keep, staffed Works, boons, calm, gates and sanity below zero', async () => {
    const store = new MemoryStore();
    const cells = realm();
    await seedShared(store, cells);
    const staff = {
      [staffKey(cells[1]?.h3 as string, 'farm')]: 2,
      [staffKey(cells[2]?.h3 as string, 'sawmill')]: 2,
      [staffKey(cells[4]?.h3 as string, 'market')]: 1,
      [staffKey(cells[5]?.h3 as string, 'forge')]: 2,
    };
    await store.set('resources', {
      pool: { ...EMPTY_POOL },
      since: NOW,
      sinceDay: NOW,
      keep: {
        level: 2,
        granary: { citizens: 30, box: 0 },
        staff,
        gatesNear: 2,
        calm: { value: 3, until: NOW + H },
        boons: [
          { rite: 'call-the-shoal', scope: 'target', value: 4, until: NOW + H, target: cells[1]?.h3 },
          { rite: 'high-water', scope: 'workers', value: 2, until: NOW + H },
          { rite: 'second-lake', scope: 'yield', value: 25, until: NOW + H },
        ],
      },
    });
    const f = await forecastRates(store, cells, NOW);
    expect(f.perHour).toMatchInlineSnapshot(`
      {
        "culture": 1,
        "food": 19,
        "gold": 3,
        "iron": 4,
        "mana": 6,
        "stone": 2,
        "wisdom": 13,
        "wood": 32,
      }
    `);
  });
});
