/**
 * The realm's outer border, drawn as one line below zoom 14 (BRDC-PERF-004).
 *
 * Per-hex strokes start at `CELL_DETAIL_MINZOOM`; below it a thousand hex outlines were a
 * smear that still cost a thousand lines. Zoomed out, the fill says where the ground is
 * and this one outline says where it ends. It hands over to the per-hex strokes at the
 * same zoom they begin, so there is no gap and no double line.
 */
import type { Map as MapLibreMap } from 'maplibre-gl';
import { realmOutline } from '@es3/core';
import type { Cell, PlayerId } from '@es3/core';
import { CELL_DETAIL_MINZOOM, NATION_FADE_START } from './layerIds.js';
import { OWN_STROKE } from './territoryFeatures.js';

export const REALM_SOURCE = 'realm-outline';
export const REALM_LINE_LAYER = 'realm-outline-line';

export function ensureRealmOutline(map: MapLibreMap): void {
  if (map.getSource(REALM_SOURCE)) return;
  map.addSource(REALM_SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({
    id: REALM_LINE_LAYER,
    type: 'line',
    source: REALM_SOURCE,
    minzoom: NATION_FADE_START,
    maxzoom: CELL_DETAIL_MINZOOM,
    paint: { 'line-color': OWN_STROKE, 'line-width': 1.5, 'line-opacity': 0.9 },
  });
}

let sent: unknown = null;
let pending: { cells: readonly Cell[]; me: PlayerId | null } | null = null;
let listening: { map: MapLibreMap; onZoom: () => void } | null = null;

const later = (f: () => void): number => {
  const w = globalThis as unknown as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number };
  return w.requestIdleCallback ? w.requestIdleCallback(f, { timeout: 2_000 }) : window.setTimeout(f, 200);
};

function draw(map: MapLibreMap): void {
  const source = map.getSource(REALM_SOURCE) as { setData?: (d: unknown) => void } | undefined;
  if (!source?.setData || !pending) return;
  const { cells, me } = pending;
  pending = null;
  const coordinates = realmOutline(me === null ? [] : cells.filter((c) => c.ownerId === me).map((c) => c.h3));
  if (coordinates === sent) return;
  sent = coordinates;
  source.setData({
    type: 'FeatureCollection',
    features: coordinates.length === 0 ? [] : [{ type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates } }],
  });
}

/**
 * The outline of the cells `me` holds among `cells`. Merging five thousand hexes is not
 * free, and the line only shows below zoom 14 — so it is worked out only when it would be
 * seen, in an idle moment, and caught up the next time the camera zooms out.
 */
export function setRealmOutline(map: MapLibreMap, cells: readonly Cell[], me: PlayerId | null): void {
  pending = { cells, me };
  if (listening?.map !== map) {
    const onZoom = () => {
      if (pending && map.getZoom() < CELL_DETAIL_MINZOOM) later(() => draw(map));
    };
    map.on('zoomend', onZoom);
    listening = { map, onZoom };
  }
  if (map.getZoom() < CELL_DETAIL_MINZOOM) later(() => draw(map));
}

export function removeRealmOutline(map: MapLibreMap): void {
  if (map.getLayer(REALM_LINE_LAYER)) map.removeLayer(REALM_LINE_LAYER);
  if (map.getSource(REALM_SOURCE)) map.removeSource(REALM_SOURCE);
  sent = null;
  pending = null;
  if (listening) listening.map.off('zoomend', listening.onZoom);
  listening = null;
}
