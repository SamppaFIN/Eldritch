/**
 * Claiming ground by walking into it (BRDC-CLAIM-009).
 *
 * The loop is the game's real mechanic and it is coming back behind a setting. Until it
 * is taught, territory grows one foot at a time: step into an unclaimed hex that touches
 * ground you already hold and it is yours. Your land spreads from its edges, never in
 * leaps.
 *
 * This only decides *adjacency* — whether a rival's border cell is taken outright
 * (Adventure mode, BRDC-CLAIM-017) or refused (Route mode, BRDC-MODE-002) is
 * `stepStore.js`'s call, made from the profile the geometry here does not see.
 *
 * Pure. The repository turns the returned h3 into a claimed cell with `resolveCapture`
 * or `resolveInstantCapture`, so a step-claim and a loop-claim over the same ground never
 * disagree about who holds it.
 */
import { neighboursOf } from '../geo/cells.js';
import type { Cell, H3Index } from '../types/domain.js';

/**
 * The hex a step should claim, or `null` if this step claims nothing.
 *
 * Returns `standing` when it is not already the player's and either borders their
 * territory or is the Hearth (which is how the very first cell is taken). The caller
 * still confirms the cell is unclaimed before writing — a rival's border cell can pass
 * the adjacency test here, and taking that is the loop's job and a siege's, not a step's.
 */
export function claimableStep(
  standing: H3Index | null,
  owned: readonly Cell[],
  home: H3Index | null,
): H3Index | null {
  if (!standing) return null;

  const mine = new Set(owned.map((c) => c.h3));
  if (mine.has(standing)) return null;

  if (standing === home) return standing;
  if (neighboursOf(standing).some((n) => mine.has(n))) return standing;
  return null;
}
