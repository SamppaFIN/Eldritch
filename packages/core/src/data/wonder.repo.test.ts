/**
 * BRDC-WONDER-001 — finding one, through the store.
 *
 * The province maths is pure and covered in `rules/wonderPlace.test.ts`. What is tested
 * here is the registration: that the first finder gets it, that nobody else does, and
 * that an ordinary reveal on ordinary ground is untouched by any of it.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { cellToParent } from 'h3-js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { readWonderFinds, findWonderAt } from './wonderStore.js';
import { nationProvinces } from './wonderNation.js';
import { WONDERS } from '../rules/wonder.js';
import { WONDER_PROVINCE_RES, wonderInProvince, wondersNear } from '../rules/wonderPlace.js';
import { cellAt } from '../geo/cells.js';
import { loadDrawings, newDrawing, paint } from './mapData.js';
import type { Cell, H3Index, TerrainKind } from '../types/domain.js';
import type { WonderId } from '../rules/wonder.js';

const HERE = cellAt({ lat: 61.47290805294704, lng: 23.725882485862012 });
const T0 = Date.parse('2026-09-12T10:00:00Z');

const cell = (h3: H3Index): Cell => ({
  h3,
  ownerId: 'me',
  strength: 100,
  lastVisitedAt: T0,
  visitDays: [],
});

/**
 * The test origin, painted with ground the given wonder accepts.
 *
 * `HERE` is inside its own province by definition, so the province half needs no setting
 * up; the painted terrain is the only thing that has to be arranged.
 */
function seatOf(id: WonderId): Cell {
  loadDrawings(paint(newDrawing("seat"), HERE, { t: WONDERS[id].terrain[0] as TerrainKind }));
  return cell(HERE);
}

let store: MemoryStore;

beforeEach(() => {
  store = new MemoryStore();
  loadDrawings();
});

describe('finding a wonder', () => {
  /** Whatever wonder is actually seated in the province the test origin sits in. */
  const seated = (): [WonderId] => {
    const province = cellToParent(HERE, WONDER_PROVINCE_RES);
    const id = wonderInProvince(province, HERE, nationProvinces());
    // The rarity-scoped design exists so this is never null: wherever you stand, some
    // wonder is seated in your province. If this ever fails, the tiers have drifted.
    expect(id).not.toBeNull();
    return [id as WonderId];
  };

  it('registers the hex when the ground fits', async () => {
    const [id] = seated();
    expect(await findWonderAt(store, seatOf(id), T0)).toBe(id);
    expect((await readWonderFinds(store))[id]?.h3).toBe(HERE);
  });

  it('refuses ground the wonder cannot stand on', async () => {
    const [id] = seated();
    const kinds = ['plain', 'forest', 'hill', 'mountain', 'lake', 'coast', 'market'] as const;
    const wrong = kinds.find((t) => !WONDERS[id].terrain.includes(t)) as TerrainKind;
    loadDrawings(paint(newDrawing('wrong'), HERE, { t: wrong }));
    expect(await findWonderAt(store, cell(HERE), T0)).toBeNull();
  });

  // One at most. The second walker gets nothing, which is the point of a wonder.
  it('is found once and never again', async () => {
    const [id] = seated();
    expect(await findWonderAt(store, seatOf(id), T0)).toBe(id);
    expect(await findWonderAt(store, seatOf(id), T0 + 60_000)).toBeNull();
  });

  it('writes one log line naming the wonder, not its hex', async () => {
    const [id] = seated();
    await findWonderAt(store, seatOf(id), T0);
    const log = (await store.get<{ kind: string; ref?: string }[]>(K.log)) ?? [];
    expect(log.filter((e) => e.kind === 'wonder')).toEqual([
      expect.objectContaining({ kind: 'wonder', ref: id }),
    ]);
  });

  it('finds nothing in a province nobody was given', async () => {
    const abroad = cellAt({ lat: 48.8566, lng: 2.3522 });
    loadDrawings(paint(newDrawing('paris'), abroad, { t: 'market' }));
    expect(await findWonderAt(store, cell(abroad), T0)).toBeNull();
  });
});

describe('the national set', () => {
  it('is large enough to seat five legendary wonders apart', () => {
    expect(nationProvinces().length).toBeGreaterThan(1_000);
  });

  it('is the same list every time it is asked', () => {
    expect(nationProvinces()).toBe(nationProvinces());
  });

  it('seats every legendary wonder somewhere', () => {
    const near = wondersNear(HERE, nationProvinces());
    for (const id of Object.keys(WONDERS) as WonderId[]) {
      if (WONDERS[id].rarity === 'legendary') expect(near.has(id)).toBe(true);
    }
  });
});
