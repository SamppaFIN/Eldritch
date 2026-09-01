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
 * THIRD DRAFT (2026-09-01) — anchored on the statue coordinate Infinite long-pressed
 * (61.472913, 23.725988) and laid out from the annotated screenshot around it: water to
 * the north and north-east, the residential grid to the south, a block ringed as
 * mountain, a shop and a bar by the statue, the island rec park as woods. The statue
 * anchor is exact; the regions around it are ±100–150 m until a walk confirms them.
 *
 * OFF by default. The survey covers the exact spot the test corpus uses as its origin,
 * so leaving it always-on would make every economy and forecast test depend on which
 * Tampere cell is a lake. The app switches it on at boot (`createRepository`); the core
 * test suite leaves it off, and the one test that exercises it opts in.
 */
import { cellCentre } from '../geo/cells.js';
import { haversine } from '../geo/haversine.js';
import type { H3Index, LatLng, Terrain, TerrainKind } from '../types/domain.js';

let surveyEnabled = false;

/** Turn the hand survey on (the app, at boot) or off (tests). */
export function enableTerrainSurvey(on = true): void {
  surveyEnabled = on;
}

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

/** The area the survey covers — the Härmälä district around the statue, ~1.6 km across. */
export const SEED_BOX = { south: 61.4665, west: 23.716, north: 61.4805, east: 23.7385 };

/**
 * Where the adventure begins (`BRDC-QUEST-001`): the statue Infinite long-pressed, with
 * a shop and a bar beside it. Not terrain — a point the quest reads.
 */
export const HARMALA_STATUE: LatLng = { lat: 61.472913, lng: 23.725988 };

/**
 * Härmälä, Tampere, laid out from the statue. Ordered, first match wins: the island rec
 * park sits *in* the water, so `forest` is checked before `lake`; a shore cell reads
 * `coast` before `lake` too.
 */
const REGIONS: readonly Region[] = [
  { shape: 'circle', kind: 'forest', note: 'Härmälänsaaren ulkoilupuisto (island)', lat: 61.4776, lng: 23.7274, radiusM: 220 },
  { shape: 'circle', kind: 'forest', note: 'SE greenbelt — Lepolanpuisto / camping woods', lat: 61.4707, lng: 23.7368, radiusM: 240 },
  { shape: 'circle', kind: 'coast', note: 'Härmälänrannan satama shore', lat: 61.4753, lng: 23.7272, radiusM: 190 },
  { shape: 'circle', kind: 'coast', note: 'SE shore point (quest location)', lat: 61.4726, lng: 23.7346, radiusM: 190 },
  { shape: 'circle', kind: 'market', note: 'shop + bar by the statue', lat: 61.4729, lng: 23.7263, radiusM: 170 },
  { shape: 'circle', kind: 'mountain', note: 'the "vuori" block', lat: 61.4716, lng: 23.7327, radiusM: 180 },
  { shape: 'circle', kind: 'lake', note: 'Pyhäjärvi — Härmälänlahti (NW)', lat: 61.4772, lng: 23.7255, radiusM: 430 },
  { shape: 'circle', kind: 'lake', note: 'Pyhäjärvi — north', lat: 61.4772, lng: 23.7305, radiusM: 380 },
  { shape: 'circle', kind: 'lake', note: 'Pyhäjärvi — the NE arm', lat: 61.4749, lng: 23.7351, radiusM: 320 },
];

function inBox(lat: number, lng: number): boolean {
  return (
    lat >= SEED_BOX.south && lat <= SEED_BOX.north && lng >= SEED_BOX.west && lng <= SEED_BOX.east
  );
}

/** The surveyed terrain for a cell — `null` when the survey is off, or the cell is outside the box. */
export function seededTerrainOf(h3: H3Index): Terrain | null {
  if (!surveyEnabled) return null;
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
