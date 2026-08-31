/**
 * The Keep — assigned once per Hearth, the storage half.
 *
 * Split out the same way pouch.ts and hearth.ts were: a small, real seam rather than
 * another branch on MockRepository.
 *
 * Re-assigned every time `setHome` is (which mirrors claimHearth exactly — see its own
 * "moves when set again" test): a fresh Hearth means a fresh secret to protect, and
 * there is nothing to average across an old Keep and a new one that share no Hearth in
 * common. What must never happen is the *same* Hearth producing a different Keep on a
 * later read — that would let two published snapshots of one player be averaged toward
 * the real address, which is the one failure `castlePosition`'s own docs warn against.
 */
import { cellAt } from '../geo/cells.js';
import { castlePosition } from '../rules/castle.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { H3Index, LatLng } from '../types/domain.js';

/** Roll and store a new Keep near `home`. `seed` should be fresh entropy, not derived. */
export async function assignCastle(
  store: KeyValueStore,
  home: LatLng,
  seed: string,
): Promise<H3Index> {
  const h3 = cellAt(castlePosition(home, seed));
  await store.set(K.castle, h3);
  return h3;
}
