/**
 * The ground as a texture under the hex, Civilization-style (Infinite 2026-09-30, pointing at
 * a Civ V map: *"eri maastotyypeille eri tausta tekstuuri.. lovecraft teemainen.. läpinäkyvyys
 * ja subtle linear gradientteja, metallia, nestettä"*).
 *
 * One seamless tile per terrain, drawn as SVG and rasterised once into the atlas — the same
 * road `terrainSprites.ts` takes — and laid with `fill-pattern` under the ownership colour.
 * Seamless by construction: every gradient runs A → B → A across the tile, so its edges
 * meet their neighbours' edges, and every motif stays clear of the border.
 *
 * Hex literals, not tokens: the SVG is decoded by an `Image`, outside the document. The
 * hues are the palette's (`claude.md` §13) — void, cosmic purple, eldritch blue, cyan, gold,
 * awareness green — darkened into ground. This is atmosphere under the map, not a paint job.
 */
import type { TerrainKind } from '@es3/core';
import { rasteriseSvgs } from './spriteRaster.js';

export const TEXTURE_PX = 256;
export const textureId = (kind: TerrainKind): string => `tex-${kind}`;

/** A vertical A → B → A band, so the tile's top and bottom rows are the same colour. */
const band = (id: string, a: string, b: string, op = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
  `<stop offset="0" stop-color="${a}" stop-opacity="${op}"/><stop offset=".5" stop-color="${b}" stop-opacity="${op}"/>` +
  `<stop offset="1" stop-color="${a}" stop-opacity="${op}"/></linearGradient>`;

/** A soft sheen in the middle, gone to nothing well before the edge. */
const sheen = (id: string, c: string, op: number) =>
  `<radialGradient id="${id}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${c}" stop-opacity="${op}"/>` +
  `<stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;

const ground = (defs: string, body: string) =>
  `<defs>${defs}</defs><rect width="256" height="256" fill="url(#g)"/><rect width="256" height="256" fill="url(#s)"/>${body}`;

/** Deterministic scatter inside the tile's safe area, so no motif is cut at a seam. */
function scatter(n: number, seed: number): [number, number][] {
  const out: [number, number][] = [];
  let h = seed;
  for (let i = 0; i < n; i += 1) {
    h = (h * 1103515245 + 12345) % 2147483648;
    const x = 18 + (h % 220);
    h = (h * 1103515245 + 12345) % 2147483648;
    out.push([x, 18 + (h % 220)]);
  }
  return out;
}

const TEXTURE: Readonly<Record<TerrainKind, string>> = {
  // Dusk grass that is not quite grass: a wind that leaves the same strokes twice.
  plain: ground(
    band('g', '#24301e', '#1e2a1b') + sheen('s', '#9fbf7a', 0.06),
    `<g stroke="#a8c98a" stroke-opacity=".16" stroke-width="1.2" fill="none" stroke-linecap="round">` +
      scatter(22, 7).map(([x, y]) => `<path d="M${x} ${y} q6 -7 12 -2"/>`).join('') +
      `</g>`,
  ),
  // Roots under the moss, and something in the dark that glows back.
  forest: ground(
    band('g', '#0f2418', '#142c1e') + sheen('s', '#00ff88', 0.05),
    `<g stroke="#2f6b45" stroke-opacity=".55" stroke-width="2" fill="none" stroke-linecap="round">` +
      `<path d="M30 40 C70 70 50 120 96 140 S150 200 128 226"/><path d="M226 30 C190 70 210 110 170 130 S120 160 140 200"/>` +
      `<path d="M40 200 C70 180 90 196 110 170"/></g>` +
      scatter(16, 3).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#00ff88" fill-opacity=".38"/>`).join(''),
  ),
  // Slate with contour lines, and a cold metal sheen where the survey went wrong.
  hill: ground(
    band('g', '#2a2839', '#322e46') + sheen('s', '#d8d4ee', 0.1),
    `<g stroke="#b9b3d6" stroke-opacity=".22" stroke-width="1.1" fill="none">` +
      [26, 46, 66, 86].map((r) => `<ellipse cx="128" cy="128" rx="${r * 1.2}" ry="${r * 0.7}"/>`).join('') +
      `</g>`,
  ),
  // Basalt in facets, iron catching light along the breaks.
  mountain: ground(
    band('g', '#18161f', '#262334') + sheen('s', '#a9cbdb', 0.08),
    `<g fill="#6d6a8a" fill-opacity=".22" stroke="#a9cbdb" stroke-opacity=".3" stroke-width="1">` +
      `<polygon points="40,200 90,70 140,200"/><polygon points="120,210 170,90 220,210"/><polygon points="70,120 110,40 150,120"/></g>`,
  ),
  // Deep water with a slow whorl at the bottom of it — the lake is looking back.
  lake: ground(
    band('g', '#082233', '#0b2d40') + sheen('s', '#00d4ff', 0.12),
    `<g stroke="#00d4ff" stroke-opacity=".2" stroke-width="1.3" fill="none">` +
      [30, 54, 78].map((r) => `<ellipse cx="128" cy="128" rx="${r * 1.3}" ry="${r * 0.5}"/>`).join('') +
      `</g><path d="M128 128 m0 -18 a18 18 0 1 1 -14 7 a10 10 0 1 1 8 -3" stroke="#3aa0c8" stroke-opacity=".35" stroke-width="2" fill="none"/>` +
      `<ellipse cx="96" cy="84" rx="40" ry="10" fill="#ffffff" fill-opacity=".05"/>`,
  ),
  // The shore: pale foam on dark water, sand the colour of old paper.
  coast: ground(
    band('g', '#102c38', '#22302a') + sheen('s', '#cfe9f2', 0.07),
    `<g stroke="#cfe9f2" stroke-opacity=".24" stroke-width="1.4" fill="none" stroke-linecap="round">` +
      [60, 110, 160, 210].map((y) => `<path d="M24 ${y} q26 -10 52 0 t52 0 t52 0 t52 0"/>`).join('') +
      `</g>`,
  ),
  // A bog that breathes: bubbles rising, reeds that lean the wrong way.
  marsh: ground(
    band('g', '#142a21', '#1a3327') + sheen('s', '#7fe0b0', 0.07),
    scatter(12, 11).map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${2 + (i % 4)}" fill="none" stroke="#7fe0b0" stroke-opacity=".3"/>`).join('') +
      `<g stroke="#3fcf9a" stroke-opacity=".3" stroke-width="1.4" stroke-linecap="round">` +
      scatter(10, 5).map(([x, y]) => `<path d="M${x} ${y} l4 -16"/>`).join('') +
      `</g>`,
  ),
  // Old brick under soot, and a few windows still lit at an hour nobody keeps.
  settlement: ground(
    band('g', '#2a1616', '#321a19') + sheen('s', '#c9877a', 0.06),
    `<g stroke="#7a3a30" stroke-opacity=".32" stroke-width="1">` +
      [32, 64, 96, 128, 160, 192, 224].map((y) => `<path d="M16 ${y} H240"/>`).join('') +
      [40, 104, 168, 232].map((x, i) => [32, 96, 160].map((y) => `<path d="M${x - (i % 2) * 32} ${y} v32"/>`).join('')).join('') +
      `</g>` +
      scatter(7, 17).map(([x, y]) => `<rect x="${x}" y="${y}" width="4" height="5" fill="#ffd700" fill-opacity=".28"/>`).join(''),
  ),
  // Tarnished gold, stamped like an old coin whose face nobody can read.
  market: ground(
    band('g', '#33290f', '#3f3317') + sheen('s', '#ffd700', 0.1),
    `<g stroke="#ffd700" stroke-opacity=".2" stroke-width="1.1" fill="none">` +
      `<circle cx="128" cy="128" r="78"/><circle cx="128" cy="128" r="64"/><rect x="92" y="92" width="72" height="72" transform="rotate(45 128 128)"/>` +
      Array.from({ length: 24 }, (_, i) => `<path d="M128 50 v8" transform="rotate(${i * 15} 128 128)"/>`).join('') +
      `</g>`,
  ),
};

export const TEXTURE_KINDS = Object.keys(TEXTURE) as TerrainKind[];

export function textureSvg(kind: TerrainKind): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="${TEXTURE_PX}" height="${TEXTURE_PX}">${TEXTURE[kind]}</svg>`;
}

export async function rasteriseTextures(): Promise<Map<string, ImageData> | null> {
  return rasteriseSvgs(TEXTURE_KINDS, textureSvg, textureId, TEXTURE_PX);
}
