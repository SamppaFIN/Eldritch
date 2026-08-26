/**
 * The basemap style, written by hand rather than fetched.
 *
 * v2 drew raster OpenStreetMap tiles and looked like a map application with a theme
 * bolted on — ANALYSIS.md calls it the weakest part of its presentation. Vector tiles
 * can be recoloured, so this is the void with roads faintly scratched into it.
 *
 * Hand-writing the style rather than pulling a published one means no style JSON is
 * fetched at runtime, only tiles, and every colour here traces back to a design token.
 * MapLibre parses CSS colours but not `var()`, so the tokens are inlined with the name
 * they came from. If tokens.css changes, these change with it.
 *
 * NETWORK: tiles.openfreemap.org is the ONLY external host the game contacts in
 * Phases 0-2. It is keyless and free, which is why it was chosen over MapTiler (needs
 * a key, and a key in a static site is a published key) and Mapbox (paid).
 */
import type { StyleSpecification } from 'maplibre-gl';

export const TILE_HOST = 'https://tiles.openfreemap.org';

/** Palette, inlined from packages/ui/src/styles/tokens.css. */
const C = {
  void: '#0a0612', // --void-black
  water: '#0d1424', // --eldritch-blue, darkened
  green: '#0d1410', // parks: barely there
  building: '#150e21',
  buildingEdge: '#1e1430',
  road: '#241733', // --cosmic-purple, deep
  roadMajor: '#31204a',
  rail: '#1a1228',
  label: '#8b7fa0',
  labelHalo: '#0a0612',
} as const;

/**
 * Zoom-interpolated line width. Roads should be hairlines when you are looking at the
 * city and legible when you are standing on one.
 */
const width = (z10: number, z16: number, z18: number) =>
  ['interpolate', ['linear'], ['zoom'], 10, z10, 16, z16, 18, z18] as unknown as number;

export function createMapStyle(): StyleSpecification {
  return {
    version: 8,
    // Glyphs are needed for the few labels we keep. Sprites are not: there are no
    // basemap icons in this style at all.
    glyphs: `${TILE_HOST}/fonts/{fontstack}/{range}.pbf`,
    sources: {
      openmaptiles: {
        type: 'vector',
        url: `${TILE_HOST}/planet`,
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': C.void },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        paint: { 'fill-color': C.water, 'fill-opacity': 0.9 },
      },
      {
        id: 'park',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'park',
        paint: { 'fill-color': C.green, 'fill-opacity': 0.7 },
      },
      {
        id: 'building',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 14,
        paint: {
          'fill-color': C.building,
          'fill-outline-color': C.buildingEdge,
          // Buildings fade in rather than snapping on at z14.
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0, 16, 0.85],
        },
      },
      {
        id: 'rail',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['==', ['get', 'class'], 'rail'],
        minzoom: 12,
        paint: { 'line-color': C.rail, 'line-width': width(0.5, 1.5, 2) },
      },
      {
        id: 'road-minor',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'path', 'track']]],
        minzoom: 12,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': C.road, 'line-width': width(0.4, 2, 5) },
      },
      {
        id: 'road-major',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: [
          'in',
          ['get', 'class'],
          ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary']],
        ],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': C.roadMajor, 'line-width': width(1, 4, 9) },
      },
      /*
       * Labels: place names only, no street names.
       *
       * A player walking with the phone in one hand needs to know which district they
       * are in, not what the road is called — they can see the road. Street labels turn
       * the void into a satnav, which is the look this style exists to avoid.
       */
      {
        id: 'place-label',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['city', 'town', 'village', 'suburb']]],
        maxzoom: 15,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 8, 11, 14, 14],
          'text-letter-spacing': 0.12,
          'text-transform': 'uppercase',
          'text-max-width': 8,
        },
        paint: {
          'text-color': C.label,
          'text-halo-color': C.labelHalo,
          'text-halo-width': 1.5,
          'text-opacity': 0.75,
        },
      },
    ],
  };
}
