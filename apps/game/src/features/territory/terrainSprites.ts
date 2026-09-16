/**
 * The ground itself, as an isometric tile (Sigil §03, BRDC-SIGIL-002).
 *
 * Terrain was a text glyph — a club for forest, a tilde for water — which is a symbol
 * chart, not a place. The design document's answer is a plinth per terrain, and it is the
 * single change that makes the map read as a board somebody could stand on.
 *
 * **The construction rule, from the document, and every tile obeys it:** a 2:1 isometric
 * diamond, top face at full colour, left face at 42% black over it, right face at 22%,
 * and a hairline white top edge at 20%. A new terrain is a new topper, never a new
 * drawing recipe — which is why the plinth is one string here and not six.
 *
 * Rasterised once into MapLibre's image atlas, exactly the path `bannerSprites.ts` and
 * `buildingSprites.ts` already take: procedural SVG, no sheet in the repo, no CDN (§7).
 * Hex literals rather than `oklch()` or `var()` because this SVG is decoded by an
 * `Image`, outside the document, where neither resolves.
 */
import type { TerrainKind } from '@es3/core';
import { rasteriseSvgs } from './spriteRaster.js';

/** Rendered size, device pixels. One tile sits inside one res-11 hex. */
export const TERRAIN_PX = 64;

/** kind → the `map.addImage` name, stable so `hasImage` short-circuits a re-add. */
export const terrainSpriteId = (kind: TerrainKind): string => `ground-${kind}`;

/** The resource hues, from the colour law. Literals: see the file docstring. */
const TIMBER = '#5fae6a';
const STONE = '#a8b2c4';
const IRON = '#a9cbdb';
const FOOD = '#6fdc8c';
const GOLD = '#ffd700';
const WATER = '#00d4ff';

/**
 * The shared plinth. Four paths, one colour in — the whole iso library is this plus a
 * topper, which is what keeps fourteen tiles from becoming fourteen drawings.
 */
const plinth = (face: string): string =>
  `<path d="M32,29 L54,40 L32,51 L10,40 Z" fill="${face}"/>` +
  `<path d="M10,40 L32,51 L32,55 L10,44 Z" fill="#000" fill-opacity=".42"/>` +
  `<path d="M32,51 L54,40 L54,44 L32,55 Z" fill="#000" fill-opacity=".24"/>` +
  `<path d="M32,29 L54,40 L32,51 L10,40 Z" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width=".8"/>`;

/** One little iso block, for the things made of stacked rock. */
const block = (cx: number, cy: number, w: number, h: number, face: string): string =>
  `<path d="M${cx},${cy} L${cx + w},${cy + w / 2} L${cx},${cy + w} L${cx - w},${cy + w / 2} Z" fill="${face}"/>` +
  `<path d="M${cx - w},${cy + w / 2} L${cx},${cy + w} L${cx},${cy + w + h} L${cx - w},${cy + w / 2 + h} Z" fill="#000" fill-opacity=".4"/>` +
  `<path d="M${cx},${cy + w} L${cx + w},${cy + w / 2} L${cx + w},${cy + w / 2 + h} L${cx},${cy + w + h} Z" fill="#000" fill-opacity=".22"/>`;

/** A conifer as three stacked wedges — the shape reads at 20 px, the detail would not. */
const tree = (x: number, y: number, s: number): string =>
  `<path d="M${x},${y} l${-s},${-s * 2.3} l${s},${-0.7 * s} l${s},${0.7 * s} z" fill="${TIMBER}"/>` +
  `<path d="M${x},${y} l${s},${-s * 2.3} l${-s},${-0.7 * s} z" fill="#000" fill-opacity=".35"/>`;

/** A little roofed house — BRDC-TERRAIN-005's settlement topper, three strokes: body,
 *  roof, and the same shading `block` uses so it sits on the plinth the same way. */
const house = (x: number, y: number, s: number): string =>
  `<path d="M${x - s},${y} L${x + s},${y} L${x + s},${y - s} L${x - s},${y - s} Z" fill="#c9877a"/>` +
  `<path d="M${x - s - 1},${y - s} L${x},${y - s - s * 0.8} L${x + s + 1},${y - s} Z" fill="#8a3a30"/>` +
  `<path d="M${x - s},${y} L${x + s},${y} L${x + s},${y - s} L${x - s},${y - s} Z" fill="#000" fill-opacity=".18"/>`;

/**
 * What stands on each plinth. The plinth's own colour is the ground; the topper is what
 * the ground *is*.
 *
 * Mountain and hill share a family on purpose — the same rock, stacked higher — because
 * on a map read while walking, "that is the high ground" matters more than telling two
 * greys apart.
 */
const TILE: Readonly<Record<TerrainKind, string>> = {
  plain: `${plinth('#3a4a33')}<g stroke="${FOOD}" stroke-width="1.4" stroke-linecap="round" opacity=".9">
    <path d="M23,41 l0,-6"/><path d="M31,45 l0,-6"/><path d="M39,40 l0,-6"/><path d="M30,36 l0,-5"/></g>`,
  forest: `${plinth('#2f4433')}${tree(22, 40, 5)}${tree(41, 44, 6)}${tree(31, 48, 4.5)}`,
  hill: `${plinth('#3b3f4a')}${block(32, 24, 16, 9, STONE)}`,
  mountain: `${plinth('#34384a')}${block(32, 26, 17, 9, STONE)}${block(32, 12, 9, 6, IRON)}`,
  lake: `${plinth('#22354f')}<path d="M32,31 L51,40 L32,49 L13,40 Z" fill="${WATER}" fill-opacity=".55"/>
    <g stroke="#fff" stroke-opacity=".6" stroke-width="1.2" fill="none" stroke-linecap="round">
    <path d="M22,40 q4,-3 8,0 q4,3 8,0"/><path d="M26,45 q4,-3 8,0"/></g>`,
  coast: `${plinth('#26404a')}<path d="M32,31 L51,40 L32,49 L13,40 Z" fill="${WATER}" fill-opacity=".4"/>
    <path d="M32,29 L44,35 L32,41 L20,35 Z" fill="#c8b48a"/>
    <g stroke="#fff" stroke-opacity=".55" stroke-width="1.1" fill="none" stroke-linecap="round">
    <path d="M24,44 q4,-3 8,0 q4,3 8,0"/></g>`,
  market: `${plinth('#463a26')}<path d="M32,22 L50,31 L32,40 L14,31 Z" fill="${GOLD}" fill-opacity=".9"/>
    <path d="M32,22 L50,31 L32,40 Z" fill="#000" fill-opacity=".3"/>
    <g stroke="#5a4a2a" stroke-width="2.2" stroke-linecap="round">
    <path d="M16,32 l0,9"/><path d="M48,32 l0,9"/><path d="M32,41 l0,8"/></g>
    <circle cx="32" cy="31" r="2.6" fill="#fff" fill-opacity=".6"/>`,
  // BRDC-TERRAIN-005 — a water pool with reeds standing in it, no model in either design
  // document (the doc itself has no marsh tile).
  marsh: `${plinth('#233d38')}<path d="M26,42 L38,42 L34,48 L30,48 Z" fill="${WATER}" fill-opacity=".35"/>
    <g stroke="#3fcf9a" stroke-width="1.4" stroke-linecap="round" opacity=".9">
    <path d="M20,40 l-1,-6"/><path d="M20,40 l2,-5"/><path d="M44,39 l-1,-6"/><path d="M44,39 l2,-5"/></g>`,
  // Red-toned per the document's own pen law (§02: "red pen = built-up housing").
  settlement: `${plinth('#3a2422')}${house(23, 40, 6)}${house(40, 43, 5)}`,
};

export const TERRAIN_KINDS = Object.keys(TILE) as TerrainKind[];

export function terrainSvg(kind: TerrainKind): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${TERRAIN_PX}" height="${TERRAIN_PX}">` +
    `${TILE[kind]}</svg>`
  );
}

/**
 * Rasterise every tile to an `ImageData`, keyed by `terrainSpriteId`.
 *
 * `null` where there is no 2D canvas — a test runner — and the caller no-ops, so the map
 * falls back to the glyph layer rather than throwing. Real Chromium resolves.
 */
export async function rasteriseTerrain(): Promise<Map<string, ImageData> | null> {
  return rasteriseSvgs(TERRAIN_KINDS, terrainSvg, terrainSpriteId, TERRAIN_PX);
}
