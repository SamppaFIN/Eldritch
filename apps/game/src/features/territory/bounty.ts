/**
 * What a bounty is called and what it looks like (BRDC-BOUNTY-001).
 *
 * The table is core's; the words and the glyph are the app's, the same division
 * `catalogue.tsx` makes for buildings and rites.
 */
import { BOUNTIES } from '@es3/core';
import type { BountyId } from '@es3/core';
import { RESOURCE_WORD } from './territoryFeatures.js';

export const BOUNTY_NAME: Readonly<Record<BountyId, string>> = {
  wheat: 'Wheat',
  herd: 'A Herd',
  deer: 'Deer',
  furs: 'Furs',
  gems: 'Gems',
  marble: 'Marble',
  fish: 'Fish',
  amber: 'Amber',
  spice: 'Spices',
};

/** One glyph each, in the same register as the terrain glyphs — drawn, not emoji. */
export const BOUNTY_GLYPH: Readonly<Record<BountyId, string>> = {
  wheat: '❦',
  herd: '⚯',
  deer: '⩕',
  furs: '❈',
  gems: '❖',
  marble: '⬗',
  fish: '≈',
  amber: '❂',
  spice: '✽',
};

/** "Deer · +2 food / h" — the whole of what a bounty is, in one line. */
export function bountyLine(id: BountyId): string {
  const b = BOUNTIES[id];
  return `${BOUNTY_NAME[id]} · +${b.perHour} ${RESOURCE_WORD[b.resource]} / h`;
}

/** What the card says on a hex nobody has looked at yet. */
export const UNSEEN_BOUNTY = 'Reveal this ground to see what is on it.';
