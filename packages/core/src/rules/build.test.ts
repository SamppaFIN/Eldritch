/**
 * BRDC-BUILD-001 — the building table is well-formed, and `canBuild` says *why not*.
 */
import { describe, expect, it } from 'vitest';
import {
  BASE_BUILDING_CAP,
  DEMOLISH_REFUND,
  GRANARY_CAPACITY,
  STOREHOUSE_CAP_BONUS,
} from './constants.js';
import { BASE_STORAGE_CAP, EMPTY_POOL, RESOURCE_KINDS, TERRAIN_TABLE } from './terrain.js';
import type { ResourcePool } from './terrain.js';
import { TECHS } from './tech.js';
import type { TechId } from './tech.js';
import {
  BUILDINGS,
  buildingBonus,
  buildingCapacity,
  buildingsOf,
  canBuild,
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

  it('holds the four base buildings and the seven improvements', () => {
    expect(ALL.sort()).toEqual(
      [
        'granary', 'market', 'monument', 'storehouse',
        'sawmill', 'lumbermill', 'mine', 'quarry', 'farm', 'fishery', 'vineyard',
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
    expect(canBuild(loaded, 'lumbermill', forest({ building: { id: 'sawmill', builtAt: T0 } }))).toEqual({
      ok: true,
    });
  });

  it('the predecessor itself still refuses a cell it already stands on', () => {
    expect(canBuild(loaded, 'sawmill', forest({ building: { id: 'sawmill', builtAt: T0 } }))).toEqual({
      ok: false,
      refused: 'occupied',
    });
  });

  it('an upgrade does not run into the building cap', () => {
    const full = { ...loaded, buildings: Array(BASE_BUILDING_CAP).fill('sawmill') as BuildingId[] };
    expect(canBuild(full, 'lumbermill', forest({ building: { id: 'sawmill', builtAt: T0 } }))).toEqual({
      ok: true,
    });
  });
});

describe('canBuild refuses in order of how fundamental the objection is', () => {
  it('not-yours before anything else', () => {
    expect(canBuild(loaded, 'granary', cell({ ownerId: 'someone-else' }))).toEqual({
      ok: false,
      refused: 'not-yours',
    });
  });

  it('occupied before terrain', () => {
    const built = cell({ building: { id: 'monument', builtAt: T0 }, terrain: { kind: 'mountain', source: 'hash' } });
    expect(canBuild(loaded, 'granary', built)).toEqual({ ok: false, refused: 'occupied' });
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

  it('at-capacity once the building count reaches the cap', () => {
    const ctx = { ...loaded, buildings: Array(BASE_BUILDING_CAP).fill('monument') as BuildingId[] };
    expect(canBuild(ctx, 'monument', cell())).toEqual({ ok: false, refused: 'at-capacity' });
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

  it('a Granary raises how many buildings may be held', () => {
    expect(buildingCapacity([])).toBe(BASE_BUILDING_CAP);
    expect(buildingCapacity(['granary'])).toBe(BASE_BUILDING_CAP + GRANARY_CAPACITY);
  });

  it('demolishing hands back half the cost, floored', () => {
    const back = refund('market');
    expect(back.wood).toBe(Math.floor(30 * DEMOLISH_REFUND));
    expect(back.gold).toBe(Math.floor(20 * DEMOLISH_REFUND));
  });
});

describe('buildingBonus and buildingsOf', () => {
  it('sums per-hour production from awake buildings only', () => {
    const market = cell({ building: { id: 'market', builtAt: T0 } });
    const dormant = cell({ h3: 'x', building: { id: 'market', builtAt: T0 }, lastVisitedAt: T0 - 10 * 86_400_000 });
    expect(buildingBonus([market], T0)).toEqual({ gold: 2 });
    expect(buildingBonus([market, market], T0)).toEqual({ gold: 4 });
    expect(buildingBonus([dormant], T0)).toEqual({});
  });

  it('buildingsOf lists the buildings on a set of cells', () => {
    const a = cell({ building: { id: 'granary', builtAt: T0 } });
    const b = cell({ h3: 'b' });
    expect(buildingsOf([a, b])).toEqual(['granary']);
  });
});
