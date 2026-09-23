/**
 * Route mode's own leaderboard (BRDC-MODE-002).
 *
 * Deliberately not a row filter on `demographics.ts`'s Codex — that table ranks
 * consciousness, works, provinces, none of which a Route-mode realm ever earns, and mixing
 * the two would either show a wall of zeroes or quietly waive the rule that stripped them
 * out. This is the whole promise CLAUDE.md §10/Infinite's 2026-09-23 request made concrete:
 * Route mode measures nothing but distance walked and hexes taken.
 *
 * Pure and clock-free, like `demographics.ts` it sits beside. The Worker filters
 * `mode === 'route'` realms out of the Adventure Codex and into this one.
 */
import { ROUTE_CODEX_VERSION } from '../rules/constants.js';
import type { WireCell } from './challenge.js';
import type { PlayerId } from '../types/domain.js';

/** The least a realm has to carry to be measured. `WorldSource`/`WorldPlayer` both do. */
export interface RouteMeasurable {
  id: PlayerId;
  name: string;
  cells: readonly WireCell[];
  routeDistanceM?: number;
}

export interface RouteStanding {
  id: PlayerId;
  name: string;
  distanceM: number;
  hexes: number;
}

export interface RouteCodex {
  v: number;
  generatedAt: number;
  players: number;
  /** Best first: distance, then hex count breaks a tie. */
  ranked: RouteStanding[];
}

export function routeCodexOf(realms: readonly RouteMeasurable[], now: number): RouteCodex {
  const ranked = realms
    .map((p) => ({
      id: p.id,
      name: p.name,
      distanceM: Math.round(p.routeDistanceM ?? 0),
      hexes: p.cells.length,
    }))
    .sort((a, b) => b.distanceM - a.distanceM || b.hexes - a.hexes);

  return { v: ROUTE_CODEX_VERSION, generatedAt: now, players: ranked.length, ranked };
}

/** Where one realm stands — "3 of 7". Mirrors `demographics.ts`'s `placementIn`. */
export interface RoutePlacement {
  rank: number;
  of: number;
}

export function routePlacementOf(codex: RouteCodex, id: PlayerId): RoutePlacement | null {
  const mine = codex.ranked.find((r) => r.id === id);
  if (!mine) return null;
  const ahead = codex.ranked.filter(
    (r) => r.distanceM > mine.distanceM || (r.distanceM === mine.distanceM && r.hexes > mine.hexes),
  ).length;
  return { rank: ahead + 1, of: codex.ranked.length };
}
