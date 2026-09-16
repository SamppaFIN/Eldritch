/**
 * The 28-find Worldseed pool's own icons (BRDC-RES-002), drawn as a thing standing on the
 * ground exactly like `bountySprites.ts`'s legacy ten — same construction, same 40×40
 * viewBox, same shared `bounty-<id>` sprite-name format, because `territoryMarks.ts`'s
 * `icon-image: ['concat', 'bounty-', ['get', 'bounty']]` does not know or care which pool
 * a pick came from. It only asks for a name; whichever table registered it first answers.
 *
 * That is also why this table holds **22** entries, not 28. Six ids name the exact same
 * thing in both pools — `fish`, `deer`, `wheat`, `granite`, `marble`, `gems` (`bounty.ts`'s
 * own docstring calls this out) — and the source design document draws all six with the
 * same shape and near-identical colour in both places, because the legacy ten were
 * themselves adapted from this document for `BRDC-BOUNTY-001`. A second, near-duplicate
 * icon under the same registered name would never be seen (the legacy table adds its image
 * first) and would exist only to be dead code — so those six are left to the sprite name
 * they already share, and only the ids with no legacy counterpart get an entry here.
 *
 * Traced to real path data: every shape below is the design document's own `<symbol>`
 * (`Eldritch-Sigil.html` §03), with its `oklch()`/`var()` paint resolved to the literal hex
 * this game's colour law already assigns that token (`MAP_RESOURCE_COLOUR`, §13's tokens) —
 * not re-drawn from guesswork. A live-document-only glow filter and CSS animation on three
 * icons (`leycrystal`, `wisp`, `goldvein`) is dropped: `rasteriseSvgs` reads one static
 * frame, so neither would ever run, and an unresolved `filter="url(#…)"` risks the element
 * not painting at all rather than just losing its shimmer.
 */
import type { BountyId } from '@es3/core';
import { rasteriseSvgs } from './spriteRaster.js';

/** Same raster size as the legacy pool — one hex, one accent object on it. */
export const WORLDSEED_BOUNTY_PX = 128;

/**
 * The 22 ids with no legacy counterpart. Grouped by the document's own terrain sections
 * (`worldseedAllocate.ts`'s comments), which is also the order a reader would want them in.
 */
export type WorldseedBountyId =
  | 'reeds'
  | 'waterfowl'
  | 'leycrystal'
  | 'oak'
  | 'birch'
  | 'mushrooms'
  | 'berries'
  | 'cattle'
  | 'horses'
  | 'hay'
  | 'ironore'
  | 'peat'
  | 'bogiron'
  | 'wisp'
  | 'goldvein'
  | 'stall'
  | 'caravan'
  | 'scrap'
  | 'sauna'
  | 'ale'
  | 'orchard'
  | 'vineyard';

/** Same name format as `bountySpriteId` — the layer's `icon-image` expression builds this
 *  string from the cell's own `bounty` property and does not know a second pool exists. */
export const worldseedBountySpriteId = (id: WorldseedBountyId | BountyId): string => `bounty-${id}`;

const ICON: Readonly<Record<WorldseedBountyId, string>> = {
  reeds: `<ellipse cx="20" cy="33" rx="12" ry="3.4" fill="#144039" fill-opacity=".7"/>
    <g stroke="#50986b" stroke-width="1.7" fill="none" stroke-linecap="round"><path d="M14,33 l1,-16"/><path d="M20,33 l0,-19"/><path d="M26,33 l-1,-15"/></g>
    <g fill="#7d5c35"><ellipse cx="15" cy="15" rx="1.8" ry="4"/><ellipse cx="20" cy="12" rx="1.8" ry="4.4"/><ellipse cx="25" cy="16" rx="1.8" ry="3.8"/></g>`,
  waterfowl: `<ellipse cx="20" cy="32" rx="13" ry="4" fill="#0b4e6c" fill-opacity=".7"/>
    <path d="M10,28 q6,-8 16,-5 q6,2 4,6 q-10,4 -20,-1 z" fill="#d0d8e5"/>
    <path d="M26,23 q4,-7 8,-5 q0,5 -4,7 z" fill="#a4abb8"/>
    <circle cx="30" cy="20" r="3.2" fill="#1a3520"/>
    <path d="M33,20 l5,1.5 l-5,1.5 z" fill="#ffd700"/>`,
  leycrystal: `<ellipse cx="20" cy="33" rx="10" ry="3.4" fill="#1dcef8" fill-opacity=".28"/>
    <path d="M20,4 L27,18 L22,32 L20,32 Z" fill="#56e5ff"/>
    <path d="M20,4 L13,18 L18,32 L20,32 Z" fill="#0082ad"/>
    <path d="M11,20 L15,26 L13,33 L11,33 Z" fill="#00a3cb"/>
    <path d="M29,22 L31,28 L28,33 L27,33 Z" fill="#006f98"/>
    <circle cx="20" cy="18" r="3.2" fill="#a2ffff"/>`,
  oak: `<ellipse cx="20" cy="33" rx="11" ry="3.6" fill="#000000" fill-opacity=".4"/>
    <path d="M17,33 L17,22 L23,22 L23,33 Z" fill="#523623"/>
    <path d="M20,22 L23,22 L23,33 L20,33 Z" fill="#000000" fill-opacity=".3"/>
    <path d="M20,4 L34,17 L20,26 L6,17 Z" fill="#5fae6a"/>
    <path d="M20,4 L34,17 L20,26 Z" fill="#000000" fill-opacity=".26"/>
    <path d="M20,10 L29,17 L20,22 L11,17 Z" fill="#73c881" fill-opacity=".35"/>`,
  birch: `<ellipse cx="20" cy="33" rx="10" ry="3.4" fill="#000000" fill-opacity=".4"/>
    <g><rect x="14" y="14" width="3.4" height="19" fill="#e9e8e2"/><rect x="23" y="17" width="3" height="16" fill="#dfded8"/></g>
    <g fill="#1c1923"><rect x="14" y="19" width="3.4" height="1.4"/><rect x="14" y="25" width="3.4" height="1.2"/><rect x="23" y="22" width="3" height="1.2"/></g>
    <ellipse cx="16" cy="11" rx="9" ry="7" fill="#5fae6a"/><ellipse cx="25" cy="14" rx="7" ry="5.4" fill="#5fae6a" opacity=".8"/>`,
  mushrooms: `<ellipse cx="20" cy="33" rx="11" ry="3.4" fill="#000000" fill-opacity=".4"/>
    <path d="M17,33 L17,23 L22,23 L22,33 Z" fill="#ddd7cd"/>
    <path d="M8,23 q4,-12 12,-12 q8,0 12,12 z" fill="#bc4a3c"/>
    <g fill="#efebe4"><circle cx="15" cy="17" r="1.8"/><circle cx="24" cy="18" r="1.5"/><circle cx="20" cy="14" r="1.4"/></g>
    <path d="M27,33 L27,28 L30,28 L30,33 Z" fill="#d0cac0"/><path d="M24,28 q3,-6 6,-6 q3,0 4,6 z" fill="#a04034"/>`,
  berries: `<ellipse cx="20" cy="33" rx="11" ry="3.4" fill="#000000" fill-opacity=".4"/>
    <g stroke="#3b723e" stroke-width="1.6" fill="none" stroke-linecap="round"><path d="M20,33 l0,-10"/><path d="M20,28 q-6,-2 -8,-8"/><path d="M20,26 q6,-2 8,-8"/></g>
    <g fill="#4d4496"><circle cx="12" cy="15" r="3.4"/><circle cx="20" cy="20" r="3.6"/><circle cx="28" cy="16" r="3.2"/><circle cx="16" cy="22" r="2.6"/><circle cx="25" cy="23" r="2.6"/></g>
    <circle cx="11" cy="14" r="1" fill="#ffffff" fill-opacity=".5"/>`,
  cattle: `<ellipse cx="20" cy="33" rx="12" ry="3.6" fill="#000000" fill-opacity=".4"/>
    <g stroke="#372b26" stroke-width="2" stroke-linecap="round"><path d="M13,28 l0,5"/><path d="M19,31 l0,4"/><path d="M25,28 l0,5"/></g>
    <path d="M9,23 L20,18 L31,22 L20,27 Z" fill="#a57b68"/>
    <path d="M9,23 L20,27 L20,32 L9,28 Z" fill="#5f3f31"/>
    <path d="M20,27 L31,22 L31,27 L20,32 Z" fill="#3f271d"/>
    <path d="M28,15 l6,2.5 l-1,5.5 l-6,-2.5 z" fill="#c59a84"/>
    <g stroke="#ece4cf" stroke-width="1.5" fill="none" stroke-linecap="round"><path d="M28.5,15 q-2.5,-3 -5,-2"/><path d="M33.5,17 q1.5,-3.5 4,-3"/></g>`,
  horses: `<ellipse cx="20" cy="33" rx="12" ry="3.4" fill="#000000" fill-opacity=".4"/>
    <g stroke="#402e27" stroke-width="1.8" stroke-linecap="round"><path d="M13,26 l-1,7"/><path d="M18,29 l0,5"/><path d="M26,26 l1,7"/></g>
    <path d="M10,22 L21,17 L31,21 L20,26 Z" fill="#865e4c"/>
    <path d="M10,22 L20,26 L20,30 L10,26 Z" fill="#4e2f22"/>
    <path d="M20,26 L31,21 L31,25 L20,30 Z" fill="#341e13"/>
    <path d="M29,10 l5,2 l-2,10 l-5,-2 z" fill="#996f5d"/>
    <path d="M27,11 q-4,4 -6,7 l4,1 q2,-5 4,-6 z" fill="#351d15"/>
    <path d="M30,9 l2,-4 l2,5 z" fill="#996f5d"/>`,
  hay: `<ellipse cx="20" cy="33" rx="12" ry="3.6" fill="#000000" fill-opacity=".4"/>
    <circle cx="20" cy="24" r="10" fill="#d1b64a"/>
    <g stroke="#8b7122" stroke-width="1.1" fill="none"><circle cx="20" cy="24" r="6.5"/><circle cx="20" cy="24" r="3"/></g>
    <g stroke="#e6d271" stroke-width="1" fill="none" stroke-linecap="round"><path d="M12,16 l-3,-3 M28,16 l3,-3 M20,13 l0,-4"/></g>`,
  ironore: `<ellipse cx="20" cy="33" rx="12" ry="3.6" fill="#000000" fill-opacity=".4"/>
    <path d="M14,18 L24,23 L14,28 L4,23 Z" fill="#4a545d"/>
    <path d="M4,23 L14,28 L14,33 L4,28 Z" fill="#212a33"/>
    <path d="M14,28 L24,23 L24,28 L14,33 Z" fill="#141b24"/>
    <path d="M28,16 L36,20 L28,24 L20,20 Z" fill="#5b646f"/>
    <path d="M20,20 L28,24 L28,30 L20,26 Z" fill="#262f38"/>
    <path d="M28,24 L36,20 L36,26 L28,30 Z" fill="#161e26"/>
    <g fill="#a9cbdb"><circle cx="12" cy="22" r="1.6"/><circle cx="17" cy="25" r="1.2"/><circle cx="29" cy="20" r="1.6"/><circle cx="24" cy="26" r="1.1"/></g>`,
  peat: `<ellipse cx="20" cy="34" rx="13" ry="3.6" fill="#3d2919" fill-opacity=".7"/>
    <g><path d="M12,24 L24,30 L12,36 L0,30 Z" fill="#523623" transform="translate(4,-2)"/>
    <path d="M4,28 L16,34 L16,37 L4,31 Z" fill="#2e1a0c"/>
    <path d="M26,20 L36,25 L26,30 L16,25 Z" fill="#634632"/>
    <path d="M16,25 L26,30 L26,34 L16,29 Z" fill="#331f10"/></g>
    <g stroke="#836145" stroke-width=".9" fill="none"><path d="M9,28 L19,32 M22,24 L31,27"/></g>`,
  bogiron: `<ellipse cx="20" cy="33" rx="12" ry="4" fill="#174d40" fill-opacity=".75"/>
    <g stroke="#53a48a" stroke-width="1" fill="none"><path d="M10,32 q5,-2 10,0 q5,2 10,0"/></g>
    <g fill="#634632"><circle cx="14" cy="27" r="4"/><circle cx="23" cy="25" r="4.6"/><circle cx="28" cy="30" r="3"/></g>
    <g fill="#a9cbdb" opacity=".85"><circle cx="13" cy="26" r="1.3"/><circle cx="22" cy="23" r="1.5"/></g>`,
  wisp: `<ellipse cx="20" cy="34" rx="11" ry="3.4" fill="#1c463c" fill-opacity=".7"/>
    <g stroke="#317061" stroke-width="1.3" fill="none" stroke-linecap="round"><path d="M13,34 l-1,-8"/><path d="M27,34 l1,-7"/></g>
    <circle cx="20" cy="18" r="5" fill="#73f6a8"/>
    <circle cx="28" cy="12" r="2.4" fill="#73f6a8" opacity=".7"/>
    <circle cx="13" cy="24" r="1.8" fill="#73f6a8" opacity=".55"/>`,
  goldvein: `<ellipse cx="20" cy="33" rx="12" ry="3.6" fill="#000000" fill-opacity=".4"/>
    <path d="M13,20 L22,24.5 L13,29 L4,24.5 Z" fill="#ffd700"/>
    <path d="M4,24.5 L13,29 L13,33 L4,28.5 Z" fill="#946e00"/>
    <path d="M13,29 L22,24.5 L22,28.5 L13,33 Z" fill="#6b4d00"/>
    <path d="M28,17 L36,21 L28,25 L20,21 Z" fill="#ffe455"/>
    <path d="M20,21 L28,25 L28,30 L20,26 Z" fill="#a17a00"/>
    <path d="M28,25 L36,21 L36,26 L28,30 Z" fill="#715300"/>
    <circle cx="24" cy="14" r="2.2" fill="#fff896"/>`,
  stall: `<ellipse cx="20" cy="34" rx="13" ry="3.6" fill="#000000" fill-opacity=".4"/>
    <g stroke="#5e4837" stroke-width="2" stroke-linecap="round"><path d="M9,22 l0,12 M31,22 l0,12"/></g>
    <path d="M6,22 l7,-8 l7,8 l7,-8 l7,8 z" fill="#ffd700"/>
    <path d="M13,14 l7,8 l7,-8" fill="#c66846"/>
    <rect x="12" y="24" width="16" height="6" rx="1" fill="#795d46"/>
    <g fill="#6fdc8c"><circle cx="16" cy="24" r="1.8"/><circle cx="21" cy="24" r="1.8"/><circle cx="25" cy="24" r="1.6"/></g>`,
  caravan: `<ellipse cx="20" cy="34" rx="13" ry="3.6" fill="#000000" fill-opacity=".4"/>
    <path d="M8,20 q12,-8 24,0 l0,10 l-24,0 z" fill="#c2b6a2"/>
    <g stroke="#765e44" stroke-width="1" fill="none"><path d="M14,15 l0,15 M20,13 l0,17 M26,15 l0,15"/></g>
    <g fill="#443428"><circle cx="13" cy="32" r="3.4"/><circle cx="28" cy="32" r="3.4"/></g>
    <g fill="#ffd700"><circle cx="13" cy="32" r="1.2"/><circle cx="28" cy="32" r="1.2"/></g>`,
  scrap: `<ellipse cx="20" cy="34" rx="13" ry="3.6" fill="#000000" fill-opacity=".4"/>
    <g fill="#4a545d"><rect x="8" y="26" width="14" height="5" rx="1" transform="rotate(-8 15 28)"/><rect x="19" y="22" width="13" height="5" rx="1" transform="rotate(12 25 24)"/><rect x="11" y="18" width="11" height="4" rx="1" transform="rotate(-20 16 20)"/></g>
    <g stroke="#a9cbdb" stroke-width="1.2" fill="none" opacity=".8"><path d="M10,30 l12,-2 M21,25 l10,1"/></g>
    <circle cx="30" cy="16" r="2" fill="#ed835e" opacity=".8"/>`,
  sauna: `<ellipse cx="20" cy="34" rx="13" ry="3.6" fill="#000000" fill-opacity=".4"/>
    <path d="M10,24 L20,29 L20,36 L10,31 Z" fill="#372419"/>
    <path d="M20,29 L30,24 L30,31 L20,36 Z" fill="#26160e"/>
    <path d="M10,24 L20,19 L30,24 L20,29 Z" fill="#694b39"/>
    <path d="M9,23 L20,13 L31,22 L20,18 Z" fill="#865f4a"/>
    <rect x="17" y="27" width="6" height="7" fill="#ffa659" opacity=".7"/>
    <g stroke="#d3e0ea" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".75"><path d="M14,12 q3,-4 0,-7"/><path d="M20,9 q3,-4 0,-7"/><path d="M26,12 q3,-4 0,-7"/></g>`,
  ale: `<ellipse cx="20" cy="34" rx="12" ry="3.6" fill="#000000" fill-opacity=".4"/>
    <path d="M12,16 q-3,9 0,16 q8,3 16,0 q3,-7 0,-16 q-8,-3 -16,0 z" fill="#855831"/>
    <g stroke="#473322" stroke-width="1.6" fill="none"><path d="M11,21 q9,3 18,0"/><path d="M11,28 q9,3 18,0"/></g>
    <ellipse cx="20" cy="17" rx="8" ry="3" fill="#ffd700"/>
    <ellipse cx="20" cy="16" rx="8" ry="2.6" fill="#f7efd1" opacity=".85"/>`,
  orchard: `<ellipse cx="20" cy="34" rx="11" ry="3.4" fill="#000000" fill-opacity=".4"/>
    <rect x="18" y="22" width="4" height="12" fill="#523623"/>
    <circle cx="20" cy="17" r="11" fill="#5fae6a"/>
    <circle cx="20" cy="17" r="7" fill="#67c377" opacity=".3"/>
    <g fill="#ec5c50"><circle cx="15" cy="14" r="2.4"/><circle cx="24" cy="18" r="2.4"/><circle cx="19" cy="22" r="2.1"/></g>`,
  vineyard: `<ellipse cx="20" cy="33" rx="11" ry="3.4" fill="#000000" fill-opacity=".4"/>
    <path d="M20,33 L20,18" stroke="#614731" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <g stroke="#558a49" stroke-width="1.6" fill="none" stroke-linecap="round"><path d="M20,22 q-7,-2 -9,-7"/><path d="M20,20 q7,-2 9,-7"/></g>
    <g fill="#f07bb5"><circle cx="14" cy="17" r="3"/><circle cx="19" cy="13" r="3"/><circle cx="24" cy="17" r="3"/><circle cx="19" cy="20" r="3"/><circle cx="16" cy="10" r="2.6"/><circle cx="23" cy="10" r="2.6"/></g>
    <circle cx="17.5" cy="15" r="1.1" fill="#ffffff" fill-opacity=".5"/>`,
};

export const WORLDSEED_BOUNTY_IDS = Object.keys(ICON) as WorldseedBountyId[];

export function worldseedBountySvg(id: WorldseedBountyId): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${WORLDSEED_BOUNTY_PX}" height="${WORLDSEED_BOUNTY_PX}">` +
    `${ICON[id]}</svg>`
  );
}

/** Rasterise the 22, keyed by `worldseedBountySpriteId` — same `null`-on-no-canvas contract
 *  as `rasteriseBounty`, since `addBountySprites` (`territoryImages.ts`) calls both. */
export async function rasteriseWorldseedBounty(): Promise<Map<string, ImageData> | null> {
  return rasteriseSvgs(WORLDSEED_BOUNTY_IDS, worldseedBountySvg, worldseedBountySpriteId, WORLDSEED_BOUNTY_PX);
}
