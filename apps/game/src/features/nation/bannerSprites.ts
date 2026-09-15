/**
 * The six banners as map icons (BRDC-BANNER-001, field report 2026-09-06).
 *
 * `Banner.tsx` draws them in the Keep as inline React SVG; the map needs a raster in its
 * image atlas. Same shapes, emitted as an SVG string and `map.addImage`d once — the exact
 * pattern `buildingSprites.ts` uses for the Work icons. Picking a banner in the Keep now
 * shows on every hex you hold.
 */
import { BANNER_IDS } from './nation.js';
import type { BannerId, HandDrawnBannerId } from './nation.js';
import { REALM_MARKS, isRealmMark } from './realmMarks.js';
import type { MarkInk, RealmMarkId } from './realmMarks.js';
import { rasteriseSvgs } from '../territory/spriteRaster.js';

/** Rendered size, device pixels. Small — it sits on one res-11 hex. */
export const BANNER_PX = 128;

/** id → the `map.addImage` name. */
export const bannerSpriteId = (id: BannerId): string => `banner-${id}`;

const GOLD = '#ffd700';
const CYAN = '#00d4ff';

/** A realm mark's ink as a literal hex — this SVG is decoded by an `Image` outside the
 *  document, where a CSS custom property never resolves (the same reason `terrainSprites`
 *  and `bountySprites` use literals, not `var()`). */
const MARK_HEX: Readonly<Record<MarkInk, string>> = {
  gold: GOLD,
  cyan: CYAN,
  green: '#00ff88',
  purple: '#4a1a5c',
  culture: '#f07bb5',
  wisdom: '#b07fe0',
  iron: '#a9cbdb',
  timber: '#5fae6a',
  stone: '#a8b2c4',
  danger: '#a63a3a',
  muted: '#b8b0c4',
};

/** The stroke shapes for one hand-drawn banner — the same geometry as `Banner.tsx#shape`. */
const HAND_DRAWN_SHAPE: Readonly<Record<HandDrawnBannerId, string>> = {
  vesica:
    `<circle cx="19" cy="24" r="13" stroke="${GOLD}"/><circle cx="29" cy="24" r="13" stroke="${CYAN}"/>`,
  heptagram: `<path stroke="${GOLD}" d="M24 5 L38 40 L9 18 L39 18 L10 40 Z M24 5 L34 43 L4 22 L44 22 L14 43 Z"/>`,
  chevron:
    `<path stroke="${GOLD}" d="M6 20 L24 8 L42 20"/><path stroke="${CYAN}" d="M6 32 L24 20 L42 32"/><path stroke="${GOLD}" d="M6 42 L24 30 L42 42"/>`,
  pale: `<path stroke="${GOLD}" d="M24 4 V44"/><path stroke="${CYAN}" d="M12 4 V44"/><path stroke="${CYAN}" d="M36 4 V44"/>`,
  eye: `<path stroke="${GOLD}" d="M4 24 C14 10 34 10 44 24 C34 38 14 38 4 24 Z"/><circle cx="24" cy="24" r="6" stroke="${CYAN}"/>`,
  triquetra:
    `<circle cx="24" cy="16" r="11" stroke="${GOLD}"/><circle cx="15" cy="31" r="11" stroke="${GOLD}"/><circle cx="33" cy="31" r="11" stroke="${GOLD}"/>`,
};

/** A generated realm mark, as its circles and path in one flat colour (Sigil §04). */
function realmMarkShape(id: RealmMarkId): string {
  const mark = REALM_MARKS[id];
  const hex = MARK_HEX[mark.ink];
  const circles = mark.circles.map((c) => `<circle cx="${c.x}" cy="${c.y}" r="${c.r}" stroke="${hex}"/>`).join('');
  const path = mark.d ? `<path d="${mark.d}" stroke="${hex}"/>` : '';
  return circles + path;
}

/**
 * The realm marks are built in a 100×100 space and the six hand-drawn originals in
 * 48×48 (Sigil §04) — same reason `Banner.tsx` picks its `viewBox` per id rather than
 * rescaling one set's coordinates into the other's frame. `strokeScale` keeps the line
 * the same apparent thickness in both: the hand-drawn set uses 3 at 48, so the ratio is
 * 3/48 either way.
 */
export function bannerSvg(id: BannerId): string {
  const box = isRealmMark(id) ? 100 : 48;
  const shape = isRealmMark(id) ? realmMarkShape(id) : HAND_DRAWN_SHAPE[id];
  const strokeWidth = box * (3 / 48);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}" width="${BANNER_PX}" height="${BANNER_PX}">` +
    `<g fill="none" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${shape}</g></svg>`
  );
}

/**
 * Rasterise every banner to an `ImageData`, keyed by `bannerSpriteId`. `null` on a
 * platform with no 2D canvas (a test runner) — the caller no-ops. Real Chromium resolves.
 */
export async function rasteriseBanners(): Promise<Map<string, ImageData> | null> {
  return rasteriseSvgs(BANNER_IDS, bannerSvg, bannerSpriteId, BANNER_PX);
}
