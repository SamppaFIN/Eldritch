/**
 * The three chimneys as beacons (BRDC-CHIMNEY-001) — Tampere's factory chimneys, stood
 * around Härmälä on Infinite's call (2026-10-08: the testers walk there, and the map is one
 * for everyone), anchored on the Statue of the Boy like the city states and the tale.
 *
 * Each is a landmark: holding its hex pays culture like any other (LANDMARK-001). Holding
 * all three lights them, and the realm sees about a kilometre around them for good — the
 * Watchtower's sight, writ district-wide.
 *
 * Pure.
 */
import { cellAt, cellCentre } from '../geo/cells.js';
import { destination } from '../geo/project.js';
import type { HexSeedLandmark } from '../types/hexSeed.js';
import type { Cell, H3Index, LatLng } from '../types/domain.js';

/** The Statue of the Boy — `questSites.ts`'s own origin. */
const STATUE: LatLng = { lat: 61.47290805294704, lng: 23.725882485862012 };

export type ChimneyId = 'finlayson' | 'tampella' | 'frenckell';

export interface Chimney {
  id: ChimneyId;
  name: string;
  lore: string;
  h3: H3Index;
}

const at = (bearing: number, m: number): H3Index => cellAt(destination(STATUE, bearing, m));

export const CHIMNEYS: readonly Chimney[] = [
  { id: 'finlayson', name: 'Finlayson Chimney', lore: 'The mill stopped in 1995. The chimney did not get the letter.', h3: at(20, 450) },
  { id: 'tampella', name: 'Tampella Chimney', lore: 'It still breathes on cold mornings, and nothing below it is burning.', h3: at(140, 550) },
  { id: 'frenckell', name: 'Frenckell Chimney', lore: 'Paper was made here. Some of it is still being written on.', h3: at(265, 400) },
];

/** About a kilometre: a res-11 hex is ~43 m across. */
export const CHIMNEY_SIGHT_RINGS = 23;

export const chimneyAt = (h3: H3Index): Chimney | null => CHIMNEYS.find((c) => c.h3 === h3) ?? null;

/** A chimney as the landmark rules read one. */
export function chimneyLandmark(h3: H3Index): HexSeedLandmark | null {
  const c = chimneyAt(h3);
  return c ? { name: c.name, osmId: '', lore: c.lore, kind: 'chimney', authored: true } : null;
}

/** All three held: the beacons are lit. */
export const chimneysLit = (owned: readonly Cell[]): boolean => {
  const held = new Set(owned.map((c) => c.h3));
  return CHIMNEYS.every((c) => held.has(c.h3));
};

/** The hex the lit beacons see from: the middle of the three. */
export function chimneyCentre(): H3Index {
  const pts = CHIMNEYS.map((c) => cellCentre(c.h3));
  return cellAt({ lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length, lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length });
}
