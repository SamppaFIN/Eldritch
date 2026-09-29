/**
 * What a season takes away, and what it leaves (BRDC-SEASON-002).
 *
 * Eldritch-season.pdf, "what resets, what stays": cells, buildings, citizens, resources,
 * Lore, spells and clues reset every season; the sigil, titles, relics, the Hall of Ages
 * and codex entries already read stay forever. Retiring a kingdom (BRDC-HALL-001) was the
 * first wipe with one survivor; this is the same wipe with the survivors named in one
 * place, so every later "stays forever" record is added here and nowhere else.
 */
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';

/** Keys that outlive a season. SEASON-005/006 and COUNSEL-001 add theirs here. */
export const FOREVER_KEYS: readonly string[] = [K.hallOfFame, K.titles, K.heirloom];

/** Clear the store for a new season, keeping every `FOREVER_KEYS` record as it was. */
export async function resetForSeason(store: KeyValueStore): Promise<void> {
  const kept = await store.getMany<unknown>([...FOREVER_KEYS]);
  await store.clear();
  for (const [i, key] of FOREVER_KEYS.entries()) {
    const value = kept[i];
    if (value !== undefined) await store.set(key, value);
  }
}
