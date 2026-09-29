/**
 * The Works Codex buildings, drawn for the map (BRDC-ART-006).
 *
 * Claude Design's source symbols (`bdFarm`, `bdForge`…) were not handed over, so these are
 * drawn from the Codex pages' own renders to the same iso rule: a dark diamond plinth,
 * a lit left face, a shaded right face, a light top, and one coloured accent (a roof, a
 * glow, an orb). Plain hex fills and no filters or animation — the map rasterises each
 * once (`spriteRaster.ts`), and a sprite is a picture, not a document.
 *
 * Everything sits in a 64 × 64 box with the plinth centred on (32, 50) and its bottom
 * corner at y 63, so the layer's bottom anchor lands the building on the hex centre.
 * Swap in the designer's own symbols here when they arrive; nothing else changes.
 */
import type { BuildingId } from '@es3/core';

type Pt = readonly [number, number];
const pts = (...p: Pt[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const poly = (fill: string, ...p: Pt[]) => `<polygon points="${pts(...p)}" fill="${fill}"/>`;

/** The plinth: a diamond footprint the width of the building's ground. */
function plinth(top = '#2b2238', edge = '#1a1424'): string {
  return (
    poly(edge, [6, 51], [32, 64], [58, 51], [58, 53], [32, 66], [6, 53]) +
    poly(top, [6, 50], [32, 37], [58, 50], [32, 63])
  );
}

/** An iso box standing on (cx, cy): half-width `w`, height `h`. */
function box(cx: number, cy: number, w: number, h: number, top: string, left: string, right: string): string {
  const t = cy - h;
  return (
    poly(left, [cx - w, t], [cx, t + w / 2], [cx, cy + w / 2], [cx - w, cy]) +
    poly(right, [cx + w, t], [cx, t + w / 2], [cx, cy + w / 2], [cx + w, cy]) +
    poly(top, [cx, t - w / 2], [cx + w, t], [cx, t + w / 2], [cx - w, t])
  );
}

/** A four-sided roof whose eaves sit at `eaveY`, apex `rise` above — the two faces you see. */
function pyramid(cx: number, eaveY: number, w: number, rise: number, left: string, right: string): string {
  const apex: Pt = [cx, eaveY - rise];
  return poly(left, [cx - w, eaveY], [cx, eaveY + w / 2], apex) + poly(right, [cx + w, eaveY], [cx, eaveY + w / 2], apex);
}

const orb = (cx: number, cy: number, r: number, fill: string) =>
  `<circle cx="${cx}" cy="${cy}" r="${r * 1.9}" fill="${fill}" opacity="0.3"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;

/** Brown walls, green turf on top, a red roof peak, and the white silo beside it. */
const FARM =
  plinth('#23301f', '#141d12') +
  `<path d="M12 50 L20 46 M16 54 L24 50 M40 56 L48 52" stroke="#5fcf5a" stroke-width="2" stroke-linecap="round"/>` +
  // The roof peak rises behind the turf, so it is drawn first.
  pyramid(27, 36, 9, 12, '#c9503f', '#a33d30') +
  box(30, 50, 12, 11, '#63cf5c', '#7a4a2a', '#5a3620') +
  `<rect x="44" y="24" width="6" height="18" rx="3" fill="#d9d3c4"/><rect x="47" y="24" width="3" height="18" rx="1.5" fill="#b9b2a2"/>`;

/** The mill: turf-topped block, logs at its foot, and the saw ring turning in pale blue. */
const SAWMILL =
  plinth('#23301f', '#141d12') +
  box(28, 50, 12, 11, '#5bbf55', '#7a4a2a', '#5a3620') +
  `<ellipse cx="14" cy="55" rx="4" ry="2.6" fill="#b07a55"/><ellipse cx="19" cy="57" rx="4" ry="2.6" fill="#9a6644"/>` +
  `<circle cx="44" cy="37" r="7.5" fill="none" stroke="#9fd4ee" stroke-width="2.4" stroke-dasharray="3 2.4"/>` +
  orb(44, 37, 2.2, '#bfe6f7');

/** Two cut slabs of pale granite and the derrick over the seam. */
const QUARRY =
  plinth('#262a36', '#15171f') +
  box(22, 52, 10, 5, '#9bb7dc', '#48566c', '#36415a') +
  box(38, 46, 9, 9, '#8fb0d8', '#42506a', '#313c54') +
  `<path d="M40 38 L40 18" stroke="#a0724a" stroke-width="2.2"/><path d="M34 21 L50 14" stroke="#8a96a8" stroke-width="2.4" stroke-linecap="round"/>`;

/** A squat brick forge with a lit door, its chimney, and the ember above it. */
const FORGE =
  plinth('#2e2220', '#1b1413') +
  box(30, 50, 12, 10, '#7d5645', '#6d4a3c', '#553628') +
  box(36, 40, 2.6, 10, '#6a4a3c', '#5e3f33', '#4a3128') +
  poly('#ff8a2a', [21, 45], [26, 47.5], [26, 53.5], [21, 51]) +
  orb(36, 20, 3.4, '#ff9a3a');

/** The night market: an awning on four posts, and the goods glowing under it. */
const MARKET =
  plinth('#2e2a1a', '#1b1810') +
  `<path d="M16 50 L16 38 M48 50 L48 38 M32 58 L32 46" stroke="#6d4a3c" stroke-width="2.2"/>` +
  `<circle cx="27" cy="52" r="3" fill="#7cdd4a"/><circle cx="32" cy="54" r="2.6" fill="#9be26a"/><circle cx="38" cy="52" r="3.2" fill="#f2c230"/>` +
  poly('#e8c02a', [12, 36], [32, 46], [32, 22]) +
  poly('#e07040', [52, 36], [32, 46], [32, 22]);

/** The Drowned Man: a timber house under a steep roof, one lit window, smoke, a sign. */
const TAVERN =
  plinth('#2e2420', '#1b1513') +
  box(32, 50, 12, 11, '#9a6a44', '#8a5a36', '#6a4428') +
  pyramid(32, 39, 13, 11, '#b06848', '#8a4a34') +
  poly('#f2c230', [37, 44], [41, 42], [41, 47], [37, 49]) +
  `<path d="M14 42 L14 28 L20 28" stroke="#7a5a46" stroke-width="2"/><circle cx="18" cy="32" r="3" fill="#f2c230"/>` +
  `<circle cx="38" cy="20" r="2.4" fill="#8a8a92"/><circle cx="41" cy="15" r="1.8" fill="#6f6f78"/>`;

/** The buildings drawn from the Codex. Every other Work keeps its older sprite for now. */
export const DESIGN_SPRITES: Partial<Readonly<Record<BuildingId, string>>> = {
  farm: FARM,
  sawmill: SAWMILL,
  quarry: QUARRY,
  forge: FORGE,
  market: MARKET,
  tavern: TAVERN,
};

/** Keep (the Hearth's structure) and Temple, for `placeSprites.ts`. */
export const KEEP_BODY =
  plinth('#2b2238', '#1a1424') +
  // Towers first: they stand behind the hall, and the hall's door faces you.
  box(32, 41, 4.5, 24, '#c2a8e2', '#8866aa', '#6d4f8c') +
  box(20, 47, 4, 16, '#b69ad8', '#7d5a9c', '#644780') +
  box(44, 47, 4, 16, '#b69ad8', '#7d5a9c', '#644780') +
  box(32, 53, 11, 8, '#a98ad0', '#7d5a9c', '#644780') +
  `<path d="M24 56 L24 51.5 Q27 48.5 30 51.5 L30 59 Z" fill="#1a1424"/>` +
  orb(32, 10, 3.2, '#00ff88');

export const TEMPLE_BODY =
  plinth('#3a2e52', '#221a33') +
  poly('#4d3e6c', [12, 50], [32, 40], [52, 50], [32, 60]) +
  `<rect x="21" y="34" width="3.5" height="16" fill="#cfc6e2"/><rect x="30.2" y="37" width="3.5" height="18" fill="#e8e2f3"/><rect x="39.5" y="34" width="3.5" height="16" fill="#cfc6e2"/>` +
  pyramid(32, 33, 18, 14, '#8f7cb8', '#b3a3d8') +
  orb(32, 12, 3, '#ffd700'); // sacred gold: §03, "if it glows, it is sacred"

/** The full SVG for a Codex building, or `null` for one not drawn yet. */
export function designSvg(id: BuildingId, px: number): string | null {
  const body = DESIGN_SPRITES[id];
  if (!body) return null;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 2 64 64" width="${px}" height="${px}">${body}</svg>`;
}
