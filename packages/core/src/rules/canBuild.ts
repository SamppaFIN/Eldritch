/**
 * May this Work be raised here — split from `build.ts` at its 400-line limit when the
 * Dockworker's price joined it (BRDC-INVEST-001). Refusals are values, not exceptions:
 * every one of them is something the panel says out loud.
 */
import { CELL_BUILDING_CAP } from './constants.js';
import { canAfford, terrainForCell } from './terrain.js';
import type { ResourcePool } from './terrain.js';
import { priceFor } from './archetype.js';
import type { ArchetypeId } from './archetype.js';
import type { AllyId } from './ally.js';
import { hasTech } from './tech.js';
import type { TechId } from './tech.js';
import { BUILDINGS, buildCost, worksOn } from './build.js';
import type { BuildingId, Cell, PlayerId } from '../types/domain.js';

export type BuildRefusal =
  | 'not-yours'
  | 'occupied'
  | 'wrong-terrain'
  | 'locked'
  | 'needs-a-temple'
  | 'needs-iron-nearby'
  | 'one-per-province'
  | 'cell-full'
  | 'cannot-afford';

export interface BuildContext {
  playerId: PlayerId;
  researched: readonly TechId[];
  pool: ResourcePool;
  /** The player's current buildings. Read by callers that price a whole realm, not by `canBuild`. */
  buildings: readonly BuildingId[];
  /** Is the target cell on or next to a revealed temple? Gates Library and Temple Grove. */
  templeAdjacent?: boolean;
  /** Is a hill (or a Mine) within one ring? Gates the Forge (BRDC-BUILD-013). */
  ironAdjacent?: boolean;
  /** Does the player already hold a Tavern in this cell's province? (BRDC-TAVERN-001). */
  tavernInProvince?: boolean;
  /** Season 2: copies of the chosen Work already standing — each makes the next dearer. */
  copies?: number;
  /** Who the investigator is: the Dockworker builds for less (BRDC-INVEST-001). */
  archetype?: ArchetypeId | undefined;
  /** An ally who bargains (BRDC-ALLY-001). */
  ally?: AllyId | undefined;
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
  const here = worksOn(cell);
  if (b.masterwork) return { ok: false, refused: 'locked' };

  if (cell.ownerId !== ctx.playerId) return { ok: false, refused: 'not-yours' };
  // One of each per cell: three sawmills on one hex is a spreadsheet, not a decision.
  if (here.some((w) => w.id === id)) return { ok: false, refused: 'occupied' };

  // A chained building (BUILD-002) is only ever the in-place upgrade of its predecessor,
  // and only on the cell that predecessor stands on: `lumbermill` onto a `sawmill`.
  const upgrading = b.requires.some((r) => here.some((w) => w.id === r));
  if (b.requires.length > 0 && !upgrading) return { ok: false, refused: 'locked' };

  if (b.terrain !== 'any' && !b.terrain.includes(terrainForCell(cell).kind)) {
    return { ok: false, refused: 'wrong-terrain' };
  }
  if (b.tech && !hasTech(ctx.researched, b.tech)) return { ok: false, refused: 'locked' };
  // The dwell gate (BRDC-BUILD-003): a Library or Temple Grove needs a temple beside it.
  if (b.needsPlace === 'temple' && !ctx.templeAdjacent) {
    return { ok: false, refused: 'needs-a-temple' };
  }
  // The Forge's own gate (BRDC-BUILD-013): "adjacent iron" — a hill within one ring.
  if (b.needsIronAdjacent && !ctx.ironAdjacent) {
    return { ok: false, refused: 'needs-iron-nearby' };
  }
  // The Tavern's own gate (BRDC-TAVERN-001): one per province, so the quest board stays a
  // landmark to walk to rather than something every settlement hex quietly grows.
  if (b.uniquePerProvince && ctx.tavernInProvince) {
    return { ok: false, refused: 'one-per-province' };
  }
  // An upgrade takes the slot it replaces, so it does not run into the cap.
  if (!upgrading && here.length >= CELL_BUILDING_CAP) {
    return { ok: false, refused: 'cell-full' };
  }
  if (!canAfford(ctx.pool, priceFor(buildCost(id, ctx.copies), ctx.archetype, ctx.ally))) return { ok: false, refused: 'cannot-afford' };

  return { ok: true };
}
