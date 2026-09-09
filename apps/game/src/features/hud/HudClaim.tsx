/**
 * What the ground just did, said once and then let go (BRDC-HUD-004).
 *
 * Lifted out of `Hud.tsx`, which was at its four-hundred-line ceiling, and given the one
 * thing it was missing: an ending. `BRDC-CLAIM-013` made a step-claim report itself, so
 * after the first hex this line would otherwise have sat in the HUD for the rest of the
 * session. It is a reward, not a readout — the History screen is where the record lives,
 * and the ☰ menu still opens it.
 */
import { useEffect, useState } from 'react';
import { gainsLine, resourceGainsFor } from './claimFeedback.js';
import type { ClaimEvent } from '../territory/useTerritory.js';

/** Long enough to read while walking, short enough to be gone before the next hex. */
const HOLD_MS = 6_000;

/**
 * What a claim just did, in lore rather than in code words.
 *
 * `claim` is "Awakening the Ground", `steal` is "Corruption" — the domain model in
 * claude.md, used consistently so the interface and the fiction are the same language.
 */
export function claimLine(claim: ClaimEvent): string {
  const count = (kind: string) => claim.outcomes.filter((o) => o.kind === kind).length;
  const parts: string[] = [];

  const awakened = count('claimed');
  const corrupted = count('taken');
  const reinforced = count('reinforced');
  const damaged = count('damaged');

  if (awakened) parts.push(`${awakened} awakened`);
  if (corrupted) parts.push(`${corrupted} corrupted`);
  if (reinforced) parts.push(`${reinforced} reinforced`);
  if (damaged) parts.push(`${damaged} weakened`);

  // What the ground paid for being taken — the same CLAIM_YIELD the pouch just gained.
  const spoils = gainsLine(resourceGainsFor(claim.outcomes));
  if (spoils) parts.push(spoils);

  return parts.length > 0 ? parts.join(' · ') : 'The ground did not stir';
}

export interface HudClaimProps {
  lastClaim: ClaimEvent | null;
  /** Opens the action log — the claim line is one way in (BRDC-LOG-001). */
  onOpenLog?: (() => void) | undefined;
}

export function HudClaim({ lastClaim, onOpenLog }: HudClaimProps) {
  const [shown, setShown] = useState<ClaimEvent | null>(null);

  useEffect(() => {
    if (!lastClaim) return;
    setShown(lastClaim);
    const timer = setTimeout(() => setShown(null), HOLD_MS);
    return () => clearTimeout(timer);
  }, [lastClaim]);

  if (!shown) return null;

  return (
    <button
      type="button"
      className="hud__claim"
      aria-live="polite"
      onClick={onOpenLog}
      disabled={!onOpenLog}
    >
      <span aria-hidden>◈</span> {claimLine(shown)}
    </button>
  );
}
