/**
 * Claiming a hex by walking into it, in the store (BRDC-CLAIM-009).
 *
 * The loop is the game's real mechanic and it is coming back behind a setting. Until
 * then, `claimableStep` (`rules/step.js`) says whether the cell underfoot can be taken,
 * and this writes it: `resolveCapture` for the cell, `awardClaims` for the yield,
 * `addXpTo` for the XP, one log line.
 *
 * Adventure mode resolves an already-owned rival cell with `resolveInstantCapture`
 * instead (BRDC-CLAIM-017) — whoever stepped here last owns it, no siege. Route mode
 * keeps `resolveCapture` and its own older refusal below: BRDC-MODE-002's "no stealing,
 * no direction" never changed, and this is the one place that promise is kept.
 */
import { emptyCell, resolveCapture, resolveInstantCapture } from '../rules/capture.js';
import { claimableStep } from '../rules/step.js';
import { neighboursOf } from '../geo/cells.js';
import { XP_PER_CELL_CLAIMED } from '../rules/constants.js';
import { awardClaims } from './pouch.js';
import { addXpTo } from './profileStore.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { CaptureOutcome, Cell, H3Index, PlayerProfile } from '../types/domain.js';

/**
 * The outcome travels with the cell (BRDC-CLAIM-013).
 *
 * `resolveCapture` computes it here and `awardClaims` spends it; dropping it on the way
 * out left the app unable to build a `ClaimEvent`, and with it went the spoils line, the
 * chime, the buzz, the burst and the gold flare — all of them written and tested, none of
 * them ever fired on the way the game is actually played.
 */
export type StepClaimOutcome =
  | { claimed: H3Index; outcome: CaptureOutcome }
  | { claimed: null };

export async function claimStepAt(
  store: KeyValueStore,
  newId: () => string,
  standing: H3Index | null,
  owned: readonly Cell[],
  home: H3Index | null,
  profile: PlayerProfile,
  now: number,
): Promise<StepClaimOutcome> {
  const h3 = claimableStep(standing, owned, home);
  if (!h3) return { claimed: null };

  // The rule only checks adjacency; a rival's border cell can pass it. Route mode still
  // stops here — its own no-stealing promise (BRDC-MODE-002). Adventure mode instead
  // resolves it below with `resolveInstantCapture` (BRDC-CLAIM-017).
  const stored = await store.get<Cell>(K.cell(h3));
  if (profile.mode === 'route' && stored && stored.ownerId !== null) return { claimed: null };

  const ownedNeighbours = neighboursOf(h3).filter((n) => owned.some((c) => c.h3 === n)).length;
  const resolve = profile.mode === 'route' ? resolveCapture : resolveInstantCapture;
  const { cell, outcome } = resolve(
    stored ?? emptyCell(h3),
    { id: profile.id, level: profile.level, ownedNeighbours },
    now,
  );
  if (outcome.kind !== 'claimed' && outcome.kind !== 'taken') return { claimed: null };

  await store.set(K.cell(h3), cell);
  await addXpTo(store, newId, XP_PER_CELL_CLAIMED);
  await awardClaims(store, [...owned, cell], [outcome], now);
  await writeLogEntry(store, { at: now, kind: outcome.kind === 'taken' ? 'corrupt' : 'awaken', count: 1 });
  return { claimed: h3, outcome };
}
