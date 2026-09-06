/**
 * A small isometric icon per Work, drawn on its cell (BRDC-ART-003).
 *
 * ART-002 marked a built hex with one role glyph; the field asked for the buildings
 * themselves, all of them, told apart at a glance. These are procedural SVGs — a shared
 * isometric block plus a per-building topper — rasterised once with `map.addImage` and
 * placed by `BuildingIconLayer`. No sprite sheet in the repo, no CDN (`claude.md` §7).
 *
 * Kept deliberately flat: two faces and a cap, role-tinted. A map data mark reads at
 * 20 px in daylight, and detail there is noise. §12's stroke-SVG ceremony is for the
 * claim burst, not this.
 */
import type { BuildingId } from '@es3/core';
import { BUILDING_ROLE } from './buildingGlyphs.js';
import type { BuildingRole } from './buildingGlyphs.js';

/** Rendered size of each sprite, device pixels. Small — it sits inside one res-11 hex. */
export const SPRITE_PX = 44;

/** id → the map-image name, stable so `hasImage` short-circuits a re-add. */
export const spriteId = (id: BuildingId): string => `work-${id}`;

/** Light face, dark face, outline — from the same hexes the role glyph already uses. */
const ROLE_INK: Readonly<Record<BuildingRole, [string, string, string]>> = {
  produce: ['#8fd07a', '#4f7a43', '#0a0612'],
  store: ['#cfc7b6', '#8a8272', '#0a0612'],
  knowledge: ['#f0c65e', '#a9832f', '#0a0612'],
  defence: ['#e46a6a', '#9a3535', '#0a0612'],
  culture: ['#eca6c1', '#a25f7c', '#0a0612'],
};

/**
 * Per-building topper, drawn above the shared block (which fills y 16–56). Each is one
 * or two shapes in `{{f}}` (light) / `{{d}}` (dark) placeholders so the tint is applied
 * once. Distinct silhouettes: a saw disc, a pick, furrows, crenellations, a dome…
 */
const CAP: Readonly<Record<BuildingId, string>> = {
  granary: '<ellipse cx="32" cy="14" rx="13" ry="7" fill="{{f}}"/><rect x="19" y="14" width="26" height="6" fill="{{d}}"/>',
  monument: '<path d="M32 2 L38 20 L26 20 Z" fill="{{f}}"/>',
  storehouse: '<rect x="16" y="9" width="32" height="9" rx="2" fill="{{f}}"/>',
  market: '<path d="M14 16 L32 6 L50 16 Z" fill="{{f}}"/><path d="M14 16 L50 16 L46 22 L18 22 Z" fill="{{d}}"/>',
  sawmill: '<circle cx="32" cy="12" r="9" fill="none" stroke="{{f}}" stroke-width="3"/><path d="M32 3 v18 M23 12 h18" stroke="{{d}}" stroke-width="2"/>',
  lumbermill: '<circle cx="25" cy="12" r="7" fill="none" stroke="{{f}}" stroke-width="3"/><circle cx="41" cy="14" r="6" fill="none" stroke="{{d}}" stroke-width="3"/>',
  mine: '<path d="M18 18 Q32 2 46 18" fill="none" stroke="{{f}}" stroke-width="4"/><path d="M30 16 h4 v8 h-4 Z" fill="{{d}}"/>',
  quarry: '<path d="M16 20 h10 v-6 h10 v-6 h10" fill="none" stroke="{{f}}" stroke-width="4"/>',
  farm: '<path d="M14 12 h36 M14 18 h36 M14 24 h36" stroke="{{f}}" stroke-width="3"/>',
  fishery: '<path d="M14 14 q6 -8 12 0 q6 8 12 0 q6 -8 12 0" fill="none" stroke="{{f}}" stroke-width="3"/>',
  vineyard: '<circle cx="26" cy="12" r="4" fill="{{f}}"/><circle cx="34" cy="10" r="4" fill="{{f}}"/><circle cx="30" cy="18" r="4" fill="{{d}}"/>',
  library: '<path d="M16 20 A16 16 0 0 1 48 20 Z" fill="{{f}}"/><rect x="16" y="20" width="32" height="4" fill="{{d}}"/>',
  'temple-grove': '<path d="M32 2 L44 22 L20 22 Z" fill="{{f}}"/><rect x="29" y="20" width="6" height="6" fill="{{d}}"/>',
  lighthouse: '<path d="M26 22 L28 4 L36 4 L38 22 Z" fill="{{f}}"/><path d="M12 8 L24 6 M52 8 L40 6" stroke="{{d}}" stroke-width="2"/>',
  fortress: '<path d="M16 22 v-10 h5 v5 h5 v-5 h5 v5 h5 v-5 h5 v10 Z" fill="{{f}}"/>',
};

/** The shared isometric block: a top rhombus and two side faces, y 16–56. */
const BLOCK =
  '<path d="M32 20 L52 31 L32 42 L12 31 Z" fill="{{f}}"/>' +
  '<path d="M12 31 L32 42 L32 58 L12 47 Z" fill="{{d}}"/>' +
  '<path d="M52 31 L32 42 L32 58 L52 47 Z" fill="{{f}}"/>';

/** The full SVG string for one building. */
export function spriteSvg(id: BuildingId): string {
  const [f, d, ink] = ROLE_INK[BUILDING_ROLE[id]];
  const body = (CAP[id] + BLOCK).replaceAll('{{f}}', f).replaceAll('{{d}}', d);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${SPRITE_PX}" height="${SPRITE_PX}">` +
    `<g stroke="${ink}" stroke-width="1" stroke-linejoin="round">${body}</g></svg>`
  );
}

/**
 * Rasterise every sprite to an `ImageData`, keyed by `spriteId`.
 *
 * Async because an `<img>` must decode first. Returns `null` on a platform without a 2D
 * canvas (a test runner) so the caller can no-op rather than throw. Real Chromium — the
 * game, and Playwright — always resolves it.
 */
export async function rasteriseSprites(): Promise<Map<string, ImageData> | null> {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_PX;
  canvas.height = SPRITE_PX;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const out = new Map<string, ImageData>();
  const ids = Object.keys(CAP) as BuildingId[];
  await Promise.all(
    ids.map(async (id) => {
      const img = new Image(SPRITE_PX, SPRITE_PX);
      img.src = `data:image/svg+xml;utf8,${encodeURIComponent(spriteSvg(id))}`;
      try {
        await img.decode();
      } catch {
        return;
      }
      ctx.clearRect(0, 0, SPRITE_PX, SPRITE_PX);
      ctx.drawImage(img, 0, 0, SPRITE_PX, SPRITE_PX);
      out.set(spriteId(id), ctx.getImageData(0, 0, SPRITE_PX, SPRITE_PX));
    }),
  );
  return out.size > 0 ? out : null;
}
