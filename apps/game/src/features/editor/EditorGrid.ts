/**
 * The bare grid, drawn so it can be painted (BRDC-MAP-EDIT-002).
 *
 * Fog of war is deliberate for a player: the map draws owned ground and its one-ring
 * neighbours and nothing else (claude.md §13). For someone *drawing* the map it is the
 * whole problem — the first editor asked people to paint hexes they could not see, one
 * at a time, and Infinite's verdict was the correct one.
 *
 * So the editor gets its own two layers, alive only while it is open: every hex in view
 * outlined, and the painted ones filled in the colour their ground will actually render.
 * Both are removed on close, so a player's map is never touched by this.
 */
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cellBoundary, cellsCoveringBBox } from '@es3/core';
import type { PaintedCell, TerrainKind } from '@es3/core';

const SOURCE = 'editor-grid';
const PAINTED = 'editor-painted';
export const GRID_LAYER = 'editor-grid-line';
export const PAINTED_LAYER = 'editor-painted-fill';

/**
 * Below this a res-11 mesh is finer than the screen's pixels, so drawing it is wasted work
 * whatever the cell count says. Above it, `cellsCoveringBBox`'s own cap is the real guard —
 * one honest limit rather than two that have to agree.
 */
export const GRID_MIN_ZOOM = 13;

/** The terrain colours, matched to how the ground reads on the map. */
const GROUND: Readonly<Record<TerrainKind, string>> = {
  plain: '#9a8f7a',
  forest: '#2f6b3a',
  hill: '#7a6a4a',
  mountain: '#6b6b78',
  lake: '#2a5c8a',
  coast: '#3a7fa8',
  market: '#b08a2a',
};

type Empty = { type: 'FeatureCollection'; features: [] };
const EMPTY: Empty = { type: 'FeatureCollection', features: [] };

function polygon(h3: string, properties: Record<string, unknown>) {
  const coords = cellBoundary(h3);
  return {
    type: 'Feature' as const,
    id: h3,
    properties,
    geometry: { type: 'Polygon' as const, coordinates: [[...coords, coords[0]]] },
  };
}

export function ensureEditorLayers(map: MapLibreMap): void {
  if (!map.getSource(SOURCE)) {
    map.addSource(SOURCE, { type: 'geojson', data: EMPTY });
    map.addLayer({
      id: GRID_LAYER,
      type: 'line',
      source: SOURCE,
      paint: { 'line-color': '#00ff88', 'line-width': 0.6, 'line-opacity': 0.35 },
    });
  }
  if (!map.getSource(PAINTED)) {
    map.addSource(PAINTED, { type: 'geojson', data: EMPTY });
    map.addLayer({
      id: PAINTED_LAYER,
      type: 'fill',
      source: PAINTED,
      paint: { 'fill-color': ['get', 'colour'], 'fill-opacity': 0.55 },
    });
    // Under the grid lines, so the mesh stays readable over a painted area.
    if (map.getLayer(GRID_LAYER)) map.moveLayer(PAINTED_LAYER, GRID_LAYER);
  }
}

export function removeEditorLayers(map: MapLibreMap): void {
  for (const id of [GRID_LAYER, PAINTED_LAYER]) if (map.getLayer(id)) map.removeLayer(id);
  for (const id of [SOURCE, PAINTED]) if (map.getSource(id)) map.removeSource(id);
}

/**
 * Redraw the mesh for what is on screen.
 *
 * Returns how many hexes were drawn, so the editor can say "zoom in" rather than showing
 * an empty screen and letting the person wonder whether it is broken. Zero means either
 * too far out or past the cell cap — the same answer either way: come closer.
 */
export function setGrid(map: MapLibreMap, zoom: number): number {
  const source = map.getSource(SOURCE);
  if (!source || !('setData' in source)) return 0;

  if (zoom < GRID_MIN_ZOOM) {
    (source as { setData: (d: unknown) => void }).setData(EMPTY);
    return 0;
  }
  const b = map.getBounds();
  const cells = cellsCoveringBBox({
    south: b.getSouth(),
    west: b.getWest(),
    north: b.getNorth(),
    east: b.getEast(),
  });
  (source as { setData: (d: unknown) => void }).setData({
    type: 'FeatureCollection',
    features: cells.map((h3) => polygon(h3, {})),
  });
  return cells.length;
}

/** Fill the painted hexes in the colour their ground will actually render. */
export function setPainted(map: MapLibreMap, cells: Readonly<Record<string, PaintedCell>>): void {
  const source = map.getSource(PAINTED);
  if (!source || !('setData' in source)) return;
  (source as { setData: (d: unknown) => void }).setData({
    type: 'FeatureCollection',
    features: Object.entries(cells).map(([h3, what]) =>
      polygon(h3, { colour: what.t ? GROUND[what.t] : '#ffd700' }),
    ),
  });
}
