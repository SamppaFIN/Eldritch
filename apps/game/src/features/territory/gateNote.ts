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
import type { ResourceKind, ResourcePool } from '@es3/core';

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
