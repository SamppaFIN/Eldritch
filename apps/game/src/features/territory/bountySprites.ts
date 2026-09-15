/**
 * The bonus a revealed hex turns out to hold, drawn as a thing standing on the ground
 * (Sigil §03, BRDC-SIGIL-003).
 *
 * `BOUNTY_GLYPH` is one Unicode character wherever a bounty is named in a panel — the
 * cell card, the ledger, the map editor. The design document's own rule for a special
 * resource is blunt: *"Wheat is a sheaf, fish is a fish, a gold vein is nuggets in the
 * rock"* — a thing, not a coloured dot. These are that thing, small enough to stand
 * beside a Work on the same hex without crowding it.
 *
 * Multi-tone rather than held to one hue: the colour *law* governs how a resource is
 * named in text and numbers (`RESOURCE_COLOUR`), and the document's own bounty icons are
 * naturalistic — a wheat sheaf is green stem and gold grain together, not painted flat
 * food-green. What still ties an icon to the law is where it is *named*: the cell card
 * and the ledger tint `bountyLine` in the bounty's own resource colour already.
 *
 * Rasterised once into MapLibre's atlas by the same path `terrainSprites.ts` and
 * `bannerSprites.ts` take. Hex literals, not `var()` or `oklch()` — this SVG is decoded
 * by an `Image` outside the document, where neither resolves.
 */
import type { BountyId } from '@es3/core';
import { rasteriseSvgs } from './spriteRaster.js';

/** Rendered size, device pixels. Smaller than a terrain tile — this is an accent object
 *  standing on one, not the ground itself. */
export const BOUNTY_PX = 128;

/** id → the `map.addImage` name, stable so `hasImage` short-circuits a re-add. */
export const bountySpriteId = (id: BountyId): string => `bounty-${id}`;

/** Every icon sits on the same small ground shadow — what keeps a flat sheaf or a gem
 *  from reading as floating a hair above the tile. */
const SHADOW = '<ellipse cx="20" cy="33" rx="11" ry="3.4" fill="#000" fill-opacity=".38"/>';

/**
 * One entry per `BountyId` — `Record` rather than a lookup function, so TypeScript
 * itself refuses to compile if a bounty is ever added here without a picture. That is a
 * stronger guarantee than a runtime test could give.
 */
const ICON: Readonly<Record<BountyId, string>> = {
  wheat: `${SHADOW}
    <g stroke="#6b9c4a" stroke-width="1.6" fill="none" stroke-linecap="round">
      <path d="M20,33 L20,17"/><path d="M20,33 L13,21"/><path d="M20,33 L27,21"/>
    </g>
    <g fill="#f4d35e">
      <ellipse cx="20" cy="13" rx="3" ry="5.4"/>
      <ellipse cx="12" cy="17" rx="2.6" ry="4.9" transform="rotate(-20 12 17)"/>
      <ellipse cx="28" cy="17" rx="2.6" ry="4.9" transform="rotate(20 28 17)"/>
    </g>`,
  herd: `${SHADOW}
    <path d="M10,23 L20,18 L30,22 L20,26 Z" fill="#b98a5e"/>
    <path d="M10,23 L20,26 L20,31 L10,27 Z" fill="#7c5a3c"/>
    <path d="M20,26 L30,22 L30,26 L20,31 Z" fill="#5e4530"/>
    <path d="M27,15 l5,2 l-1,5.5 l-5,-2 z" fill="#c79a6c"/>
    <g stroke="#3a2c1d" stroke-width="1.6" stroke-linecap="round">
      <path d="M13,27 l0,5"/><path d="M19,30 l0,4"/><path d="M25,27 l0,5"/>
    </g>`,
  deer: `${SHADOW}
    <path d="M10,23 L20,19 L30,22 L20,26 Z" fill="#a97c53"/>
    <path d="M10,23 L20,26 L20,31 L10,27 Z" fill="#78573a"/>
    <path d="M20,26 L30,22 L30,26 L20,31 Z" fill="#5c4229"/>
    <g stroke="#e8cfa0" stroke-width="1.4" fill="none" stroke-linecap="round">
      <path d="M27,13 l-2,-6 M25,9 l-3.5,-1 M27.5,7.5 l2,-2"/>
      <path d="M31,15 l2,-6 M33,11 l3,-1"/>
    </g>`,
  furs: `${SHADOW}
    <ellipse cx="16" cy="27" rx="9" ry="6" fill="#9a7248" transform="rotate(-12 16 27)"/>
    <ellipse cx="25" cy="24" rx="8" ry="5.4" fill="#7c5a38" transform="rotate(10 25 24)"/>
    <g stroke="#5c4225" stroke-width=".9" fill="none" opacity=".6">
      <path d="M11,26 q5,2 10,0"/><path d="M20,22 q5,2 10,0"/>
    </g>`,
  gems: `${SHADOW}
    <path d="M20,7 L30,17 L20,32 L10,17 Z" fill="#e08fb0"/>
    <path d="M20,7 L30,17 L20,32 Z" fill="#000" fill-opacity=".26"/>
    <path d="M10,17 L20,21 L30,17" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/>
    <path d="M20,7 L20,21" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>
    <circle cx="16" cy="14" r="1.8" fill="#fff" fill-opacity=".6"/>`,
  marble: `${SHADOW}
    <path d="M20,14 L33,21 L20,28 L7,21 Z" fill="#e8e6ec"/>
    <path d="M7,21 L20,28 L20,34 L7,27 Z" fill="#b0adb8"/>
    <path d="M20,28 L33,21 L33,27 L20,34 Z" fill="#8d8a96"/>
    <g stroke="#9a97a4" stroke-width="1" fill="none">
      <path d="M12,19 L20,23 L27,18"/><path d="M14,25 L20,29"/>
    </g>`,
  fish: `${SHADOW}
    <ellipse cx="20" cy="30" rx="14" ry="5" fill="#1c6e8c" fill-opacity=".7"/>
    <path d="M13,22 q8,-8 17,0 q-8,7 -17,0 Z" fill="#4fb8d9"/>
    <path d="M30,22 l6,-5 l0,10 z" fill="#2f8fae"/>
    <circle cx="18" cy="20.5" r="1.5" fill="#0a2530"/>
    <path d="M20,16.5 q3,-3.5 6,-1" fill="none" stroke="#bfe8f2" stroke-width="1.2"/>`,
  amber: `${SHADOW}
    <path d="M20,10 C27,10 30,18 27,26 C25,32 15,32 13,26 C10,18 13,10 20,10 Z" fill="#e0942f"/>
    <path d="M20,10 C27,10 30,18 27,26 C25,32 20,32 20,32 Z" fill="#a8631a"/>
    <circle cx="18" cy="19" r="1.6" fill="#7a4410"/>
    <circle cx="16" cy="15" r="2.4" fill="#fff" fill-opacity=".35"/>`,
  spice: `${SHADOW}
    <path d="M11,32 Q9,20 20,18 Q31,20 29,32 Z" fill="#8a2246"/>
    <path d="M11,32 Q9,20 20,18 Q14,24 14,32 Z" fill="#6a1735"/>
    <g fill="#e0748f"><circle cx="16" cy="27" r="1.3"/><circle cx="21" cy="24" r="1.1"/><circle cx="24" cy="28" r="1.2"/></g>`,
  granite: `${SHADOW}
    <path d="M14,18 L24,23 L14,28 L4,23 Z" fill="#9aa2ac"/>
    <path d="M4,23 L14,28 L14,33 L4,28 Z" fill="#6e747c"/>
    <path d="M14,28 L24,23 L24,28 L14,33 Z" fill="#575c63"/>
    <path d="M28,16 L36,20 L28,24 L20,20 Z" fill="#a8b0ba"/>
    <path d="M20,20 L28,24 L28,30 L20,26 Z" fill="#767b83"/>
    <path d="M28,24 L36,20 L36,26 L28,30 Z" fill="#585d64"/>
    <g fill="#c4ccd4"><circle cx="12" cy="22" r="1.5"/><circle cx="29" cy="19" r="1.5"/></g>`,
};

export const BOUNTY_SPRITE_IDS = Object.keys(ICON) as BountyId[];

export function bountySvg(id: BountyId): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${BOUNTY_PX}" height="${BOUNTY_PX}">` +
    `${ICON[id]}</svg>`
  );
}

/**
 * Rasterise every icon to an `ImageData`, keyed by `bountySpriteId`.
 *
 * `null` where there is no 2D canvas — a test runner — so the caller no-ops rather than
 * throwing. Real Chromium resolves. There is no glyph-layer fallback to hand back to
 * here, unlike terrain: nothing was ever drawn on the map for a bounty before this, so
 * "nothing lands" is the same as the pre-existing behaviour.
 */
export async function rasteriseBounty(): Promise<Map<string, ImageData> | null> {
  return rasteriseSvgs(BOUNTY_SPRITE_IDS, bountySvg, bountySpriteId, BOUNTY_PX);
}
