/**
 * What a bounty is called and what it looks like (BRDC-BOUNTY-001, BRDC-RES-001).
 *
 * The table is core's; the words and the glyph are the app's, the same division
 * `catalogue.tsx` makes for buildings and rites.
 *
 * `BOUNTY_NAME`/`BOUNTY_GLYPH` stay legacy-only (`BountyId`, the old ten) — the level
 * editor's hand-painted brush still only offers those, unrelated to this ticket. Anything
 * that can also show a `BountyPick` from the 28-find Worldseed pool goes through the
 * `bountyPick*` functions instead, which resolve either pool by its own tag.
 */
import { BONUS_RESOURCES, BOUNTIES, yieldToResource } from '@es3/core';
import type { BountyId, BountyPick, ResourceKind } from '@es3/core';
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
  granite: 'Granite',
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
  granite: '◆',
};

/** "Deer · +2 food / h" — the whole of what a bounty is, in one line. */
export function bountyLine(id: BountyId): string {
  const b = BOUNTIES[id];
  return `${BOUNTY_NAME[id]} · +${b.perHour} ${RESOURCE_WORD[b.resource]} / h`;
}

/** What the card says on a hex nobody has looked at yet. */
export const UNSEEN_BOUNTY = 'Reveal this ground to see what is on it.';

/**
 * A Worldseed find with no icon of its own yet — `BRDC-RES-002` draws the other 28. One
 * shared placeholder rather than 28 invented glyphs this ticket has no art direction for.
 */
const WORLDSEED_GLYPH = '✦';

/** Either pool's name, resolved by the pick's own tag. */
export function bountyPickName(pick: BountyPick): string {
  if (pick.pool === 'legacy') return BOUNTY_NAME[pick.id as BountyId];
  return BONUS_RESOURCES.find((r) => r.id === pick.id)?.name ?? pick.id;
}

/** Either pool's glyph. */
export function bountyPickGlyph(pick: BountyPick): string {
  return pick.pool === 'legacy' ? BOUNTY_GLYPH[pick.id as BountyId] : WORLDSEED_GLYPH;
}

/** "Mushrooms · +1 food, +1 wisdom / h" — joins every yield, not just the first. */
export function bountyPickLine(pick: BountyPick): string {
  if (pick.pool === 'legacy') return bountyLine(pick.id as BountyId);
  const r = BONUS_RESOURCES.find((res) => res.id === pick.id);
  if (!r) return bountyPickName(pick);
  const parts = (Object.entries(r.yields) as [Parameters<typeof yieldToResource>[0], number][]).map(
    ([y, amount]) => `+${amount} ${RESOURCE_WORD[yieldToResource(y) as ResourceKind]}`,
  );
  return `${r.name} · ${parts.join(', ')} / h`;
}
