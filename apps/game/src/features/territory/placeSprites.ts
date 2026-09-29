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
import { KEEP_BODY, TEMPLE_BODY } from './designSprites.js';

export type PlaceKind = RevealedPlace['kind'];

/** Same raster as a Work, so both sit at the same size on the same hex. */
export const PLACE_SPRITE_PX = 192;

export const PLACE_KINDS: readonly PlaceKind[] = ['temple', 'anchor'];

/** kind → the map-image name, stable so `hasImage` short-circuits a re-add. */
export const placeSpriteId = (kind: PlaceKind): string => `place-${kind}`;

/*
 * The Works Codex drawings (BRDC-ART-006): the Anchor Stone is the Hearth, and the Hearth
 * is the Keep (claude.md §10), so the Anchor draws as the Keep.
 */
const BODY: Readonly<Record<PlaceKind, string>> = { temple: TEMPLE_BODY, anchor: KEEP_BODY };

/** The full SVG string for one place. */
export function placeSvg(kind: PlaceKind): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 2 64 64" width="${PLACE_SPRITE_PX}" height="${PLACE_SPRITE_PX}">${BODY[kind]}</svg>`;
}

/**
 * Rasterise both, keyed by `placeSpriteId`. `null` where there is no 2D canvas — a test
 * runner — so the caller keeps the dot it already draws instead of throwing.
 */
export async function rasterisePlaces(): Promise<Map<string, ImageData> | null> {
  return rasteriseSvgs(PLACE_KINDS, placeSvg, placeSpriteId, PLACE_SPRITE_PX);
}
