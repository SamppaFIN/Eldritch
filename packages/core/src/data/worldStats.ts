/**
 * The Atlas: who holds ground where, at a scale the whole country fits on one screen
 * (BRDC-ATLAS-001).
 *
 * `demographicsOf` answers "how am I doing against everyone else"; this answers "what
 * does the map look like from above" — a different question, a different shape. Every
 * res-11 cell rolls up into its res-5 municipality (`nationRegionOf`), and each
 * municipality is coloured by whoever holds the most of it — the same "one dominant
 * owner per patch of ground" Civilization's own world map reads at a glance.
 *
 * Pure, like `demographicsOf` beside it: the Worker calls this over every live
 * `WorldSource` it holds and serves the (small) result from one KV key, the same
 * pattern `clan-codex` already uses.
 */
import { cellAreaM2, nationRegionOf } from '../geo/cells.js';
import type { H3Index, PlayerId } from '../types/domain.js';
import type { WorldSource } from './world.js';

export interface AtlasRegion {
  /** The res-5 municipality this row describes. */
  region: H3Index;
  /** Whoever holds the most ground in this municipality. */
  dominant: {
    id: PlayerId;
    name: string;
    nation?: string;
    banner?: string;
  };
  /** The dominant holder's own area here — not the municipality's total, which nobody
   *  needs and which would just invite reading it as "fully held". */
  areaM2: number;
  /** How many distinct players hold any ground at all in this municipality. */
  players: number;
}

/** One row per res-5 municipality that has any player's ground in it at all. */
export function atlasOf(sources: readonly WorldSource[]): AtlasRegion[] {
  const byRegion = new Map<H3Index, Map<PlayerId, { areaM2: number; source: WorldSource }>>();

  for (const source of sources) {
    for (const cell of source.cells) {
      const region = nationRegionOf(cell.h3);
      const byOwner = byRegion.get(region) ?? new Map<PlayerId, { areaM2: number; source: WorldSource }>();
      const entry = byOwner.get(source.id) ?? { areaM2: 0, source };
      entry.areaM2 += cellAreaM2(cell.h3);
      byOwner.set(source.id, entry);
      byRegion.set(region, byOwner);
    }
  }

  const regions: AtlasRegion[] = [];
  for (const [region, byOwner] of byRegion) {
    // Most area first; a tie keeps whoever's cells were merged in first, the same
    // "arrived in this order" rule demographicsOf's own ranking leaves unbroken.
    const top = [...byOwner.values()].sort((a, b) => b.areaM2 - a.areaM2)[0]!;
    regions.push({
      region,
      dominant: {
        id: top.source.id,
        name: top.source.name,
        ...(top.source.nation ? { nation: top.source.nation } : {}),
        ...(top.source.banner ? { banner: top.source.banner } : {}),
      },
      areaM2: Math.round(top.areaM2),
      players: byOwner.size,
    });
  }
  return regions;
}
