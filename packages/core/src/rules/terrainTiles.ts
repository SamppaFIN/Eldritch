/**
 * Real terrain from the vector tiles under a point (BRDC-TERRAIN-002).
 *
 * Split out of `terrain.ts` in BRDC-TERRAIN-004, when the OSM tag rules grew past what a
 * table of seven terrains wanted to carry. `terrain.ts` says what each kind *gives*;
 * this file says how to recognise one on a real map. The two change for different
 * reasons — a yield is balance, a tag is cartography — so they are now different files.
 */
import type { TerrainKind } from './terrain.js';

export interface TileFeature {
  /** The tile source-layer, e.g. `water`, `landcover`, `landuse`, `poi`. */
  sourceLayer?: string;
  /** `null` is allowed so a raw MapLibre feature list can be passed straight in. */
  properties?: Record<string, unknown> | null;
}

const has = (set: readonly string[], value: unknown): boolean =>
  typeof value === 'string' && set.includes(value);

/**
 * Read a kind out of the vector-tile features under a point, or `null` when the tiles say
 * nothing and the hash should stand in.
 *
 * Tolerant of the common OpenMapTiles-style schema: a `sourceLayer` plus a `class` /
 * `subclass` / `natural` / `landuse` property. Order matters — water and coastline are
 * checked before land cover, because a shoreline feature carries both.
 *
 * Hill and mountain come from tags, not elevation — the tiles carry no height model
 * (`BRDC-TERRAIN-002`: "ei korkeusdataa"). `natural=peak|cliff|ridge` is a mountain;
 * scrub, heath and moor read as hill. It is a guess, and the hash covers where it is
 * wrong.
 */
export function terrainFromTiles(features: readonly TileFeature[]): TerrainKind | null {
  const tags = features.map((f) => ({
    layer: f.sourceLayer ?? '',
    p: f.properties ?? {},
  }));

  const any = (test: (t: { layer: string; p: Record<string, unknown> }) => boolean) =>
    tags.some(test);

  if (any(({ layer, p }) => layer === 'water' && has(['ocean', 'sea'], p.class)) ||
      any(({ p }) => has(['coastline'], p.natural))) {
    return 'coast';
  }
  if (any(({ layer, p }) => layer === 'water' || layer === 'waterway' || has(['water'], p.natural))) {
    return 'lake';
  }
  // A peak or a ridge is a mountain; bare rock is not. In Finland `natural=rock` is the
  // commonest natural feature there is — every yard outcrop and the whole Pyynikki ridge —
  // and reading it as a mountain paid iron for walking over a boulder. Bare rock is where
  // stone is quarried, so it is hill country. An iron mine still needs a mountain.
  if (any(({ p }) => has(['peak', 'ridge', 'volcano', 'arete'], p.natural))) {
    return 'mountain';
  }
  if (any(({ p }) => has(['rock', 'bare_rock', 'scree', 'cliff', 'stone'], p.natural))) {
    return 'hill';
  }
  if (any(({ layer, p }) =>
    (layer === 'landcover' || layer === 'landuse') && has(['wood', 'forest'], p.class ?? p.subclass) ||
    has(['wood'], p.natural))) {
    return 'forest';
  }
  if (any(({ p }) => has(['scrub', 'heath', 'fell', 'moor'], p.natural))) {
    return 'hill';
  }
  // Field country. Returned explicitly rather than falling through to `null`, because a
  // field is a reading of the ground, not the absence of one — `null` would hand the hex
  // back to the hash and a farm could come out a lake. Plain pays nothing by itself; what
  // makes a field worth walking is the wheat or the granite found on it (`BOUNTIES`).
  if (any(({ p }) =>
    has(['farmland', 'farm', 'orchard', 'vineyard', 'allotments'], p.landuse ?? p.class) ||
    has(['grassland', 'meadow'], p.natural) ||
    has(['meadow'], p.landuse ?? p.class))) {
    return 'plain';
  }
  if (any(({ layer, p }) =>
    layer === 'poi' && has(['marketplace'], p.class ?? p.subclass) ||
    has(['commercial', 'retail'], p.landuse ?? p.class) ||
    typeof p.shop === 'string')) {
    return 'market';
  }
  return null;
}
