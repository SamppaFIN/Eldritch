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
  CELL_MARK_SOURCE,
  CELL_DETAIL_MINZOOM,
  CELL_GROUND_LAYER,
  CELL_ICON_LAYER,
  CELL_BUILDING_LAYER,
  CELL_BOUNTY_LAYER,
  CELL_BOUNTY_BADGE_LAYER,
  CELL_LANDMARK_LAYER,
  CELL_FLAG_LAYER,
  CELL_ANOMALY_LAYER,
  CELL_NEIGHBOUR_DISC_LAYER,
  CELL_NEIGHBOUR_LAYER,
  CELL_STRENGTH_LAYER,
} from './layerIds.js';
import { slotTranslate } from './cellMarks.js';
import { bannerSpriteId } from './territoryImages.js';

/**
 * The symbol layers — every mark that stands on a cell rather than filling it: the
 * ground tile, the terrain glyph fallback, a Work, a bounty, a landmark, your flag,
 * an anomaly. Split out of `ensureTerritoryLayers` so that function's own job — the
 * polygon layers ownership and strength actually paint with — stays readable at a
 * glance; this one is thirteen near-identical `addLayer` calls and reads best as a
 * block of its own.
 */
/**
 * Where the find's sprite becomes legible, and so where the badge beneath it stops.
 *
 * The document collapses the find below 14 px. The sprite is registered at pixelRatio 2,
 * so on screen it is BOUNTY_PX × size ÷ 2. Two earlier versions got this wrong: the first
 * ignored the ÷ 2 (its "16 px" was 8), the second sized against a hex table half its real
 * size. Against the measured hex, 30% of its width reaches 14 px at zoom 15.
 */
const BOUNTY_SPRITE_MINZOOM = 15;

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
    source: CELL_MARK_SOURCE,
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
    source: CELL_MARK_SOURCE,
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
    source: CELL_MARK_SOURCE,
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
    source: CELL_MARK_SOURCE,
    // 14, not the usual detail floor: below this the badge layer draws instead (Sigil §03).
    minzoom: BOUNTY_SPRITE_MINZOOM,
    filter: ['!=', ['get', 'bounty'], ''],
    layout: {
      visibility: 'none',
      'icon-image': ['concat', 'bounty-', ['get', 'bounty']],
      // 64 × size on screen: 14 px at the floor, then 26 / 52 / 104 px — 30% of the hex —
      // capped at twice the raster's native size.
      'icon-size': ['interpolate', ['exponential', 2], ['zoom'], 15, 0.22, 16, 0.41, 17, 0.81, 18, 1.63, 19, 2],
      /* Lower-left, so the centre belongs to whatever stands on the hex (Sigil §03: "It
         stands at the lower-left while the structure holds the centre"). It sat upper-left
         where the neighbour badge now goes, which put two marks in one corner. */

      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
    // Lower-left from the slot table, in screen pixels, so it tracks the hex at every zoom.
    paint: { 'icon-opacity': 0.95, 'icon-translate': slotTranslate('southWest') },
  });

  /*
   * The same find, collapsed to a badge (Sigil §03).
   *
   * The document: *"Below 14px it collapses into a disc badge at the upper-right vertex,
   * same symbol, same hue."* The sprite clears 14 px on screen at zoom 15 (see
   * `BOUNTY_SPRITE_MINZOOM`), so this owns 13 → 15 beneath it. The two bands touch and
   * never overlap: one mark per find, always.
   *
   * A disc and no symbol, which is a stated departure. At zoom 13 a res-11 hex is about
   * eleven pixels across and at 15 about forty; a symbol inside a disc that size is a few
   * pixels of mush — smaller than the sprite it replaces, which defeats the rule itself.
   * The hue survives, and it is the find's resource colour, so the badge agrees with the
   * figure the panel prints. Colour is not carrying this alone: the mark's presence is
   * the information, and the panel names the find in words.
   */
  map.addLayer({
    id: CELL_BOUNTY_BADGE_LAYER,
    type: 'circle',
    source: CELL_MARK_SOURCE,
    minzoom: CELL_DETAIL_MINZOOM,
    maxzoom: BOUNTY_SPRITE_MINZOOM,
    filter: ['!=', ['get', 'bounty'], ''],
    paint: {
      'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 13, 2.5, 15, 5],
      'circle-color': ['get', 'bountyColor'],
      'circle-opacity': 0.9,
      // A dark rim, so a gold find still reads against bright ground.
      'circle-stroke-color': '#0a0612',
      'circle-stroke-width': 1,
      // Upper-right vertex. Screen pixels, y down — and small, because the hex is too.
      'circle-translate': slotTranslate('northEast'),
    },
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
    source: CELL_MARK_SOURCE,
    minzoom: CELL_DETAIL_MINZOOM,
    filter: ['!=', ['get', 'flag'], ''],
    layout: {
      'icon-image': bannerSpriteId('vesica'),
      /*
       * Your banner stands where a Work would — the two never share a cell — so it takes
       * the same bottom anchor on the hex centre. 35% of the measured hex: 64 × size on
       * screen, 30 / 61 / 122 px at zoom 16 / 17 / 18, capped at twice native. It was 8%
       * of the hex at zoom 19.
       */
      'icon-size': ['interpolate', ['exponential', 2], ['zoom'], 13, 0.06, 16, 0.47, 17, 0.95, 18, 1.9, 19, 2],
      'icon-anchor': 'bottom',
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
    source: CELL_MARK_SOURCE,
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
    source: CELL_MARK_SOURCE,
    minzoom: 16,
    filter: ['all', ['get', 'mine'], ['>', ['get', 'neighbours'], 0]],
    paint: {
      // §03: a dark disc with a faint rim, not a purple ring — the figure inside carries
      // the colour, and the owner stroke is the only purple line on the hex.
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 16, 9, 17, 11, 19, 16],
      'circle-color': '#0a0612',
      'circle-opacity': 0.9,
      'circle-stroke-color': '#3a3346',
      'circle-stroke-width': 1,
      'circle-translate': slotTranslate('northWest'),
    },
  });

  map.addLayer({
    id: CELL_NEIGHBOUR_LAYER,
    type: 'symbol',
    source: CELL_MARK_SOURCE,
    minzoom: 16,
    filter: ['all', ['get', 'mine'], ['>', ['get', 'neighbours'], 0]],
    layout: {
      'text-field': ['to-string', ['get', 'neighbours']],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 16, 10, 17, 12, 19, 17],
      'text-allow-overlap': true,
      'text-ignore-placement': false,
    },
    paint: {
      'text-color': '#00ff88', // --awareness-green, as §03 draws it
      'text-translate': slotTranslate('northWest'),
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
    source: CELL_MARK_SOURCE,
    minzoom: 16,
    filter: ['get', 'mine'],
    layout: {
      'text-field': ['to-string', ['round', ['get', 'strength']]],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 16, 11, 17, 14, 19, 20],
      'text-allow-overlap': true,
      'text-ignore-placement': false,
    },
    paint: {
      'text-color': '#f4f1f7',
      'text-halo-color': '#0a0612',
      'text-halo-width': 1.8,
      // Bottom centre, where §03 draws "340" — just inside the arc it reads out. Place
      // names moved to the north slot so this one is never shared ("THE 100 KEEP").
      'text-translate': slotTranslate('south'),
    },
  });

  map.addLayer({
    id: CELL_ANOMALY_LAYER,
    type: 'symbol',
    source: CELL_MARK_SOURCE,
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
