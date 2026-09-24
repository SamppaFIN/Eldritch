/**
 * The research tree's rules (BRDC-WORKS-002). Pure: a definition, what this building has
 * learned, and a pouch in; a state or a new pouch out.
 *
 * A node's predecessor is always the tier above it — the design's every "Needs" is — so
 * there is no `requires` to disagree with the shape.
 */
import { canAfford } from '../terrain.js';
import type { ResourceKind, ResourcePool } from '../terrain.js';
import type { BuildingDef, Effect, EffectKind, WorksNode, WorksTier } from './types.js';

/**
 * The effect kinds the game can actually apply today. A node with any other kind is shown
 * but cannot be learned — paying for a sentence that does nothing would be a lie.
 */
export const WIRED: ReadonlySet<EffectKind> = new Set<EffectKind>([
  'produce',
  'producePer',
  'cellStrength',
  'reach',
  'storageCap',
  'convert',
  'produceFrom',
  'worksMult',
]);

export type NodeState = 'learned' | 'available' | 'locked' | 'closed' | 'dormant';
export type WorksRefusal = 'not-yours' | 'unknown' | 'already' | 'locked' | 'closed' | 'dormant' | 'short';

/** A wider ring only matters when something reads it: the ring's own effect, or a node's. */
function ringMatters(def: BuildingDef): boolean {
  if (def.reach?.effect && isWired(def, def.reach.effect)) return true;
  return def.tree.tiers.some((t) =>
    t.nodes.some((n) => n.effects.some((e) => e.kind === 'producePer' && e.per === 'cellInReach')),
  );
}

export function isWired(def: BuildingDef, e: Effect): boolean {
  if (!WIRED.has(e.kind)) return false;
  if (e.kind === 'cellStrength') return e.scope === 'cell';
  if (e.kind === 'reach') return ringMatters(def);
  return true;
}

/** A node with no effect is one the building already does — the Tavern's board. */
export function isDormant(def: BuildingDef, node: WorksNode): boolean {
  return !node.effects.every((e) => isWired(def, e));
}

function tierOf(def: BuildingDef, nodeId: string): WorksTier | null {
  return def.tree.tiers.find((t) => t.nodes.some((n) => n.id === nodeId)) ?? null;
}

export function nodeById(def: BuildingDef, nodeId: string): WorksNode | null {
  for (const t of def.tree.tiers) for (const n of t.nodes) if (n.id === nodeId) return n;
  return null;
}

function tierDone(t: WorksTier, learned: ReadonlySet<string>): boolean {
  return t.nodes.some((n) => learned.has(n.id));
}

/** How many tiers are learned — the building's level, 0 to 5. */
export function worksLevel(def: BuildingDef, learned: readonly string[]): number {
  const set = new Set(learned);
  return def.tree.tiers.filter((t) => tierDone(t, set)).length;
}

export function nodeState(def: BuildingDef, learned: readonly string[], nodeId: string): NodeState {
  const set = new Set(learned);
  if (set.has(nodeId)) return 'learned';
  const tier = tierOf(def, nodeId);
  const node = nodeById(def, nodeId);
  if (!tier || !node) return 'locked';
  if (tier.choice && tierDone(tier, set)) return 'closed';
  // The nearest tier above with anything learnable gates this one. A tier that is all
  // asleep does not — the tree would otherwise stop at the first thing the game lacks.
  for (let t = tier.tier - 1; t >= 1; t -= 1) {
    const above = def.tree.tiers.find((x) => x.tier === t);
    if (!above || above.nodes.every((n) => isDormant(def, n))) continue;
    if (!tierDone(above, set)) return 'locked';
    break;
  }
  return isDormant(def, node) ? 'dormant' : 'available';
}

export type ResearchCheck = { ok: true; node: WorksNode } | { ok: false; refused: WorksRefusal };

export function canResearch(
  def: BuildingDef,
  learned: readonly string[],
  nodeId: string,
  pool: ResourcePool,
  isMine: boolean,
): ResearchCheck {
  if (!isMine) return { ok: false, refused: 'not-yours' };
  const node = nodeById(def, nodeId);
  if (!node) return { ok: false, refused: 'unknown' };
  const state = nodeState(def, learned, nodeId);
  if (state === 'learned') return { ok: false, refused: 'already' };
  if (state !== 'available') return { ok: false, refused: state };
  if (!canAfford(pool, node.cost)) return { ok: false, refused: 'short' };
  return { ok: true, node };
}

export type ResearchResult =
  | { ok: true; learned: string[]; pool: ResourcePool; node: WorksNode }
  | { ok: false; refused: WorksRefusal };

export function researchNode(
  def: BuildingDef,
  learned: readonly string[],
  nodeId: string,
  pool: ResourcePool,
  isMine: boolean,
): ResearchResult {
  const check = canResearch(def, learned, nodeId, pool, isMine);
  if (!check.ok) return check;
  const next = { ...pool };
  for (const [k, v] of Object.entries(check.node.cost) as [ResourceKind, number][]) next[k] -= v;
  return { ok: true, learned: [...learned, nodeId], pool: next, node: check.node };
}

/** Every effect this building has learned, in tree order. */
export function activeEffects(def: BuildingDef, learned: readonly string[]): Effect[] {
  const set = new Set(learned);
  return def.tree.tiers.flatMap((t) => t.nodes.filter((n) => set.has(n.id)).flatMap((n) => n.effects));
}

/** Rings reached now: the base plus every learned `reach`, never past the cap. */
export function reachRings(def: BuildingDef, learned: readonly string[]): number {
  if (!def.reach) return 0;
  const extra = activeEffects(def, learned).reduce((s, e) => s + (e.kind === 'reach' ? e.rings : 0), 0);
  return Math.min(def.reach.maxRings, def.reach.rings + extra);
}

/** Cells in `rings` rings around a hex, the hex itself not counted: 6, 18, 36… */
export function cellsInRings(rings: number): number {
  return 3 * rings * (rings + 1);
}

/** Every node in the tree, learned or not — the "n / m" denominator. */
export function nodeCount(def: BuildingDef): number {
  return def.tree.tiers.reduce((s, t) => s + t.nodes.length, 0);
}
