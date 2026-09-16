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
import { hexSeedOf } from '../data/hexSeedStore.js';
import { BONUS_RESOURCES, yieldToResource } from '../data/worldseedAllocate.js';
import type { BonusResourceDef, Yield } from '../data/worldseedAllocate.js';
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
  | 'spice'
  | 'granite';

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
  // Worldseed's own BONUS_RESOURCES gives `fish` a 0.3 marsh affinity alongside water's
  // 1.0 — marsh got no bounty of its own when BRDC-TERRAIN-005 added it, and this is the
  // stopgap until BRDC-RES-001's dedicated marsh finds (peat, bog iron) land.
  fish: { terrain: ['lake', 'coast', 'marsh'], resource: 'food', perHour: 3 },
  amber: { terrain: ['coast'], resource: 'culture', perHour: 2 },
  // Every kind of ground can carry something. Without this, a player whose whole
  // neighbourhood is a place of trade could walk for weeks and never find anything —
  // and `bountiesFor` returning nothing is a silent exclusion, not a design.
  // Settlement (BRDC-TERRAIN-005) shares this slot too, provisionally — Worldseed's own
  // Ale Cellar and Market Stall pay culture/gold there; this is the stand-in until
  // BRDC-RES-001 gives settlement its own finds.
  spice: { terrain: ['market', 'plain', 'settlement'], resource: 'culture', perHour: 2 },
  // Civilization V's Stone, and the only bounty that pays a building material
  // (BRDC-TERRAIN-004). Twelve of the fifteen Works are quoted in stone and hill is the
  // one terrain that gives it, so a player whose neighbourhood has no hill in it could
  // not build. A field with granite under it is an answer to that, and it is also simply
  // true of this country.
  granite: { terrain: ['plain', 'hill'], resource: 'stone', perHour: 2 },
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

/**
 * Which pool a bounty came from (BRDC-RES-001) — `BountyId` and a `BonusResourceDef.id`
 * can name the *same word* (`gems`, `granite`, `fish`…) with two different definitions,
 * so the id alone is never enough to resolve one back to its table. The pool says which.
 */
export type BountyPool = 'legacy' | 'worldseed';

export interface BountyPick {
  readonly id: string;
  readonly pool: BountyPool;
}

interface WeightedCandidate {
  readonly id: string;
  readonly pool: BountyPool;
  readonly weight: number;
}

/** The old ten, weighted evenly — this table never had a rarity concept. */
function legacyCandidates(kind: TerrainKind): WeightedCandidate[] {
  return BOUNTY_IDS.filter((id) => BOUNTIES[id].terrain.includes(kind)).map((id) => ({
    id,
    pool: 'legacy',
    weight: 1,
  }));
}

/**
 * The 28 new finds, weighted by affinity × rarity — `allocateArea`'s own formula
 * (`worldseedAllocate.ts`), so a hex outside a seeded area draws from the same
 * probabilities a seeded area's own allocation would have used. A `require`d flag
 * (`shoreline`, `oldGrowth`…) can never be confirmed outside a classified area, so a
 * resource that needs one is honestly excluded there rather than guessed into place.
 */
function worldseedCandidates(kind: TerrainKind, flags: readonly string[]): WeightedCandidate[] {
  return BONUS_RESOURCES.filter(
    (r) => (r.affinity[kind] ?? 0) > 0 && (!r.require || r.require.every((f) => flags.includes(f))),
  ).map((r) => ({ id: r.id, pool: 'worldseed', weight: (r.affinity[kind] ?? 0) * r.rarity }));
}

/** Which bounties could be on this ground, both pools together. */
export function bountiesFor(kind: TerrainKind): BountyPick[] {
  return [...legacyCandidates(kind), ...worldseedCandidates(kind, [])].map(({ id, pool }) => ({ id, pool }));
}

/**
 * The bounty on this cell, or null.
 *
 * A seeded hex (`BRDC-SEED-004`) already has its answer decided by `BRDC-SEED-003`'s own
 * area allocation — no roll, just a read, and an area-allocated absence is as authoritative
 * as a presence. Everywhere else falls back to the two-roll hash `terrainOf` also uses: the
 * first decides whether this hex has anything at all, the second draws from both pools'
 * combined, weighted candidates.
 */
export function bountyOn(cell: Cell): BountyPick | null {
  // A bounty placed by hand wins, for the same reason hand-drawn terrain does.
  const drawn = paintedBountyOf(cell.h3);
  if (drawn) return { id: drawn, pool: 'legacy' };

  const seed = hexSeedOf(cell.h3);
  if (seed) return seed.resource ? { id: seed.resource.id, pool: 'worldseed' } : null;

  const kind = terrainForCell(cell).kind;
  const candidates = [...legacyCandidates(kind), ...worldseedCandidates(kind, [])];
  if (candidates.length === 0) return null;
  if (hash(`bounty:${cell.h3}`) >= BOUNTY_SHARE) return null;

  const totalWeight = candidates.reduce((t, c) => t + c.weight, 0);
  let roll = hash(`bounty-kind:${cell.h3}`) * totalWeight;
  for (const c of candidates) {
    roll -= c.weight;
    if (roll <= 0) return { id: c.id, pool: c.pool };
  }
  const last = candidates[candidates.length - 1]!;
  return { id: last.id, pool: last.pool };
}

function worldseedResource(id: string): BonusResourceDef | undefined {
  return BONUS_RESOURCES.find((r) => r.id === id);
}

/** What one bounty adds, per hour — every yield it has, not just one. `{}` for none. */
export function bountyYield(pick: BountyPick | null): Partial<ResourcePool> {
  if (!pick) return {};
  if (pick.pool === 'legacy') {
    const b = BOUNTIES[pick.id as BountyId];
    return b ? { [b.resource]: b.perHour } : {};
  }
  const r = worldseedResource(pick.id);
  if (!r) return {};
  const out: Partial<ResourcePool> = {};
  for (const [y, amount] of Object.entries(r.yields) as [Yield, number][]) {
    const resource = yieldToResource(y);
    out[resource] = (out[resource] ?? 0) + amount;
  }
  return out;
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
    const pick = bountyOn(cell);
    if (!pick) continue;
    for (const [resource, perHour] of Object.entries(bountyYield(pick)) as [ResourceKind, number][]) {
      out[resource] = (out[resource] ?? 0) + perHour;
    }
  }
  return out;
}

/** What a bounty is worth against the ordinary trickle — "twice what this ground pays". */
export const BOUNTY_VS_TRICKLE = TRICKLE_PER_HOUR;
