/**
 * The strength arcs, drawn along the bottom of every cell you hold (Sigil §03).
 *
 * The document: *"Fills the lower three edges clockwise, 0→500. Green healthy, gold under
 * 200, red pulsing inside the decay window. Legible peripherally, ignorable otherwise."*
 *
 * Its own source and line layer rather than a property on `cells`: the arc is a different
 * *shape* from the hexagon — a partial run along three of six edges — so it cannot ride
 * the polygon's own paint. The geometry is `strengthArc` in core, which is pure and
 * tested; this file is only the colour rule and the wiring.
 *
 * Own ground only. A rival's strength is their business, and drawing arcs on ground the
 * player cannot act on is the "wall of glyphs" the map has already been cleaned of once.
 */
import { MAX_STRENGTH, fortified, hoursUntilReleased, isCityState, strengthArc } from '@es3/core';
import type { Cell } from '@es3/core';
import type { FeatureCollection, LineString } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';

export const ARC_SOURCE = 'cell-arcs';
export const ARC_LAYER = 'cell-arcs-line';

/** Below this the hex is a few pixels across and an arc on it is noise, not information. */
const ARC_MINZOOM = 15;

/* The document's three colours, as literals: MapLibre parses paint values itself and has
   never heard of a custom property (the same reason `MAP_RESOURCE_COLOUR` exists). */
const HEALTHY = '#4ade80'; /* --awareness-green */
const LOW = '#ffd700'; /* --sacred-gold, under 200 */
const DECAYING = '#e05252'; /* --danger, inside the decay window */

/** Green healthy, gold under 200, red once the Void has a claim on it. */
export function arcInk(cell: Cell, now: number, underFortress = false): string {
  // Ground that cannot be lost is never a warning — a city state has no decay clock, and
  // ground under a Fortress does not decay at all (BRDC-BUILD-012).
  if (!underFortress && !isCityState(cell.ownerId) && hoursUntilReleased(cell.strength) - (now - cell.lastVisitedAt) / 3_600_000 <= 24) {
    return DECAYING;
  }
  return cell.strength < 200 ? LOW : HEALTHY;
}

export function arcsToGeoJson(
  cells: readonly Cell[],
  me: string | null,
  now: number,
): FeatureCollection<LineString> {
  const features = [];
  const byH3 = new Map(cells.map((c) => [c.h3, c]));
  for (const cell of cells) {
    if (me === null || cell.ownerId !== me) continue;
    const line = strengthArc(cell.h3, cell.strength / MAX_STRENGTH);
    if (!line) continue;
    features.push({
      type: 'Feature' as const,
      id: cell.h3,
      properties: { ink: arcInk(cell, now, fortified(byH3, cell.h3)) },
      geometry: { type: 'LineString' as const, coordinates: line },
    });
  }
  return { type: 'FeatureCollection', features };
}

export function ensureArcLayer(map: MapLibreMap, beneath?: string): void {
  if (map.getSource(ARC_SOURCE)) return;
  map.addSource(ARC_SOURCE, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });
  map.addLayer(
    {
      id: ARC_LAYER,
      type: 'line',
      source: ARC_SOURCE,
      minzoom: ARC_MINZOOM,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ['get', 'ink'],
        // Thick enough to read at the edge of vision, which is the whole brief — and in
        // proportion to the hex, which doubles each zoom (radius measured in cellMarks.ts).
        // §03 draws it at about a twelfth of the radius; floored for walking zoom, capped
        // before it becomes a band.
        'line-width': ['interpolate', ['exponential', 2], ['zoom'], 15, 2.5, 16, 3.5, 17, 7, 18, 12],
        'line-opacity': 0.95,
      },
    },
    beneath,
  );
}

export function setArcData(
  map: MapLibreMap,
  cells: readonly Cell[],
  me: string | null,
  now: number,
): void {
  const source = map.getSource(ARC_SOURCE);
  if (source && 'setData' in source) {
    (source as { setData: (d: FeatureCollection<LineString>) => void }).setData(
      arcsToGeoJson(cells, me, now),
    );
  }
}
