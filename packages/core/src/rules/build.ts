/**
 * What resources are for, beyond warding one cell.
 *
 * The plan's §8.2 wants a `BuildingSystem` class; golden rule 3 wants pure functions. The
 * semantics come across, the class does not: `BUILDINGS` is a constant table and the
 * rules are functions over it — testable without instantiation, portable to SQL later.
 *
 * `ward.ts` is the shape. Refusals are values, not exceptions: "not yours", "wrong
 * terrain", "locked", "at capacity", "cannot afford" are all things the panel has to say
 * out loud. Warding is a special case of building, which is why `WARD_COST` stays.
 *
 * `BUILDINGS` already carries `terrain`, `tech` and `requires` even though the four base
 * buildings barely use them — `BRDC-BUILD-002` adds seven rows of terrain-bound
 * improvements and no new code, and that is its acceptance test.
 */
import {
  BASE_BUILDING_CAP,
  DECAY_GRACE_HOURS,
  DEMOLISH_REFUND,
  GRANARY_CAPACITY,
  STOREHOUSE_CAP_BONUS,
} from './constants.js';
import { BASE_STORAGE_CAP, canAfford, terrainForCell } from './terrain.js';
import type { ResourceKind, ResourcePool, TerrainKind } from './terrain.js';
import { hasTech } from './tech.js';
import type { TechId } from './tech.js';
import type { BuildingId, Cell, PlayerId } from '../types/domain.js';

export type { BuildingId } from '../types/domain.js';

export interface Building {
  cost: Readonly<Partial<ResourcePool>>;
  /** Where it may stand. `'any'` for the generic four; BUILD-002's improvements bind it. */
  terrain: readonly TerrainKind[] | 'any';
  tech: TechId | null;
  /** Predecessor buildings — empty for the four; BUILD-002's chains fill it. */
  requires: readonly BuildingId[];
  /** Added to the trickle, per hour, while the cell it stands on is awake. */
  produces?: Readonly<Partial<ResourcePool>>;
  /** Storehouse only: added to the pouch's per-resource ceiling. */
  storageCapBonus?: number;
  /** Granary only: added to how many buildings the player may hold. */
  buildingCapacity?: number;
}

export const BUILDINGS: Readonly<Record<BuildingId, Building>> = {
  granary: {
    cost: { wood: 40, stone: 10 },
    terrain: ['plain', 'lake', 'coast'],
    tech: 'early-farming',
    requires: [],
    produces: { food: 1 },
    buildingCapacity: GRANARY_CAPACITY,
  },
  monument: {
    cost: { stone: 60, culture: 10 },
    terrain: 'any',
    tech: null,
    requires: [],
    produces: { culture: 1 },
  },
  storehouse: {
    cost: { wood: 50, stone: 30 },
    terrain: 'any',
    tech: 'masonry',
    requires: [],
    storageCapBonus: STOREHOUSE_CAP_BONUS,
  },
  market: {
    cost: { wood: 30, gold: 20 },
    terrain: ['market', 'plain'],
    tech: null,
    requires: [],
    produces: { gold: 2 },
  },
};

const DORMANT_AFTER_MS = DECAY_GRACE_HOURS * 3_600_000;

export function buildCost(id: BuildingId): Readonly<Partial<ResourcePool>> {
  return BUILDINGS[id].cost;
}

/** What demolishing hands back — half the cost, floored per resource. */
export function refund(id: BuildingId): Partial<ResourcePool> {
  const out: Partial<ResourcePool> = {};
  for (const [k, v] of Object.entries(BUILDINGS[id].cost) as [ResourceKind, number][]) {
    out[k] = Math.floor(v * DEMOLISH_REFUND);
  }
  return out;
}

/** The pouch's per-resource ceiling, raised by each Storehouse held. */
export function storageCap(buildings: readonly BuildingId[]): number {
  const stores = buildings.filter((b) => b === 'storehouse').length;
  return BASE_STORAGE_CAP + stores * STOREHOUSE_CAP_BONUS;
}

/** How many buildings the player may hold, raised by each Granary. */
export function buildingCapacity(buildings: readonly BuildingId[]): number {
  const granaries = buildings.filter((b) => b === 'granary').length;
  return BASE_BUILDING_CAP + granaries * GRANARY_CAPACITY;
}

/** The buildings on a set of cells, in cell order. */
export function buildingsOf(cells: readonly Cell[]): BuildingId[] {
  return cells.flatMap((c) => (c.building ? [c.building.id] : []));
}

/**
 * Per-hour production from every awake building on `cells`, summed.
 *
 * Dormancy-filtered here so `settleResources` — which knows nothing of buildings — can
 * take it as a flat `bonusPerHour` and stay that way. A building on a cell nobody has
 * walked in 48 h earns nothing, the same rule as terrain.
 */
export function buildingBonus(cells: readonly Cell[], now: number): Partial<ResourcePool> {
  const bonus: Partial<ResourcePool> = {};
  for (const cell of cells) {
    if (!cell.building) continue;
    if (now - cell.lastVisitedAt > DORMANT_AFTER_MS) continue;
    const produces = BUILDINGS[cell.building.id].produces;
    if (!produces) continue;
    for (const [k, v] of Object.entries(produces) as [ResourceKind, number][]) {
      bonus[k] = (bonus[k] ?? 0) + v;
    }
  }
  return bonus;
}

export type BuildRefusal =
  | 'not-yours'
  | 'occupied'
  | 'wrong-terrain'
  | 'locked'
  | 'at-capacity'
  | 'cannot-afford';

export interface BuildContext {
  playerId: PlayerId;
  researched: readonly TechId[];
  pool: ResourcePool;
  /** The player's current buildings — its length is the count, and Granaries raise the cap. */
  buildings: readonly BuildingId[];
}

export type BuildCheck = { ok: true } | { ok: false; refused: BuildRefusal };

/**
 * Why this building cannot go on this cell — or that it can.
 *
 * Checked in order of how fundamental the objection is, so the player is told the most
 * useful thing first: whose ground it is, then whether it is free, then terrain, then
 * technology, then room, and only last whether they can pay.
 */
export function canBuild(ctx: BuildContext, id: BuildingId, cell: Cell): BuildCheck {
  const b = BUILDINGS[id];

  if (cell.ownerId !== ctx.playerId) return { ok: false, refused: 'not-yours' };
  if (cell.building) return { ok: false, refused: 'occupied' };
  if (b.terrain !== 'any' && !b.terrain.includes(terrainForCell(cell).kind)) {
    return { ok: false, refused: 'wrong-terrain' };
  }
  if (b.tech && !hasTech(ctx.researched, b.tech)) return { ok: false, refused: 'locked' };
  if (!b.requires.every((r) => ctx.buildings.includes(r))) {
    return { ok: false, refused: 'locked' };
  }
  if (ctx.buildings.length >= buildingCapacity(ctx.buildings)) {
    return { ok: false, refused: 'at-capacity' };
  }
  if (!canAfford(ctx.pool, b.cost)) return { ok: false, refused: 'cannot-afford' };

  return { ok: true };
}
