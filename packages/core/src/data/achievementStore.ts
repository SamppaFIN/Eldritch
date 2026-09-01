/**
 * Achievements, in the store (BRDC-CHAR-001).
 *
 * `rules/achievements.js` says what is earned now; this stamps the first moment each
 * became true (`K.achievements` → `Record<id, unlockedAt>`) and never un-stamps. Losing
 * ground you once held does not take the achievement back. `resetAll` clears it.
 */
import { ACHIEVEMENTS, earnedNow } from '../rules/achievements.js';
import type { AchievementSnapshot } from '../rules/achievements.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';

export interface AchievementView {
  id: string;
  name: string;
  hint: string;
  /** The ms it was earned, or `null` if still locked. */
  unlockedAt: number | null;
}

const read = async (store: KeyValueStore): Promise<Record<string, number>> =>
  (await store.get<Record<string, number>>(K.achievements)) ?? {};

/**
 * Stamp anything newly earned at `now`, then return the full list for the panel and the
 * ids that were added this call (for a toast).
 */
export async function syncAchievements(
  store: KeyValueStore,
  snapshot: AchievementSnapshot,
  now: number,
): Promise<{ view: AchievementView[]; unlocked: string[] }> {
  const stamped = await read(store);
  const earned = earnedNow(snapshot);
  const unlocked: string[] = [];

  for (const id of earned) {
    if (stamped[id] === undefined) {
      stamped[id] = now;
      unlocked.push(id);
    }
  }
  if (unlocked.length > 0) await store.set(K.achievements, stamped);

  const view = ACHIEVEMENTS.map((a) => ({
    id: a.id,
    name: a.name,
    hint: a.hint,
    unlockedAt: stamped[a.id] ?? null,
  }));
  return { view, unlocked };
}
