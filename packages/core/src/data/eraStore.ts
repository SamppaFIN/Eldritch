/**
 * The realm's character at each Age, in the store (BRDC-ERA-001).
 *
 * Entering a new Lore Age leaves a choice waiting; making it is final. The chain resets
 * with the season like the Lore it follows, and the Hall keeps it as "Merchants → Seers".
 */
import { ERAS, ERA_IDS, pendingEra } from '../rules/era.js';
import type { EraDef, EraId } from '../rules/era.js';
import { ageOf } from '../rules/lore.js';
import type { Age } from '../rules/lore.js';
import { readLore } from './loreStore.js';
import { settlePouch } from './pouch.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell } from '../types/domain.js';

export interface EraView {
  age: Age;
  /** The Age whose character waits to be chosen, or null. */
  pending: Age | null;
  choices: readonly EraDef[];
  /** Chosen so far, in Age order from II. */
  chosen: readonly EraDef[];
}

export type EraOutcome = { ok: true } | { ok: false; refused: 'unknown' | 'none-pending' };

export interface EraApi {
  view(now: number): Promise<EraView>;
  /** Choose the waiting Age's character. Final. */
  choose(id: EraId, now: number): Promise<EraOutcome>;
}

export const readEras = async (store: KeyValueStore): Promise<EraId[]> => (await store.get<EraId[]>(K.eras)) ?? [];

export function eraApi(store: () => KeyValueStore, owned: (now: number) => Promise<readonly Cell[]>): EraApi {
  return {
    async view() {
      const [learned, chosen] = await Promise.all([readLore(store()), readEras(store())]);
      return { age: ageOf(learned), pending: pendingEra(learned, chosen), choices: ERA_IDS.map((id) => ERAS[id]), chosen: chosen.map((id) => ERAS[id]) };
    },

    async choose(id, now) {
      if (!ERAS[id]) return { ok: false, refused: 'unknown' };
      const [learned, chosen] = await Promise.all([readLore(store()), readEras(store())]);
      if (pendingEra(learned, chosen) === null) return { ok: false, refused: 'none-pending' };
      // Settle at the old rate first, so the new bonus pays only from now on.
      await settlePouch(store(), await owned(now), now);
      await store().set(K.eras, [...chosen, id]);
      return { ok: true };
    },
  };
}
