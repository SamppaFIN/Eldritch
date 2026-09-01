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
import type { AuraKind, BuildingId, Cell, PlayerId } from '../types/domain.js';

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
  /** Added per calendar day, not per hour — the fishery's token (BRDC-BUILD-002). */
  producesPerDay?: Readonly<Partial<ResourcePool>>;
  /** Storehouse only: added to the pouch's per-resource ceiling. */
  storageCapBonus?: number;
  /** Granary only: added to how many buildings the player may hold. */
  buildingCapacity?: number;
  /** An effect projected to a radius of cells (BRDC-BUILD-003). See `rules/aura.ts`. */
  aura?: { kind: AuraKind; radius: number; amount: number };
  /** Must be built next to a revealed place of this kind (BRDC-BUILD-003). */
  needsPlace?: 'temple';
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

  /* --- BRDC-BUILD-002: terrain-bound improvements and chains ------------- */

  sawmill: {
    cost: { wood: 30 },
    terrain: ['forest'],
    tech: 'forestry',
    requires: [],
    produces: { wood: 5 },
  },
  // Upgrades the Sawmill in place. Costs iron — which only a mountain Mine gives, so the
  // upgrade is a walk to a ridge, not a wait.
  lumbermill: {
    cost: { wood: 80, iron: 30 },
    terrain: ['forest'],
    tech: 'forestry',
    requires: ['sawmill'],
    produces: { wood: 9 },
  },
  mine: {
    cost: { wood: 40, stone: 40 },
    terrain: ['mountain'],
    tech: 'mining',
    requires: [],
    produces: { iron: 5 },
  },
  // Deeper into the same rock; costs wood, which means a forest Sawmill somewhere.
  quarry: {
    cost: { wood: 60, stone: 60 },
    terrain: ['mountain'],
    tech: 'mining',
    requires: ['mine'],
    produces: { stone: 9 },
  },
  farm: {
    cost: { wood: 40, stone: 20 },
    terrain: ['plain', 'lake', 'coast'],
    tech: 'irrigation',
    requires: [],
    produces: { food: 5 },
  },
  fishery: {
    cost: { wood: 50, gold: 20 },
    terrain: ['lake', 'coast'],
    tech: 'seafaring',
    requires: [],
    produces: { food: 3 },
    producesPerDay: { tokens: 1 },
  },
  vineyard: {
    cost: { stone: 40, gold: 40, culture: 10 },
    terrain: ['hill'],
    tech: 'guild-craft',
    requires: [],
    produces: { culture: 4 },
  },

  /* --- BRDC-BUILD-003: area effects, and the first use of dwell as a build gate --- */

  // Must sit next to a temple — the one thing resources cannot buy, only time in a place.
  library: {
    cost: { stone: 80, culture: 40 },
    terrain: 'any',
    tech: 'astronomy',
    requires: [],
    needsPlace: 'temple',
    aura: { kind: 'wisdom', radius: 1, amount: 1 },
  },
  'temple-grove': {
    cost: { stone: 60, culture: 60 },
    terrain: ['plain', 'forest'],
    tech: 'guild-craft',
    requires: [],
    needsPlace: 'temple',
    aura: { kind: 'mana', radius: 1, amount: 1 },
  },
  // Coastal; its light reaches the water around it, and boats bring back more.
  lighthouse: {
    cost: { stone: 70, wood: 40 },
    terrain: ['coast', 'lake'],
    tech: 'seafaring',
    requires: [],
    aura: { kind: 'food', radius: 2, amount: 1 },
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
  return sumOver(cells, now, (b) => b.produces);
}

/**
 * Per-calendar-day production from awake buildings (BRDC-BUILD-002) — the fishery's token.
 *
 * The same shape as `buildingBonus`, read by `settleResources` as a `bonusPerDay` it
 * credits one whole day at a time. Kept off the hourly path because a token is 1/24 of an
 * hour's worth and would floor to nothing every settle.
 */
export function buildingDayBonus(cells: readonly Cell[], now: number): Partial<ResourcePool> {
  return sumOver(cells, now, (b) => b.producesPerDay);
}

function sumOver(
  cells: readonly Cell[],
  now: number,
  pick: (b: Building) => Readonly<Partial<ResourcePool>> | undefined,
): Partial<ResourcePool> {
  const bonus: Partial<ResourcePool> = {};
  for (const cell of cells) {
    if (!cell.building) continue;
    if (now - cell.lastVisitedAt > DORMANT_AFTER_MS) continue;
    const rates = pick(BUILDINGS[cell.building.id]);
    if (!rates) continue;
    for (const [k, v] of Object.entries(rates) as [ResourceKind, number][]) {
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
  | 'needs-a-temple'
  | 'at-capacity'
  | 'cannot-afford';

export interface BuildContext {
  playerId: PlayerId;
  researched: readonly TechId[];
  pool: ResourcePool;
  /** The player's current buildings — its length is the count, and Granaries raise the cap. */
  buildings: readonly BuildingId[];
  /** Is the target cell on or next to a revealed temple? Gates Library and Temple Grove. */
  templeAdjacent?: boolean;
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

  // A chained building (BUILD-002) is only ever the in-place upgrade of its predecessor:
  // build `lumbermill` on a cell that holds a `sawmill`. Everything else refuses a taken
  // cell outright.
  const upgrading = cell.building !== undefined && b.requires.includes(cell.building.id);
  if (b.requires.length > 0) {
    if (!upgrading) return { ok: false, refused: 'locked' };
  } else if (cell.building) {
    return { ok: false, refused: 'occupied' };
  }

  if (b.terrain !== 'any' && !b.terrain.includes(terrainForCell(cell).kind)) {
    return { ok: false, refused: 'wrong-terrain' };
  }
  if (b.tech && !hasTech(ctx.researched, b.tech)) return { ok: false, refused: 'locked' };
  // The dwell gate (BRDC-BUILD-003): a Library or Temple Grove needs a temple beside it.
  if (b.needsPlace === 'temple' && !ctx.templeAdjacent) {
    return { ok: false, refused: 'needs-a-temple' };
  }
  // An upgrade swaps a slot it already holds, so it never runs into the cap.
  if (!upgrading && ctx.buildings.length >= buildingCapacity(ctx.buildings)) {
    return { ok: false, refused: 'at-capacity' };
  }
  if (!canAfford(ctx.pool, b.cost)) return { ok: false, refused: 'cannot-afford' };

  return { ok: true };
}
