/**
 * The walked-path layer's data (BRDC-TRAIL-003).
 *
 * The live ley-line is one run's points, and closing a loop trims it. This is the other
 * thing: every stretch a player has *ever* walked, kept across runs in its own store,
 * thickening from a footpath to a rail line the more it is used. It is a visual record of
 * where someone's life actually goes — which is the whole premise of a game played on
 * foot — and it never becomes territory or gets fought over.
 *
 * A segment is an undirected edge between two consecutive res-12 cells along a trace,
 * keyed `"<a>:<b>"` with `a <= b` so walking a street either way wears the same groove.
 * Everything here is pure: the same trace always produces the same edges, the tier only
 * ever rises with visits, and pruning keeps the most-worn.
 */
import { latLngToCell } from 'h3-js';
import { cellCentre } from './cells.js';
import { PATH_SEGMENT_RES, PATH_TIERS, PATH_TIER_VISITS } from '../rules/constants.js';
import type { H3Index, LatLng } from '../types/domain.js';

export type PathTier = (typeof PATH_TIERS)[number];

export interface PathSegment {
  visits: number;
  /** Epoch ms of the most recent pass. Breaks ties when pruning. */
  lastAt: number;
}

export interface WalkedEdge {
  edge: string;
  a: LatLng;
  b: LatLng;
  tier: PathTier;
  visits: number;
}

/**
 * Consecutive distinct res-12 cells along a trace, paired into undirected edges.
 *
 * Standing still maps many points to one cell and yields no edge; a trace of one cell or
 * fewer yields none at all.
 */
export function trailEdges(points: readonly LatLng[]): string[] {
  const cells: H3Index[] = [];
  for (const p of points) {
    const c = latLngToCell(p.lat, p.lng, PATH_SEGMENT_RES);
    if (cells[cells.length - 1] !== c) cells.push(c);
  }

  const edges: string[] = [];
  for (let i = 1; i < cells.length; i += 1) {
    const a = cells[i - 1] as H3Index;
    const b = cells[i] as H3Index;
    edges.push(a <= b ? `${a}:${b}` : `${b}:${a}`);
  }
  return edges;
}

/**
 * Wear tier from a visit count. Monotonic in `visits`; the last tier has no upper bound.
 * The shape is `eraOf`/`levelForXp`'s: a threshold table, walked once, no counter of its own.
 */
export function tierOf(visits: number): PathTier {
  let tier: PathTier = PATH_TIERS[0];
  for (let i = 0; i < PATH_TIERS.length; i += 1) {
    if (visits >= (PATH_TIER_VISITS[i] as number)) tier = PATH_TIERS[i] as PathTier;
  }
  return tier;
}

/** Bank a batch of edges: one visit each, stamped `now`. Returns the next map; never mutates. */
export function bankEdges(
  map: Readonly<Record<string, PathSegment>>,
  edges: readonly string[],
  now: number,
): Record<string, PathSegment> {
  const next: Record<string, PathSegment> = { ...map };
  for (const edge of edges) {
    next[edge] = { visits: (next[edge]?.visits ?? 0) + 1, lastAt: now };
  }
  return next;
}

/**
 * Cap the store: keep the `cap` most-worn segments, breaking ties toward the most recent.
 *
 * "Least visited first" alone would delete the new routes a player is just starting to
 * wear in; ordering by visits then recency drops the segments that are both faint and old.
 * A segment is never dropped while one with fewer visits is kept.
 */
export function prunePaths(
  map: Readonly<Record<string, PathSegment>>,
  cap: number,
): Record<string, PathSegment> {
  const entries = Object.entries(map);
  if (entries.length <= cap) return { ...map };
  entries.sort((x, y) => y[1].visits - x[1].visits || y[1].lastAt - x[1].lastAt);
  return Object.fromEntries(entries.slice(0, cap));
}

/** The stored map as drawable edges: endpoints resolved to centres, tier attached. */
export function walkedEdges(map: Readonly<Record<string, PathSegment>>): WalkedEdge[] {
  return Object.entries(map).map(([edge, seg]) => {
    const [a, b] = edge.split(':') as [H3Index, H3Index];
    return {
      edge,
      a: cellCentre(a),
      b: cellCentre(b),
      tier: tierOf(seg.visits),
      visits: seg.visits,
    };
  });
}
