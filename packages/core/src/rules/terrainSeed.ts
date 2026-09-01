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
 * SECOND DRAFT (2026-09-01) — placed from Infinite's annotated Google Maps screenshot:
 * water to the north and north-east, the residential grid to the south, a "vuori" block
 * ringed as mountain, a shop and a bar by the statue where the adventure starts, the
 * island rec park as woods. Still ±150–250 m until a walk and a long-press lock the
 * numbers. Refine the coordinates, do not add machinery.
 */
import { cellCentre } from '../geo/cells.js';
import { haversine } from '../geo/haversine.js';
import type { H3Index, LatLng, Terrain, TerrainKind } from '../types/domain.js';

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

/** The area the survey covers — the Härmälä district in Infinite's screenshot, ~2.5 km. */
export const SEED_BOX = { south: 61.449, west: 23.706, north: 61.467, east: 23.744 };

/**
 * Where the adventure begins (`BRDC-QUEST-001`): the statue Infinite marked, with a
 * shop and a bar beside it. Not terrain — a point the quest reads.
 */
export const HARMALA_STATUE: LatLng = { lat: 61.4577, lng: 23.7278 };

/**
 * Härmälä, Tampere. Ordered, first match wins: the island rec park sits *in* the water,
 * so `forest` is checked before `lake`; a shore cell reads `coast` before `lake` too.
 */
const REGIONS: readonly Region[] = [
  { shape: 'circle', kind: 'forest', note: 'Härmälänsaaren ulkoilupuisto (island)', lat: 61.4628, lng: 23.7175, radiusM: 320 },
  { shape: 'circle', kind: 'forest', note: 'SE greenbelt — Lepolanpuisto / camping woods', lat: 61.4568, lng: 23.7365, radiusM: 280 },
  { shape: 'circle', kind: 'coast', note: 'Härmälänrannan satama / Villa shore', lat: 61.46, lng: 23.7245, radiusM: 240 },
  { shape: 'circle', kind: 'coast', note: 'SE shore point (quest location)', lat: 61.4585, lng: 23.735, radiusM: 220 },
  { shape: 'circle', kind: 'market', note: 'shop + bar by the statue', lat: 61.4578, lng: 23.728, radiusM: 260 },
  { shape: 'circle', kind: 'mountain', note: 'the "vuori" block', lat: 61.4562, lng: 23.73, radiusM: 230 },
  { shape: 'circle', kind: 'lake', note: 'Pyhäjärvi — Härmälänlahti (NW)', lat: 61.464, lng: 23.722, radiusM: 700 },
  { shape: 'circle', kind: 'lake', note: 'Pyhäjärvi — the NE arm', lat: 61.4625, lng: 23.735, radiusM: 650 },
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
