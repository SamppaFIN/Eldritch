/**
 * The Temple and the Anchor Stone as structures, not dots (Sigil §03, BRDC-SIGIL-006).
 *
 * Infinite, pointing at a temple hex: *"ei ole isometristä temppelin kuvaa.."* — there was
 * no picture at all. A place was a gold circle and a name while every Work on the map stood
 * as an isometric block, so the rarer and more important thing was the one drawn as the
 * least. §03 draws the Temple as the hex's structure, and it is explicit about the glow:
 * *"Temple & Anchor — the only two objects allowed a glow. Temple carries a sacred-gold
 * spark, the Anchor Stone an awareness-green core. If it glows, it is sacred."*
 *
 * Same construction as `buildingSprites.ts` — procedural SVG, rasterised once into the
 * map's atlas, no sprite sheet — so a Temple sits in the same drawn world as a Sawmill.
 * The Anchor is the Platonic solid `claude.md` §12 names for it: an octahedron.
 */
import type { RevealedPlace } from '@es3/core';
import { rasteriseSvgs } from './spriteRaster.js';

export type PlaceKind = RevealedPlace['kind'];

/** Same raster as a Work, so both sit at the same size on the same hex. */
export const PLACE_SPRITE_PX = 192;

export const PLACE_KINDS: readonly PlaceKind[] = ['temple', 'anchor'];

/** kind → the map-image name, stable so `hasImage` short-circuits a re-add. */
export const placeSpriteId = (kind: PlaceKind): string => `place-${kind}`;

/** The low stone slab both stand on. Top rhombus and two faces, y 36–60. */
const SLAB =
  '<path d="M32 36 L54 46 L32 56 L10 46 Z" fill="#4a3d63"/>' +
  '<path d="M10 46 L32 56 L32 60 L10 50 Z" fill="#2a2140"/>' +
  '<path d="M54 46 L32 56 L32 60 L54 50 Z" fill="#372c4f"/>';

/** Columns under a pyramid roof, with the sacred-gold spark above it. */
const TEMPLE =
  SLAB +
  '<rect x="18" y="29" width="4" height="20" fill="#cfc6e2"/>' +
  '<rect x="30" y="31" width="4" height="22" fill="#e8e2f3"/>' +
  '<rect x="42" y="29" width="4" height="20" fill="#cfc6e2"/>' +
  '<path d="M12 26 L32 35 L32 38 L12 29 Z" fill="#6e5d94"/>' +
  '<path d="M52 26 L32 35 L32 38 L52 29 Z" fill="#8a78b3"/>' +
  '<path d="M32 9 L12 26 L32 35 Z" fill="#8f7cb8"/>' +
  '<path d="M32 9 L52 26 L32 35 Z" fill="#b3a3d8"/>' +
  '<circle cx="32" cy="4.5" r="4.5" fill="#ffd700" opacity="0.35" stroke="none"/>' +
  '<circle cx="32" cy="4.5" r="2.4" fill="#ffd700"/>';

/** An octahedron over the slab, with the awareness-green core showing through it. */
const ANCHOR =
  SLAB +
  '<path d="M32 6 L17 27 L32 33 Z" fill="#3e8f6b"/>' +
  '<path d="M32 6 L47 27 L32 33 Z" fill="#6fd6a4"/>' +
  '<path d="M17 27 L32 33 L32 50 Z" fill="#2f6e52"/>' +
  '<path d="M47 27 L32 33 L32 50 Z" fill="#57b98a"/>' +
  '<circle cx="32" cy="29" r="6" fill="#00ff88" opacity="0.4" stroke="none"/>' +
  '<circle cx="32" cy="29" r="3" fill="#00ff88"/>';

const BODY: Readonly<Record<PlaceKind, string>> = { temple: TEMPLE, anchor: ANCHOR };

/** The full SVG string for one place. */
export function placeSvg(kind: PlaceKind): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${PLACE_SPRITE_PX}" height="${PLACE_SPRITE_PX}">` +
    `<g stroke="#0a0612" stroke-width="1" stroke-linejoin="round">${BODY[kind]}</g></svg>`
  );
}

/**
 * Rasterise both, keyed by `placeSpriteId`. `null` where there is no 2D canvas — a test
 * runner — so the caller keeps the dot it already draws instead of throwing.
 */
export async function rasterisePlaces(): Promise<Map<string, ImageData> | null> {
  return rasteriseSvgs(PLACE_KINDS, placeSvg, placeSpriteId, PLACE_SPRITE_PX);
}
