/**
 * Bounties — what a particular hex turns out to have on it (BRDC-BOUNTY-001).
 *
 * Civilization's bonus resources, in this game's shape. Terrain says what kind of ground a
 * hex is; a bounty says that *this* forest has deer in it and the one beside it does not.
 * It is the difference between a map made of seven kinds of tile and a map with places in
 * it worth walking to.
 *
 * Three rules hold it together:
 *
 * 1. **Deterministic from the index**, like `terrainOf` and `revealOf` — never
 *    `Math.random()`. Two players on the same street find the same deer, a reload does not
 *    re-roll them, and Phase 5's golden fixtures need SQL and TypeScript to agree.
 * 2. **Bound to its ground.** Fish are on water, gems in mountains, wheat on the plain.
 *    A bounty that could land anywhere would read as decoration; one that belongs to its
 *    terrain reads as geography.
 * 3. **Found, not given.** The yield starts once the hex has been revealed — see
 *    `bountyBonus`. Revealing was a one-off payout; this makes it discovery.
 *
 * The plain is the point of the whole table. Two thirds of the map is plain and plain
 * yields nothing (`TERRAIN_TABLE`), so most ground was interchangeable. Wheat and a herd
 * give some of it a reason to be walked.
 */
import { TRICKLE_PER_HOUR, terrainForCell } from './terrain.js';
import type { ResourceKind, ResourcePool, TerrainKind } from './terrain.js';
import { DECAY_GRACE_HOURS } from './constants.js';
import { paintedBountyOf } from '../data/mapData.js';
import type { Cell, H3Index } from '../types/domain.js';

export type BountyId =
  | 'wheat'
  | 'herd'
  | 'deer'
  | 'furs'
  | 'gems'
  | 'marble'
  | 'fish'
  | 'amber'
  | 'spice';

export interface Bounty {
  /** Ground it can be found on. */
  terrain: readonly TerrainKind[];
  /** Added to this cell's hourly trickle once the hex is revealed. */
  resource: ResourceKind;
  perHour: number;
}

/**
 * The table. Numbers here, like `BUILDINGS` and `TECHS`.
 *
 * Sized against `TRICKLE_PER_HOUR` (2): a bounty roughly doubles what its hex pays, and
 * gems triple it. Enough to change where you would rather walk, not enough to make one
 * lucky hex worth more than a habit.
 */
export const BOUNTIES: Readonly<Record<BountyId, Bounty>> = {
  wheat: { terrain: ['plain'], resource: 'food', perHour: 2 },
  herd: { terrain: ['plain', 'hill'], resource: 'food', perHour: 2 },
  deer: { terrain: ['forest'], resource: 'food', perHour: 2 },
  furs: { terrain: ['forest'], resource: 'gold', perHour: 2 },
  gems: { terrain: ['mountain'], resource: 'gold', perHour: 3 },
  marble: { terrain: ['hill', 'mountain'], resource: 'culture', perHour: 2 },
  fish: { terrain: ['lake', 'coast'], resource: 'food', perHour: 3 },
  amber: { terrain: ['coast'], resource: 'culture', perHour: 2 },
  // Every kind of ground can carry something. Without this, a player whose whole
  // neighbourhood is a place of trade could walk for weeks and never find anything —
  // and `bountiesFor` returning nothing is a silent exclusion, not a design.
  spice: { terrain: ['market', 'plain'], resource: 'culture', perHour: 2 },
};

export const BOUNTY_IDS = Object.keys(BOUNTIES) as BountyId[];

/**
 * How much of the map carries a bounty at all.
 *
 * One hex in eight. Common enough that a walk across a neighbourhood finds two or three,
 * rare enough that finding one is a small event rather than the ordinary case.
 */
export const BOUNTY_SHARE = 0.125;

/** FNV-1a over the salted index — the same spread `terrain.ts` and `reveal.ts` threshold on. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/** Which bounties could be on this ground, in table order. */
export function bountiesFor(kind: TerrainKind): BountyId[] {
  return BOUNTY_IDS.filter((id) => BOUNTIES[id].terrain.includes(kind));
}

/**
 * The bounty on this cell, or null.
 *
 * Two rolls, like `terrainOf`: the first decides whether this hex has anything at all, the
 * second picks which. Split so the share can be tuned without moving every hex to a
 * different bounty.
 */
export function bountyOn(cell: Cell): BountyId | null {
  // A bounty placed by hand wins, for the same reason hand-drawn terrain does.
  const drawn = paintedBountyOf(cell.h3);
  if (drawn) return drawn;

  const kind = terrainForCell(cell).kind;
  const candidates = bountiesFor(kind);
  if (candidates.length === 0) return null;
  if (hash(`bounty:${cell.h3}`) >= BOUNTY_SHARE) return null;
  const pick = Math.floor(hash(`bounty-kind:${cell.h3}`) * candidates.length);
  return candidates[Math.min(pick, candidates.length - 1)] ?? null;
}

/** What one bounty adds, per hour. `{}` for a cell that has none. */
export function bountyYield(id: BountyId | null): Partial<ResourcePool> {
  if (!id) return {};
  const b = BOUNTIES[id];
  return { [b.resource]: b.perHour };
}

const DORMANT_AFTER_MS = DECAY_GRACE_HOURS * 3_600_000;

/**
 * Per-hour yield from every bounty on ground that is awake **and revealed**.
 *
 * The reveal gate is the mechanic, not a technicality: a bounty you have not looked for
 * pays nothing, so revealing stops being a one-off bonus and becomes the way you find out
 * what your own land is worth. Dormancy applies as it does to everything else — a hex
 * nobody has walked in 48 h earns nothing, deer or no deer.
 */
export function bountyBonus(
  cells: readonly Cell[],
  revealed: Readonly<Record<H3Index, number>>,
  now: number,
): Partial<ResourcePool> {
  const out: Partial<ResourcePool> = {};
  for (const cell of cells) {
    if (now - cell.lastVisitedAt > DORMANT_AFTER_MS) continue;
    if (revealed[cell.h3] === undefined) continue;
    const id = bountyOn(cell);
    if (!id) continue;
    const b = BOUNTIES[id];
    out[b.resource] = (out[b.resource] ?? 0) + b.perHour;
  }
  return out;
}

/** What a bounty is worth against the ordinary trickle — "twice what this ground pays". */
export const BOUNTY_VS_TRICKLE = TRICKLE_PER_HOUR;
