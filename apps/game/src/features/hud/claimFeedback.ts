/**
 * What a closed loop just earned, in resources. Pure — the effect lives in
 * `useClaimFeedback`.
 *
 * The economy already pays this: `addClaimYield` hands `CLAIM_YIELD` of a producing
 * cell's resource the moment it changes hands (`pouch.ts`). This module only reads the
 * same outcome list the HUD already has and says what was gained, so the claim line and
 * the chime agree on the number.
 */
import { CLAIM_YIELD, resourceOf } from '@es3/core';
import type { CaptureOutcome, ResourceKind } from '@es3/core';

export type ResourceGains = Partial<Record<ResourceKind, number>>;

/** Sum the one-off yield over every cell this loop actually won. */
export function resourceGainsFor(outcomes: readonly CaptureOutcome[]): ResourceGains {
  const gains: ResourceGains = {};
  for (const outcome of outcomes) {
    if (outcome.kind !== 'claimed' && outcome.kind !== 'taken') continue;
    const resource = resourceOf(outcome.h3);
    if (!resource) continue;
    gains[resource] = (gains[resource] ?? 0) + CLAIM_YIELD;
  }
  return gains;
}

/** `"+30 wood · +10 gold"`, or `''` when the ground gave nothing. */
export function gainsLine(gains: ResourceGains): string {
  return Object.entries(gains)
    .map(([resource, amount]) => `+${amount} ${resource}`)
    .join(' · ');
}

/** True when the loop took at least one new cell — a reinforce alone is not a reward moment. */
export function isRewardClaim(outcomes: readonly CaptureOutcome[]): boolean {
  return outcomes.some((o) => o.kind === 'claimed' || o.kind === 'taken');
}
