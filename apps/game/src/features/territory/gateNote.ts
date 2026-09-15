/**
 * Why an action is out of reach, said next to the button (BRDC-UI-002).
 *
 * A disabled button that does not say what it is waiting for is indistinguishable from a
 * broken one — and on a touchscreen there is no hover to explain it either. Every report
 * of "I press it and nothing happens" in this game so far has been a grey button with no
 * reason beside it: Ward on a hex already at full strength, Consecrate without the stone,
 * an expansion without the gold.
 *
 * Pure, so the wording is tested without a browser. The Rites list is the in-house pattern
 * this follows — it has always said *"Locked — study Astronomy at its temple"* rather than
 * greying out in silence.
 */
import { RESOURCE_WORD } from './territoryFeatures.js';
import type { ExpandRefusal, ResourceKind, ResourcePool } from '@es3/core';

/** "60 stone and 20 gold" — what is still missing, as a phrase. */
export function missingPhrase(short: Partial<ResourcePool>): string {
  const parts = (Object.entries(short) as [ResourceKind, number][]).map(
    ([k, v]) => `${v} ${RESOURCE_WORD[k]}`,
  );
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0] as string;
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1] as string}`;
}

/** "Short 60 stone and 20 gold." — the standard line for an unaffordable action. */
export function shortNote(short: Partial<ResourcePool>): string | null {
  const phrase = missingPhrase(short);
  return phrase ? `Short ${phrase}.` : null;
}

/**
 * Why a temple could not be expanded — one table, for the two screens that expand one.
 *
 * Expanding a temple is offered both on the cell it stands on and in the Keep's list, and
 * each kept its own copy of the refusals. Two of the three lines were byte-identical and
 * the third said the same rule twice over ("Only a temple can be expanded." against "That
 * place is not a temple."). The type was duplicated three times alongside them.
 *
 * Named after the older plan's D5, which `BRDC-KEEP-008` saw and deferred rather than
 * guessed at. This is the same call as `RESOURCE_WORD` and `GROUND_NAME`: the copy that
 * two screens share lives in one place, or it drifts.
 */
export type ExpandFail = ExpandRefusal | 'not-a-temple';

export const EXPAND_REFUSAL: Readonly<Record<ExpandFail, string>> = {
  'not-a-temple': 'Only a temple can be expanded.',
  'at-max': 'This temple is already at its full strength.',
  'cannot-afford': 'Not enough stone and gold. Hold hills and markets to gather them.',
};
