/**
 * BRDC-BUILD-001 — the building table is well-formed, and `canBuild` says *why not*.
 */
import { describe, expect, it } from 'vitest';
import {
  DEMOLISH_REFUND,
  STOREHOUSE_CAP_BONUS,
  CELL_BUILDING_CAP,
} from './constants.js';
import { BASE_STORAGE_CAP, EMPTY_POOL, RESOURCE_KINDS, TERRAIN_TABLE } from './terrain.js';
import type { ResourcePool } from './terrain.js';
import { TECHS } from './tech.js';
import type { TechId } from './tech.js';
import {
  BUILDINGS,
  buildingBonus,
  buildingsOf,
  canBuild,
  keepOne,
  refund,
  storageCap,
} from './build.js';
import type { BuildContext, BuildingId } from './build.js';
import type { Cell } from '../types/domain.js';

const ALL = Object.keys(BUILDINGS) as BuildingId[];
const KINDS = new Set(Object.keys(TERRAIN_TABLE));
const T0 = Date.parse('2026-08-31T12:00:00Z');

const pool = (over: Partial<ResourcePool> = {}): ResourcePool => ({ ...EMPTY_POOL, ...over });

function cell(over: Partial<Cell> = {}): Cell {
  return {
    h3: '8b112492eb03fff',
    ownerId: 'me',
    strength: 300,
    lastVisitedAt: T0,
    visitDays: [],
    ...over,
  };
}

/** Enough of everything, every tech, plenty of room. */
const loaded: BuildContext = {
  playerId: 'me',
  researched: Object.keys(TECHS) as TechId[],
  pool: pool({ wood: 999, stone: 999, iron: 999, gold: 999, culture: 999 }),
  buildings: [],
};

describe('BUILDINGS is well-formed', () => {
  it('every tech gate is a real tech or null', () => {
    for (const id of ALL) {
      const tech = BUILDINGS[id].tech;
      if (tech !== null) expect(TECHS[tech], `${id} → ${tech}`).toBeDefined();
    }
  });

  it('every prerequisite is a real building, and every terrain a real kind', () => {
    for (const id of ALL) {
      for (const req of BUILDINGS[id].requires) expect(ALL).toContain(req);
      const terrain = BUILDINGS[id].terrain;
      if (terrain !== 'any') for (const k of terrain) expect(KINDS.has(k)).toBe(true);
    }
  });

  it('holds the base buildings, the improvements, and the area-effect four', () => {
    expect(ALL.sort()).toEqual(
      [
        'granary', 'market', 'monument', 'storehouse',
        'sawmill', 'lumbermill', 'mine', 'quarry', 'farm', 'fishery', 'vineyard',
        'library', 'temple-grove', 'lighthouse', 'fortress',
      ].sort(),
    );
  });

  it('every produces/producesPerDay entry is a real resource', () => {
    const resources = new Set(RESOURCE_KINDS as readonly string[]);
    for (const id of ALL) {
      for (const rates of [BUILDINGS[id].produces, BUILDINGS[id].producesPerDay]) {
        for (const k of Object.keys(rates ?? {})) expect(resources.has(k)).toBe(true);
      }
    }
  });
});

describe('upgrade chains (BRDC-BUILD-002)', () => {
  const forest = (over: Partial<Cell> = {}): Cell =>
    cell({ terrain: { kind: 'forest', source: 'tiles' }, ...over });

  it('a chained building is only ever the in-place upgrade of its predecessor', () => {
    expect(canBuild(loaded, 'lumbermill', forest())).toEqual({ ok: false, refused: 'locked' });
    expect(canBuild(loaded, 'lumbermill', forest({ buildings: [{ id: 'sawmill', builtAt: T0 }] }))).toEqual({
      ok: true,
    });
  });

  it('the predecessor itself still refuses a cell it already stands on', () => {
    expect(canBuild(loaded, 'sawmill', forest({ buildings: [{ id: 'sawmill', builtAt: T0 }] }))).toEqual({
      ok: false,
      refused: 'occupied',
    });
  });

  it('an upgrade takes the slot it replaces, so a full hex still allows it', () => {
    const standing = forest({ buildings: [{ id: 'sawmill', builtAt: T0 }] });
    expect(canBuild(loaded, 'lumbermill', standing)).toEqual({ ok: true });
  });
});

describe('canBuild refuses in order of how fundamental the objection is', () => {
  it('not-yours before anything else', () => {
    expect(canBuild(loaded, 'granary', cell({ ownerId: 'someone-else' }))).toEqual({
      ok: false,
      refused: 'not-yours',
    });
  });

  it('occupied — the same Work twice on one cell — before terrain', () => {
    const built = cell({ buildings: [{ id: 'monument', builtAt: T0 }], terrain: { kind: 'mountain', source: 'hash' } });
    expect(canBuild(loaded, 'monument', built)).toEqual({ ok: false, refused: 'occupied' });
  });

  /*
   * PIVOT-2026-09-09 kohta 6 reverses BRDC-BUILD-007: a hex held three Works, and holds
   * one. What goes where is the decision now, and the answer is final until you demolish.
   */
  it('refuses a second Work, however different, once one stands', () => {
    const built = cell({ buildings: [{ id: 'monument', builtAt: T0 }] });
    expect(canBuild(loaded, 'granary', built)).toEqual({ ok: false, refused: 'cell-full' });
  });

  it('cell-full is the cap, and the cap is one', () => {
    expect(CELL_BUILDING_CAP).toBe(1);
    const full = cell({ buildings: [{ id: 'monument', builtAt: T0 }] });
    expect(canBuild(loaded, 'granary', full)).toEqual({ ok: false, refused: 'cell-full' });
  });

  it('wrong-terrain before tech', () => {
    const mountain = cell({ terrain: { kind: 'mountain', source: 'tiles' } });
    // granary wants plain/lake/coast; loaded has early-farming, so only terrain can fail
    expect(canBuild(loaded, 'granary', mountain)).toEqual({ ok: false, refused: 'wrong-terrain' });
  });

  it('locked when the tech is not researched', () => {
    const ctx = { ...loaded, researched: [] as TechId[] };
    const plain = cell({ terrain: { kind: 'plain', source: 'tiles' } });
    expect(canBuild(ctx, 'granary', plain)).toEqual({ ok: false, refused: 'locked' });
  });

  it('needs-a-temple for a place-gated building with none beside it (BRDC-BUILD-003)', () => {
    const plain = cell({ terrain: { kind: 'plain', source: 'tiles' } });
    expect(canBuild(loaded, 'temple-grove', plain)).toEqual({ ok: false, refused: 'needs-a-temple' });
    expect(canBuild({ ...loaded, templeAdjacent: true }, 'temple-grove', plain)).toEqual({ ok: true });
  });

  /*
   * PIVOT-2026-09-09 kohta 6: a hex holds one Work, and there is no longer a player-wide
   * cap behind it. Land is the limit — the one a player can see on the map and walk to.
   */
  it('cell-full once a Work already stands here, however many you hold elsewhere', () => {
    const many = { ...loaded, buildings: Array(20).fill('monument') as BuildingId[] };
    expect(canBuild(many, 'monument', cell())).toEqual({ ok: true });
    // A *different* Work standing here, so the refusal is the cap and not 'occupied'.
    const taken = cell({ buildings: [{ id: 'storehouse', builtAt: T0 }] });
    expect(canBuild(many, 'monument', taken)).toEqual({ ok: false, refused: 'cell-full' });
  });

  it('cannot-afford last', () => {
    const ctx = { ...loaded, pool: pool({ stone: 1 }) };
    expect(canBuild(ctx, 'monument', cell())).toEqual({ ok: false, refused: 'cannot-afford' });
  });

  it('passes when nothing objects', () => {
    expect(canBuild(loaded, 'monument', cell())).toEqual({ ok: true });
  });
});

describe('caps and refunds', () => {
  it('a Storehouse raises the storage ceiling', () => {
    expect(storageCap([])).toBe(BASE_STORAGE_CAP);
    expect(storageCap(['storehouse', 'storehouse'])).toBe(BASE_STORAGE_CAP + 2 * STOREHOUSE_CAP_BONUS);
  });

  it('demolishing hands back half the cost, floored', () => {
    const back = refund('market');
    expect(back.wood).toBe(Math.floor(30 * DEMOLISH_REFUND));
    expect(back.gold).toBe(Math.floor(20 * DEMOLISH_REFUND));
  });
});

describe('buildingBonus and buildingsOf', () => {
  it('sums per-hour production from awake buildings only', () => {
    const market = cell({ buildings: [{ id: 'market', builtAt: T0 }] });
    const dormant = cell({ h3: 'x', buildings: [{ id: 'market', builtAt: T0 }], lastVisitedAt: T0 - 10 * 86_400_000 });
    expect(buildingBonus([market], T0)).toEqual({ gold: 2 });
    expect(buildingBonus([market, market], T0)).toEqual({ gold: 4 });
    expect(buildingBonus([dormant], T0)).toEqual({});
  });

  it('buildingsOf lists every Work on a set of cells (BRDC-BUILD-007)', () => {
    const a = cell({ buildings: [{ id: 'granary', builtAt: T0 }, { id: 'monument', builtAt: T0 }] });
    const b = cell({ h3: 'b' });
    expect(buildingsOf([a, b])).toEqual(['granary', 'monument']);
  });

  it('every Work on one cell pays, and dormancy is judged per cell (BRDC-BUILD-007)', () => {
    const cluster = cell({
      buildings: [
        { id: 'market', builtAt: T0 }, // gold 2
        { id: 'monument', builtAt: T0 }, // culture 1
      ],
    });
    expect(buildingBonus([cluster], T0)).toEqual({ gold: 2, culture: 1 });

    const dormant = { ...cluster, lastVisitedAt: T0 - 10 * 86_400_000 };
    expect(buildingBonus([dormant], T0)).toEqual({});
  });
});

describe('keepOne — which Work survives one-per-cell (PIVOT-2026-09-09 §6)', () => {
  const work = (id: BuildingId, builtAt: number) => ({ id, builtAt });

  it('leaves a lone Work exactly where it is', () => {
    const only = [work('sawmill', T0)];
    const { keep, raze } = keepOne(only);
    expect(keep).toBe(only[0]);
    expect(raze).toEqual([]);
  });

  it('keeps the more expensive one, whichever order they were built in', () => {
    // Lumbermill 80 wood + 30 iron against Sawmill 30 wood: the upgrade always costs more
    // than what it replaces, which is why cost is a fair reading of "strongest".
    const older = keepOne([work('lumbermill', T0), work('sawmill', T0 + 1)]);
    const newer = keepOne([work('sawmill', T0), work('lumbermill', T0 + 1)]);
    expect(older.keep?.id).toBe('lumbermill');
    expect(newer.keep?.id).toBe('lumbermill');
    expect(newer.raze.map((w) => w.id)).toEqual(['sawmill']);
  });

  it('breaks a tie towards the one that has stood longest', () => {
    // Two Monuments cannot both be here — `canBuild` refuses 'occupied' — but a tie of
    // equal cost is reachable across the table, and it must not resolve at random.
    const { keep } = keepOne([work('monument', T0 + 5_000), work('monument', T0)]);
    expect(keep?.builtAt).toBe(T0);
  });

  it('razes everything it did not keep, and nothing twice', () => {
    const works = [work('sawmill', T0), work('mine', T0 + 1), work('fortress', T0 + 2)];
    const { keep, raze } = keepOne(works);
    expect(keep?.id).toBe('fortress');
    expect(raze).toHaveLength(2);
    expect([keep, ...raze].sort()).toHaveLength(works.length);
  });

  it('has nothing to say about bare ground', () => {
    expect(keepOne([])).toEqual({ keep: null, raze: [] });
  });
});
