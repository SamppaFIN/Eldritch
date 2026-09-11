/**
 * Which mechanics have been taught, and paying for having read one (BRDC-TUTOR-001).
 *
 * The thresholds are pure (`rules/unlock.ts`); this is the part with a store in it. It
 * stamps the moment a lesson was first shown and never un-stamps it — losing your tenth
 * cell does not un-teach city states, the same way `achievementStore` never takes an
 * achievement back.
 *
 * The reward is paid here rather than by the caller so that "shown" and "paid" cannot
 * come apart: the stamp is written first and the grant is keyed on the stamp not already
 * existing, so a double tap, a reload mid-grant or two panels open at once pay once.
 */
import { K } from './keys.js';
import { grantBonus } from './pouch.js';
import { UNLOCK_REWARD } from '../rules/unlock.js';
import type { UnlockId } from '../rules/unlock.js';
import type { Cell } from '../types/domain.js';
import type { KeyValueStore } from './kv.js';

type SeenMap = Partial<Record<UnlockId, number>>;

/** The ids already taught. */
export async function seenUnlocks(store: KeyValueStore): Promise<Set<UnlockId>> {
  const map = (await store.get<SeenMap>(K.unlocksSeen)) ?? {};
  return new Set(Object.keys(map) as UnlockId[]);
}

/**
 * Mark a lesson read and pay for it. Returns true if this call is the one that paid.
 *
 * Idempotent: a second call for the same id writes nothing and pays nothing.
 */
export async function markUnlockSeen(
  store: KeyValueStore,
  owned: readonly Cell[],
  id: UnlockId,
  now: number,
): Promise<boolean> {
  const map = (await store.get<SeenMap>(K.unlocksSeen)) ?? {};
  if (map[id] !== undefined) return false;
  await store.set<SeenMap>(K.unlocksSeen, { ...map, [id]: now });
  await grantBonus(store, owned, { wisdom: UNLOCK_REWARD }, now);
  return true;
}
