/**
 * The Codex of Dominion — every realm measured against every other (BRDC-CODEX-001).
 *
 * Shaped after Civilization's Demographics screen rather than a scoreboard, and the
 * difference is the whole point. A ranked list answers "who is winning", which in a game
 * played by a handful of friends walking their own neighbourhoods is rarely interesting
 * and often discouraging. A demographics table answers **"where do I stand"** — your
 * figure, your rank, the best, the average and the worst, one row per measure — so a
 * player who is third in land can still be first in ley-line, and both are visible.
 *
 * Pure and clock-free, like `world.ts` it sits beside. The Worker computes it once per
 * submission over every player it holds and serves the result; the client only reads.
 *
 * It reads a shape both `WorldSource` (what the Worker merges) and `WorldPlayer` (what a
 * shard carries) satisfy, so neither side needs a conversion step.
 */
import { regionOf, totalAreaM2 } from '../geo/cells.js';
import { population } from '../rules/nation.js';
import { CODEX_VERSION } from '../rules/constants.js';
import type { WireCell } from './challenge.js';
import type { PlayerId } from '../types/domain.js';

/** What every measure is called, and the order the table lists them in. */
export type MetricId =
  | 'land'
  | 'leyline'
  | 'consciousness'
  | 'population'
  | 'works'
  | 'provinces'
  | 'footfall';

export const METRIC_IDS: readonly MetricId[] = [
  'land',
  'leyline',
  'consciousness',
  'population',
  'works',
  'provinces',
  'footfall',
];

/** One player's figure for one measure. */
export interface Standing {
  id: PlayerId;
  name: string;
  nation?: string;
  banner?: string;
  value: number;
}

export interface Metric {
  id: MetricId;
  /** Everyone, best first. Ties keep the order they arrived in. */
  ranked: Standing[];
  best: number;
  worst: number;
  /** Mean across every realm, unrounded — the caller decides how to show it. */
  average: number;
}

export interface Demographics {
  v: number;
  generatedAt: number;
  players: number;
  metrics: Metric[];
}

/** The least a realm has to carry to be measured. Both `WorldSource` and `WorldPlayer` do. */
export interface Measurable {
  id: PlayerId;
  name: string;
  nation?: string;
  banner?: string;
  cells: readonly WireCell[];
  level?: number;
  leyM?: number;
}

/**
 * What each measure reads.
 *
 * `level` and `leyM` are additive fields a realm published before BRDC-CODEX-001 does not
 * carry. They read as their floor — level 1, no ley-line — rather than being skipped:
 * a realm missing from one row and present in another would make the ranks disagree with
 * each other, and a table that contradicts itself is worse than one that is behind.
 */
const READ: Readonly<Record<MetricId, (p: Measurable) => number>> = {
  land: (p) => Math.round(totalAreaM2(p.cells.map((c) => c.h3))),
  leyline: (p) => Math.round(p.leyM ?? 0),
  consciousness: (p) => p.level ?? 1,
  population: (p) => population(p.cells.length, works(p)),
  works: works,
  provinces: (p) => new Set(p.cells.map((c) => regionOf(c.h3))).size,
  // Every day anyone has walked each held hex, added up. It is the one measure that
  // cannot be had in an afternoon: it only grows by coming back.
  footfall: (p) => p.cells.reduce((sum, c) => sum + (c.d ?? 0), 0),
};

function works(p: Measurable): number {
  return p.cells.reduce((sum, c) => sum + (c.b?.length ?? 0), 0);
}

/** The whole table, one pass over the realms. `players: 0` when there are none. */
export function demographicsOf(realms: readonly Measurable[], now: number): Demographics {
  const metrics: Metric[] = METRIC_IDS.map((id) => {
    const ranked = realms
      .map((p) => ({
        id: p.id,
        name: p.name,
        ...(p.nation ? { nation: p.nation } : {}),
        ...(p.banner ? { banner: p.banner } : {}),
        value: READ[id](p),
      }))
      .sort((a, b) => b.value - a.value);

    const values = ranked.map((r) => r.value);
    return {
      id,
      ranked,
      best: values[0] ?? 0,
      worst: values[values.length - 1] ?? 0,
      average: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
    };
  });

  return { v: CODEX_VERSION, generatedAt: now, players: realms.length, metrics };
}

export interface Placement {
  rank: number;
  of: number;
  value: number;
}

/**
 * Where one realm stands in one measure — "3 of 7".
 *
 * Equal figures share a rank, so two realms both on 12 hexes are both second and the next
 * one down is fourth. Ranking them 2nd and 3rd by array order would invent a difference
 * the numbers do not contain.
 */
export function placementIn(metric: Metric, id: PlayerId): Placement | null {
  const mine = metric.ranked.find((r) => r.id === id);
  if (!mine) return null;
  const ahead = metric.ranked.filter((r) => r.value > mine.value).length;
  return { rank: ahead + 1, of: metric.ranked.length, value: mine.value };
}
