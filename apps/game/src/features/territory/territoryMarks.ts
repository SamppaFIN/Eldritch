/**
 * The mark layers, split from TerritoryLayer.ts to clear the four-hundred-line ceiling
 * (BRDC-SIGIL-003).
 *
 * Import back into TerritoryLayer.ts, called once from `ensureTerritoryLayers`. Kept in
 * the territory folder rather than merged into `territoryImages.ts`: that file is *what
 * pictures exist*, this is *what layers draw them* — the same split that file's own
 * docstring already draws with TerritoryLayer.ts.
 */
import type { Map as MapLibreMap } from 'maplibre-gl';
import {
  CELL_SOURCE,
  CELL_DETAIL_MINZOOM,
  CELL_GROUND_LAYER,
  CELL_ICON_LAYER,
  CELL_BUILDING_LAYER,
  CELL_BOUNTY_LAYER,
  CELL_LANDMARK_LAYER,
  CELL_FLAG_LAYER,
  CELL_ANOMALY_LAYER,
  CELL_NEIGHBOUR_DISC_LAYER,
  CELL_NEIGHBOUR_LAYER,
  CELL_STRENGTH_LAYER,
} from './layerIds.js';
import { bannerSpriteId } from './territoryImages.js';
import { OWN_STROKE } from './territoryFeatures.js';

/**
 * The symbol layers — every mark that stands on a cell rather than filling it: the
 * ground tile, the terrain glyph fallback, a Work, a bounty, a landmark, your flag,
 * an anomaly. Split out of `ensureTerritoryLayers` so that function's own job — the
 * polygon layers ownership and strength actually paint with — stays readable at a
 * glance; this one is thirteen near-identical `addLayer` calls and reads best as a
 * block of its own.
 */
export function addMarkLayers(map: MapLibreMap): void {
  /*
   * What this ground is made of.
   *
   * A glyph, not a repaint. Ownership owns the fill of a hexagon; if terrain took it
   * over too, one colour would be answering two questions and a player could read
   * neither. The mark carries its meaning in shape and colour both — a plain circle
   * would leave the meaning in colour alone, which the accessibility rules forbid.
   * Shown on every visible cell (yours and the revealed ring), so "what is on the
   * next hex over" is answered without walking there. Nothing for plain ground.
   */
  /*
   * The ground itself, as an isometric tile (Sigil §03).
   *
   * Hidden until `addTerrainSprites` has actually put images in the atlas — a symbol
   * layer whose `icon-image` names nothing logs a warning per feature per frame, and a
   * player on a platform with no canvas would get that forever.
   *
   * Below everything: a Work stands *on* the ground, and the plinth is what it stands on.
   */
  map.addLayer({
    id: CELL_GROUND_LAYER,
    type: 'symbol',
    source: CELL_SOURCE,
    minzoom: CELL_DETAIL_MINZOOM,
    filter: ['!=', ['get', 'ground'], ''],
    layout: {
      visibility: 'none',
      'icon-image': ['concat', 'ground-', ['get', 'ground']],
      // Sized against the hex rather than against the icon: at zoom 17 a res-11 cell is
      // about eighty pixels across, and the tile should sit in it, not rattle around.
      'icon-size': ['interpolate', ['linear'], ['zoom'], 13, 0.34, 16, 0.75, 17, 1.05, 19, 2.2],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
    paint: { 'icon-opacity': 0.95 },
  });

  map.addLayer({
    id: CELL_ICON_LAYER,
    type: 'symbol',
    source: CELL_SOURCE,
    minzoom: CELL_DETAIL_MINZOOM,
    filter: ['!=', ['get', 'icon'], ''],
    layout: {
      /*
       * Off (Sigil §03: "Terrain never fills the hex").
       *
       * This letter was the terrain's first home, then the iso tiles replaced it and hid
       * it — so when the tiles stopped covering the hex, the letter came straight back.
       * The document's hex has no terrain mark at all: the ground is read on the cell
       * card, and what the map shows is whose it is, what stands on it, and what is
       * special about it. Left defined rather than deleted, like the tiles.
       */
      visibility: 'none',
      'text-field': ['get', 'icon'],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 13, 9, 17, 14, 19, 18],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': ['get', 'iconColor'],
      'text-halo-color': '#0a0612',
      'text-halo-width': 1.5,
      'text-opacity': 0.9,
    },
  });

  /*
   * The Work on this ground (BRDC-ART-002). Below the terrain glyph — anomaly is above,
   * this is below, so a cell can carry all three without them colliding. Colour is by
   * role (produce / store / knowledge / defence / culture); the glyph carries the meaning
   * too, so it reads without colour. On any owner's cell, unlike the anomaly mark.
   */
  map.addLayer({
    id: CELL_BUILDING_LAYER,
    type: 'symbol',
    source: CELL_SOURCE,
    minzoom: CELL_DETAIL_MINZOOM,
    filter: ['!=', ['get', 'building'], ''],
    layout: {
      'text-field': ['get', 'building'],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 13, 10, 17, 15, 19, 19],
      'text-offset': [0, 1.1],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': ['get', 'buildingColor'],
      'text-halo-color': '#0a0612',
      'text-halo-width': 2,
    },
  });

  /*
   * What this hex was found to hold (Sigil §03, BRDC-SIGIL-003). `''` unless the cell is
   * both mine and revealed — `cellProperties` does that gating, this layer only draws
   * what it is handed.
   *
   * Offset toward the upper-left, opposite the building glyph's downward offset, so a
   * farm standing on a wheat find shows both rather than one covering the other — the
   * design document's own convention: the structure holds the centre, the resource
   * stands beside it. Hidden until `addBountySprites` confirms the icons are actually in
   * the atlas, the same discipline as the ground layer.
   */
  map.addLayer({
    id: CELL_BOUNTY_LAYER,
    type: 'symbol',
    source: CELL_SOURCE,
    minzoom: CELL_DETAIL_MINZOOM,
    filter: ['!=', ['get', 'bounty'], ''],
    layout: {
      visibility: 'none',
      'icon-image': ['concat', 'bounty-', ['get', 'bounty']],
      'icon-size': ['interpolate', ['linear'], ['zoom'], 13, 0.3, 16, 0.6, 17, 0.85, 19, 1.5],
      'icon-offset': [-15, -14],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
    paint: { 'icon-opacity': 0.95 },
  });

  /*
   * Your banner on ground you hold that carries no building (BRDC-BANNER-001). The one
   * you picked in the Keep, drawn as an icon (field report 2026-09-06 — it used to be a
   * fixed glyph that never changed). Takes the building's spot; the two are never on the
   * same cell. `flag` is now just the presence marker the filter reads; the icon comes
   * from `setFlagBanner`.
   */
  map.addLayer({
    id: CELL_FLAG_LAYER,
    type: 'symbol',
    source: CELL_SOURCE,
    minzoom: CELL_DETAIL_MINZOOM,
    filter: ['!=', ['get', 'flag'], ''],
    layout: {
      'icon-image': bannerSpriteId('vesica'),
      'icon-size': ['interpolate', ['linear'], ['zoom'], 13, 0.28, 17, 0.5, 19, 0.7],
      'icon-offset': [0, 16],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
    paint: { 'icon-opacity': 0.85 },
  });

  /*
   * A landmark: a monument, a lighthouse, a village (BRDC-FX-002).
   *
   * Infinite: *"jos sulla on temppeli, niin se näkyy.. saa olla isompi kun se alkuperäinen
   * heksa.. korvaa siis koko heksa näillä."* So it does — centred with no offset, no halo
   * to shrink it, and sized to spill past the hex's own edges at walking zoom. A hex is
   * about eighty pixels across at zoom 17 and the ordinary Work glyph is fifteen; this one
   * is fifty-four, which is the difference between a speck and a place.
   *
   * Above the building layer, because a cell never has both: `cellProperties` blanks
   * `building` when it sets `landmark`.
   */
  map.addLayer({
    id: CELL_LANDMARK_LAYER,
    type: 'symbol',
    source: CELL_SOURCE,
    minzoom: CELL_DETAIL_MINZOOM,
    filter: ['!=', ['get', 'landmark'], ''],
    layout: {
      'text-field': ['get', 'landmark'],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 13, 20, 16, 40, 17, 54, 19, 96],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': ['get', 'landmarkColor'],
      // A thin dark rim rather than a halo: a 2 px halo on a 96 px glyph reads as grime.
      'text-halo-color': '#0a0612',
      'text-halo-width': 1,
      'text-opacity': 0.92,
    },
  });

  /*
   * An anomaly on your own ground (BRDC-EVENT-001). Above the terrain glyph and offset
   * up so the two do not sit on each other. `--mystic-cyan`, one colour — the glyph
   * carries the state (`◌` a site, `◐` under study, `✦` a chain), never colour alone.
   */
  /*
   * The neighbour count, upper-left (Sigil §03).
   *
   * `NEIGHBOUR_BONUS` made visible: how many of the six around this hex you already hold,
   * and so how much easier the next claim here will be. A disc rather than bare text,
   * because a lone digit on a map reads as part of the basemap.
   *
   * Two layers for one badge — MapLibre draws a circle and a label in separate layers —
   * translated by the same pixels so they stay a single mark. From zoom 16, where a hex
   * is finally wide enough to hold something in its corner.
   */
  map.addLayer({
    id: CELL_NEIGHBOUR_DISC_LAYER,
    type: 'circle',
    source: CELL_SOURCE,
    minzoom: 16,
    filter: ['all', ['get', 'mine'], ['>', ['get', 'neighbours'], 0]],
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 16, 7, 19, 11],
      'circle-color': '#0a0612',
      'circle-opacity': 0.72,
      'circle-stroke-color': OWN_STROKE,
      'circle-stroke-width': 1.2,
      'circle-translate': ['interpolate', ['linear'], ['zoom'], 16, ['literal', [-20, -16]], 19, ['literal', [-64, -52]]],
    },
  });

  map.addLayer({
    id: CELL_NEIGHBOUR_LAYER,
    type: 'symbol',
    source: CELL_SOURCE,
    minzoom: 16,
    filter: ['all', ['get', 'mine'], ['>', ['get', 'neighbours'], 0]],
    layout: {
      'text-field': ['to-string', ['get', 'neighbours']],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 16, 9, 19, 13],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': '#cdc7d6',
      'text-translate': ['interpolate', ['linear'], ['zoom'], 16, ['literal', [-20, -16]], 19, ['literal', [-64, -52]]],
    },
  });

  /*
   * The strength figure, under the arc it belongs to (Sigil §03, "strength · tier 2").
   *
   * The arc is the thing you read without looking; this is the thing you read when you do.
   * Colour and length never carry a fact alone (§14), and this is the other channel.
   */
  map.addLayer({
    id: CELL_STRENGTH_LAYER,
    type: 'symbol',
    source: CELL_SOURCE,
    minzoom: 16,
    filter: ['get', 'mine'],
    layout: {
      'text-field': ['to-string', ['round', ['get', 'strength']]],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 16, 10, 19, 15],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': '#f4f1f7',
      'text-halo-color': '#0a0612',
      'text-halo-width': 1.4,
      'text-translate': ['interpolate', ['linear'], ['zoom'], 16, ['literal', [0, 22]], 19, ['literal', [0, 74]]],
    },
  });

  map.addLayer({
    id: CELL_ANOMALY_LAYER,
    type: 'symbol',
    source: CELL_SOURCE,
    minzoom: CELL_DETAIL_MINZOOM,
    filter: ['!=', ['get', 'anomaly'], ''],
    layout: {
      'text-field': ['get', 'anomaly'],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 13, 11, 17, 17, 19, 22],
      'text-offset': [0, -1.1],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': '#00d4ff',
      'text-halo-color': '#0a0612',
      'text-halo-width': 2,
    },
  });
}
