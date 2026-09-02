/**
 * Claiming a hex by walking into it, in the store (BRDC-CLAIM-009).
 *
 * The loop is the game's real mechanic and it is coming back behind a setting. Until
 * then, `claimableStep` (`rules/step.js`) says whether the cell underfoot can be taken,
 * and this writes it exactly the way a loop claim does: `resolveCapture` for the cell,
 * `awardClaims` for the yield, `addXpTo` for the XP, one log line. A step-claim and a
 * loop-claim leave identical ground.
 */
import { emptyCell, resolveCapture } from '../rules/capture.js';
import { claimableStep } from '../rules/step.js';
import { neighboursOf } from '../geo/cells.js';
import { XP_PER_CELL_CLAIMED } from '../rules/constants.js';
import { awardClaims } from './pouch.js';
import { addXpTo } from './profileStore.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index, PlayerProfile } from '../types/domain.js';

export type StepClaimOutcome = { claimed: H3Index } | { claimed: null };

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

  // The rule only checks adjacency; a rival's border cell can pass it. Taking that is
  // the loop's and a siege's, not a step's — so a held cell stops here.
  const stored = await store.get<Cell>(K.cell(h3));
  if (stored && stored.ownerId !== null) return { claimed: null };

  const ownedNeighbours = neighboursOf(h3).filter((n) => owned.some((c) => c.h3 === n)).length;
  const { cell, outcome } = resolveCapture(
    stored ?? emptyCell(h3),
    { id: profile.id, level: profile.level, ownedNeighbours },
    now,
  );
  if (outcome.kind !== 'claimed') return { claimed: null };

  await store.set(K.cell(h3), cell);
  await addXpTo(store, newId, XP_PER_CELL_CLAIMED);
  await awardClaims(store, [...owned, cell], [outcome], now);
  await writeLogEntry(store, { at: now, kind: 'awaken', count: 1 });
  return { claimed: h3 };
}
