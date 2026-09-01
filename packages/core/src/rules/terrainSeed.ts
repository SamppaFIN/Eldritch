/**
 * Hand-surveyed terrain for one test area (BRDC-TERRAIN-003).
 *
 * The hash in `terrain.ts` is *the shape real terrain fills*, not real terrain — good
 * enough for a map nobody is standing on. But the Phase 2.6 field test is a real walk in
 * Härmälä, Tampere, and a walk past the Pyhäjärvi shore should pay `food`, not a die
 * roll. This module overrides the hash for a bounded box around that area with regions
 * checked against the map by hand.
 *
 * Pure. `seededTerrainOf` returns `null` for any cell outside the box, so everywhere
 * else in the world is untouched. Regions are tested in order; the first that contains
 * the cell centre wins, and a cell inside the box that matches none is `plain`.
 *
 * FIRST DRAFT — coordinates are estimated from memory of the area and need a pass
 * against a real map (a Google Maps screenshot of the walk route). Refine the numbers,
 * do not add machinery.
 */
import { cellCentre } from '../geo/cells.js';
import { haversine } from '../geo/haversine.js';
import type { H3Index, Terrain, TerrainKind } from '../types/domain.js';

interface Circle {
  shape: 'circle';
  kind: TerrainKind;
  /** What this region is, for the reviewer. */
  note: string;
  lat: number;
  lng: number;
  radiusM: number;
}

interface Box {
  shape: 'box';
  kind: TerrainKind;
  note: string;
  south: number;
  west: number;
  north: number;
  east: number;
}

type Region = Circle | Box;

/** The area the survey covers. Roughly the Härmälä district, ~3 km across. */
export const SEED_BOX = { south: 61.438, west: 23.705, north: 61.47, east: 23.775 };

/**
 * Härmälä, Tampere. Ordered: a shore cell must read `coast`, not `lake`, so the coast
 * points come before the water they sit beside.
 */
const REGIONS: readonly Region[] = [
  { shape: 'circle', kind: 'coast', note: 'Härmälänranta shore', lat: 61.4542, lng: 23.7338, radiusM: 260 },
  { shape: 'circle', kind: 'coast', note: 'Rantaperkiö shore', lat: 61.4491, lng: 23.7228, radiusM: 240 },
  { shape: 'circle', kind: 'market', note: 'Härmälä centre / Nuolialantie shops', lat: 61.4581, lng: 23.7462, radiusM: 340 },
  { shape: 'circle', kind: 'market', note: 'Pirkkahalli / retail', lat: 61.4512, lng: 23.7421, radiusM: 300 },
  { shape: 'circle', kind: 'forest', note: 'Härmälän puisto', lat: 61.4559, lng: 23.7381, radiusM: 200 },
  { shape: 'circle', kind: 'forest', note: 'Rautaharkko / Vähäjärvi woods', lat: 61.4623, lng: 23.7662, radiusM: 520 },
  { shape: 'circle', kind: 'forest', note: 'Nuoliala woods (south)', lat: 61.4423, lng: 23.7451, radiusM: 400 },
  { shape: 'circle', kind: 'lake', note: 'Pyhäjärvi — Härmälä bay', lat: 61.4462, lng: 23.7123, radiusM: 1400 },
  { shape: 'circle', kind: 'lake', note: 'Pyhäjärvi — southern water', lat: 61.4352, lng: 23.7302, radiusM: 1200 },
];

function inBox(lat: number, lng: number): boolean {
  return (
    lat >= SEED_BOX.south && lat <= SEED_BOX.north && lng >= SEED_BOX.west && lng <= SEED_BOX.east
  );
}

/** The surveyed terrain for a cell, or `null` when it lies outside the surveyed box. */
export function seededTerrainOf(h3: H3Index): Terrain | null {
  const centre = cellCentre(h3);
  if (!inBox(centre.lat, centre.lng)) return null;

  for (const r of REGIONS) {
    if (r.shape === 'circle') {
      if (haversine(centre, { lat: r.lat, lng: r.lng }) <= r.radiusM) {
        return { kind: r.kind, source: 'seed' };
      }
    } else if (
      centre.lat >= r.south &&
      centre.lat <= r.north &&
      centre.lng >= r.west &&
      centre.lng <= r.east
    ) {
      return { kind: r.kind, source: 'seed' };
    }
  }
  return { kind: 'plain', source: 'seed' };
}
