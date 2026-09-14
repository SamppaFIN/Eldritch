/**
 * Everything this map has to put in its own image atlas (BRDC-SIGIL-002).
 *
 * Split out of `TerritoryLayer.ts` when the isometric ground tiles took it past four
 * hundred lines. The two files answer different questions: this one is *what pictures
 * exist*, that one is *what layers draw them*, and they change for different reasons — a
 * new sprite is art, a new layer is cartography.
 *
 * Every function here is idempotent through `map.hasImage`, which is the check rather
 * than a flag: a rebuilt map starts with an empty atlas and no memory of what was asked.
 */
import type { Map as MapLibreMap } from 'maplibre-gl';
import { BANNER_IDS } from '../nation/nation.js';
import type { BannerId } from '../nation/nation.js';
import { bannerSpriteId, rasteriseBanners } from '../nation/bannerSprites.js';
export { bannerSpriteId };
import { TERRAIN_KINDS, rasteriseTerrain, terrainSpriteId } from './terrainSprites.js';
import { CELL_FLAG_LAYER, CELL_GROUND_LAYER, CELL_ICON_LAYER } from './layerIds.js';
import { ENEMY_FILL, OWN_FILL } from './territoryFeatures.js';

/**
 * Draw the six banner icons into this map's atlas if they are not there yet
 * (BRDC-BANNER-001 field report). `map.hasImage` is the idempotency check, not a flag —
 * a rebuilt map starts with an empty atlas.
 */
export async function addBannerSprites(map: MapLibreMap): Promise<void> {
  if (BANNER_IDS.every((id) => map.hasImage(bannerSpriteId(id)))) return;
  const images = await rasteriseBanners();
  if (!images) return;
  for (const [id, data] of images) {
    if (!map.hasImage(id)) map.addImage(id, data, { pixelRatio: 2 });
  }
}

/**
 * Draw the isometric ground tiles into the atlas (Sigil §03, BRDC-SIGIL-002).
 *
 * Same idempotency as the banners, and the same failure mode: no canvas, no images, and
 * the map keeps the glyph layer instead of throwing. That fallback is why the glyph layer
 * still exists rather than being deleted.
 */
export async function addTerrainSprites(map: MapLibreMap): Promise<void> {
  if (TERRAIN_KINDS.every((k) => map.hasImage(terrainSpriteId(k)))) return;
  const images = await rasteriseTerrain();
  if (!images) return;
  for (const [id, data] of images) {
    if (!map.hasImage(id)) map.addImage(id, data, { pixelRatio: 2 });
  }
  // The tiles arrived, so the text glyphs are redundant: two marks for one fact on one
  // hex is the noise §12 warns about.
  if (map.getLayer(CELL_ICON_LAYER)) map.setLayoutProperty(CELL_ICON_LAYER, 'visibility', 'none');
  if (map.getLayer(CELL_GROUND_LAYER)) {
    map.setLayoutProperty(CELL_GROUND_LAYER, 'visibility', 'visible');
  }
}

/** Swap the flag layer's icon when the player picks a different banner in the Keep. */
export function setFlagBanner(map: MapLibreMap, bannerId: BannerId): void {
  if (map.getLayer(CELL_FLAG_LAYER)) {
    map.setLayoutProperty(CELL_FLAG_LAYER, 'icon-image', bannerSpriteId(bannerId));
  }
}

/**
 * A four-square checkerboard of your own colour and the fixed rival red, for a cell an
 * imported Wager and your own walking both claim (BRDC-WAGER-JSON-005).
 *
 * `fill-pattern` is the only way MapLibre tiles a fill, and it always wants a raster —
 * there is no vector escape hatch here the way §12 prefers for ceremony. One check
 * spells out "part yours, part theirs" with colours the map already teaches, so this
 * needs no third colour and no legend.
 */
export function sharedPatternImage(): { width: number; height: number; data: Uint8ClampedArray } {
  const size = 16;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { width: size, height: size, data: new Uint8ClampedArray(size * size * 4) };
  const half = size / 2;
  ctx.fillStyle = OWN_FILL;
  ctx.fillRect(0, 0, half, half);
  ctx.fillRect(half, half, half, half);
  ctx.fillStyle = ENEMY_FILL;
  ctx.fillRect(half, 0, half, half);
  ctx.fillRect(0, half, half, half);
  return ctx.getImageData(0, 0, size, size);
}
