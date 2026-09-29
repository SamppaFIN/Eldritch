/**
 * Searching a ruin, in the store (BRDC-SEASON-007).
 *
 * The ruins list comes from the Worker; what each gives is pure (`rules/ruins.ts`). A
 * ruin is searched once a season per realm, on foot. What it gives lands in the pouch,
 * the investigator's clues and the profile's XP.
 */
import { ruinFindAt } from '../rules/ruins.js';
import type { RuinFind } from '../rules/ruins.js';
import type { ResourceKind } from '../rules/terrain.js';
import { FIRST_INVESTIGATOR, addClues, recover } from '../rules/investigator.js';
import type { Investigator } from '../rules/investigator.js';
import { commit } from './pouch.js';
import { addXpTo } from './profileStore.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { H3Index } from '../types/domain.js';

export type RuinOutcome = { ok: true; find: RuinFind } | { ok: false; refused: 'not-a-ruin' | 'not-there' | 'searched' };

export interface RuinApi {
  searched(): Promise<H3Index[]>;
  search(h3: H3Index, standing: H3Index | null, ruins: readonly H3Index[], seed: string, now: number): Promise<RuinOutcome>;
}

export function ruinApi(store: () => KeyValueStore, newId: () => string): RuinApi {
  const searched = async () => (await store().get<H3Index[]>(K.ruinsSearched)) ?? [];
  return {
    searched,
    search: async (h3, standing, ruins, seed, now) => {
      if (!ruins.includes(h3)) return { ok: false, refused: 'not-a-ruin' };
      if (standing !== h3) return { ok: false, refused: 'not-there' };
      const done = await searched();
      if (done.includes(h3)) return { ok: false, refused: 'searched' };
      const find = ruinFindAt(seed, h3);
      if (find.gain) {
        await commit(store(), now, (cur) => {
          const pool = { ...cur.pool };
          for (const [k, v] of Object.entries(find.gain ?? {}) as [ResourceKind, number][]) pool[k] += v;
          return { ...cur, pool };
        });
      }
      if (find.clues) {
        const inv = recover((await store().get<Investigator>(K.investigator)) ?? FIRST_INVESTIGATOR(now), now);
        await store().set(K.investigator, addClues(inv, find.clues));
      }
      if (find.xp) await addXpTo(store(), newId, find.xp);
      await store().set(K.ruinsSearched, [...done, h3]);
      await writeLogEntry(store(), { at: now, kind: 'anomaly', ref: 'ruin' });
      return { ok: true, find };
    },
  };
}
