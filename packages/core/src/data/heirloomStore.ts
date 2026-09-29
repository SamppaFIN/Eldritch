/**
 * The heirloom, in the store (BRDC-SEASON-006).
 *
 * Chosen in the interregnum and kept in `K.heirloom` — a forever key, so it survives the
 * season's wipe — then spent when the new realm's Keep is founded: the Keep level, the
 * Lore, the pouch and the clues it promises land at once, and the key is cleared.
 */
import { HEIRLOOMS } from '../rules/heirloom.js';
import type { Crossing, HeirloomId } from '../rules/heirloom.js';
import type { ResourceKind } from '../rules/terrain.js';
import { FIRST_INVESTIGATOR, addClues, recover } from '../rules/investigator.js';
import type { Investigator } from '../rules/investigator.js';
import { readLore } from './loreStore.js';
import { commit } from './pouch.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';

export interface HeirloomApi {
  chosen(): Promise<Crossing | null>;
  choose(id: HeirloomId, fromSeason: number): Promise<void>;
  /** Spend it on the realm just founded; null when none was carried. */
  claim(now: number): Promise<HeirloomId | null>;
}

export function heirloomApi(store: () => KeyValueStore): HeirloomApi {
  return {
    chosen: async () => (await store().get<Crossing>(K.heirloom)) ?? null,
    choose: async (id, fromSeason) => store().set(K.heirloom, { id, fromSeason }),
    claim: async (now) => {
      const crossing = await store().get<Crossing>(K.heirloom);
      if (!crossing) return null;
      const h = HEIRLOOMS[crossing.id];
      await commit(store(), now, (cur) => {
        const pool = { ...cur.pool };
        for (const [k, v] of Object.entries(h.pool ?? {}) as [ResourceKind, number][]) pool[k] += v;
        const keep = cur.keep && h.keepLevel ? { ...cur.keep, level: Math.max(cur.keep.level, h.keepLevel) } : cur.keep;
        return { ...cur, pool, ...(keep ? { keep } : {}) };
      });
      if (h.lore) await store().set(K.lore, [...new Set([...(await readLore(store())), ...h.lore])]);
      if (h.clues) {
        const inv = recover((await store().get<Investigator>(K.investigator)) ?? FIRST_INVESTIGATOR(now), now);
        await store().set(K.investigator, addClues(inv, h.clues));
      }
      await store().delete(K.heirloom);
      return crossing.id;
    },
  };
}
