/**
 * Whether a claim is a reward moment. Pure — the effect lives in `useClaimFeedback`.
 *
 * It also used to sum the one-off `CLAIM_YIELD` a claim paid; that payout was removed
 * 2026-09-29 before Season 2 (`awardClaims`, `data/pouch.ts`).
 */
import type { CaptureOutcome } from '@es3/core';

/** True when a claim took new ground or brought a Fortress down — a reinforce alone is not a reward moment. */
export function isRewardClaim(outcomes: readonly CaptureOutcome[]): boolean {
  return outcomes.some((o) => o.kind === 'claimed' || o.kind === 'taken' || o.kind === 'razed');
}
