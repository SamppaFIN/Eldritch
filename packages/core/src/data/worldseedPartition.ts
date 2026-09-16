/**
 * BRDC-SEED-003 — grouping classified hexes into areas of 7–55 (Worldseed §03).
 *
 * Deposits are allocated per AREA, never per hex (`worldseedAllocate.ts`): a contiguous
 * same-terrain run gets split if it is too big to keep deposit density even, and folded
 * into its largest neighbour if it is too small to deserve one on its own. This is the
 * partition step, ported from `worldseed.ts`'s own `ZONE` constants and description —
 * the algorithm itself is not given there (`partition` is a `declare function`, a
 * signature with no body), so this is a fresh implementation of its stated rules, not a
 * port of existing code.
 */
import { neighboursOf } from '../geo/cells.js';
import type { H3Index, TerrainKind } from '../types/domain.js';

/** Worldseed's own §03 constants — a run bigger than this splits, smaller merges away. */
export const ZONE = { minHexes: 7, maxHexes: 55 } as const;

export interface Area {
  readonly id: string;
  readonly terrain: TerrainKind;
  readonly hexes: readonly H3Index[];
  /** Union of every flag any member hex carries — a deposit needing `oldGrowth` can only
   *  land on a member hex that actually has it (checked in `worldseedAllocate.ts`). */
  readonly flags: readonly string[];
}

interface Cluster {
  terrain: TerrainKind;
  hexes: H3Index[];
}

/** Same-terrain connected components over the grid's own H3 adjacency. */
function connectedComponents(terrainOf: ReadonlyMap<H3Index, TerrainKind>): Cluster[] {
  const seen = new Set<H3Index>();
  const clusters: Cluster[] = [];

  for (const [start, terrain] of terrainOf) {
    if (seen.has(start)) continue;
    const members: H3Index[] = [];
    const queue: H3Index[] = [start];
    seen.add(start);
    while (queue.length > 0) {
      const cur = queue.pop()!;
      members.push(cur);
      for (const n of neighboursOf(cur)) {
        if (!seen.has(n) && terrainOf.get(n) === terrain) {
          seen.add(n);
          queue.push(n);
        }
      }
    }
    clusters.push({ terrain, hexes: members });
  }
  return clusters;
}

/** A cluster over `ZONE.maxHexes` splits into bounded chunks by the same H3 adjacency. */
function splitOversized(cluster: Cluster): Cluster[] {
  if (cluster.hexes.length <= ZONE.maxHexes) return [cluster];

  const remaining = new Set(cluster.hexes);
  const chunks: Cluster[] = [];
  while (remaining.size > 0) {
    const start = remaining.values().next().value!;
    remaining.delete(start);
    const bucket: H3Index[] = [start];
    const queue: H3Index[] = [start];
    while (queue.length > 0 && bucket.length < ZONE.maxHexes) {
      const cur = queue.shift()!;
      for (const n of neighboursOf(cur)) {
        if (remaining.has(n) && bucket.length < ZONE.maxHexes) {
          remaining.delete(n);
          bucket.push(n);
          queue.push(n);
        }
      }
    }
    chunks.push({ terrain: cluster.terrain, hexes: bucket });
  }
  return chunks;
}

/**
 * A cluster under `ZONE.minHexes` folds into its largest touching neighbour, whatever
 * terrain that neighbour is — an area is a bookkeeping unit for deposit density, not a
 * terrain boundary, and a 3-hex scrap of forest beside a 40-hex plain is not worth its own
 * deposit roll. A cluster with no neighbour at all (possible only at the grid's own edge)
 * stays its own small area rather than vanishing.
 */
function mergeUndersized(clusters: readonly Cluster[]): Cluster[] {
  const clusterOf = new Map<H3Index, number>();
  clusters.forEach((c, i) => c.hexes.forEach((h) => clusterOf.set(h, i)));
  const merged = new Set<number>();
  const bucket = clusters.map((c) => [...c.hexes]);

  for (let i = 0; i < clusters.length; i += 1) {
    if (merged.has(i) || bucket[i]!.length >= ZONE.minHexes) continue;

    const neighbourSizes = new Map<number, number>();
    for (const h of bucket[i]!) {
      for (const n of neighboursOf(h)) {
        const j = clusterOf.get(n);
        // A neighbour the merge would push over maxHexes is not a candidate at all — this
        // is what stops a split chunk merging straight back into the sibling it was split
        // *from*, which would silently undo the size cap the split step just enforced.
        if (
          j !== undefined &&
          j !== i &&
          !merged.has(j) &&
          bucket[j]!.length + bucket[i]!.length <= ZONE.maxHexes
        ) {
          neighbourSizes.set(j, bucket[j]!.length);
        }
      }
    }
    if (neighbourSizes.size === 0) continue;

    let bestJ = -1;
    let bestSize = -1;
    for (const [j, size] of neighbourSizes) {
      if (size > bestSize) {
        bestSize = size;
        bestJ = j;
      }
    }
    for (const h of bucket[i]!) clusterOf.set(h, bestJ);
    bucket[bestJ]!.push(...bucket[i]!);
    merged.add(i);
  }

  return clusters
    .map((c, i) => ({ terrain: c.terrain, hexes: bucket[i]! }))
    .filter((_, i) => !merged.has(i));
}

/** Union of every flag any of `hexes` carries, from `flagsOf`. */
function unionFlags(hexes: readonly H3Index[], flagsOf: (h3: H3Index) => readonly string[]): string[] {
  const all = new Set<string>();
  for (const h of hexes) for (const f of flagsOf(h)) all.add(f);
  return [...all];
}

/**
 * Classified hexes → areas of `ZONE.minHexes`–`ZONE.maxHexes`, one same-terrain connected
 * component at a time: split first (a run can only be too big before it is ever too
 * small), then merge what is left too small into its largest neighbour.
 */
export function partitionIntoAreas(
  terrainOf: ReadonlyMap<H3Index, TerrainKind>,
  flagsOf: (h3: H3Index) => readonly string[],
): Area[] {
  const split = connectedComponents(terrainOf).flatMap(splitOversized);

  // One pass can leave a just-grown cluster still under minHexes (it absorbed a small
  // neighbour but is still small itself) — repeat until nothing changes or the cluster
  // count itself stops shrinking, whichever comes first, rather than assume one pass reaches
  // the fixed point.
  let areas = split;
  for (let pass = 0; pass < 10; pass += 1) {
    const next = mergeUndersized(areas);
    if (next.length === areas.length) break;
    areas = next;
  }

  const counters = new Map<TerrainKind, number>();
  return areas.map((c) => {
    const n = (counters.get(c.terrain) ?? 0) + 1;
    counters.set(c.terrain, n);
    return { id: `${c.terrain}-${n}`, terrain: c.terrain, hexes: c.hexes, flags: unionFlags(c.hexes, flagsOf) };
  });
}
