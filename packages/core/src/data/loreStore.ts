/**
 * The Lore, in the store (BRDC-PROG-004).
 *
 * The rules are pure (`rules/lore.ts`); this reads and writes what a Season 2 realm has
 * learned and pays for it in wisdom from the pouch. A Season 1 save has no Keep record,
 * so `view` is null there and the old Research tree (`tech.ts`) is the one it plays.
 */
import { AGE_NAMES, LORE, LORE_IDS, ageOf, canStudy, loreCost } from '../rules/lore.js';
import type { Age, LoreId, LorePath, StudyRefusal, Unlock } from '../rules/lore.js';
import { settlePouch, writePouch } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell } from '../types/domain.js';

export interface LoreRow {
  id: LoreId;
  name: string;
  age: Age;
  path: LorePath;
  unlocks: readonly Unlock[];
  lore: string;
  cost: number;
  state: 'learned' | 'available' | 'sealed';
}

export interface LoreView {
  age: Age;
  ageName: string;
  wisdom: number;
  learned: LoreId[];
  techs: LoreRow[];
}

export type StudyOutcome = { ok: true; age: Age } | { ok: false; refused: StudyRefusal | 'no-keep' };

export interface LoreApi {
  /** `null` on a Season 1 save. */
  view(now: number): Promise<LoreView | null>;
  study(id: LoreId, now: number): Promise<StudyOutcome>;
}

export async function readLore(store: KeyValueStore): Promise<LoreId[]> {
  return (await store.get<LoreId[]>(K.lore)) ?? [];
}

export function loreApi(store: () => KeyValueStore, owned: (now: number) => Promise<readonly Cell[]>): LoreApi {
  return {
    view: async (now) => {
      const state = await settlePouch(store(), await owned(now), now);
      if (!state.keep) return null;
      const learned = await readLore(store());
      const age = ageOf(learned);
      return {
        age,
        ageName: AGE_NAMES[age],
        wisdom: state.pool.wisdom,
        learned,
        techs: LORE_IDS.map((id) => ({
          id,
          ...LORE[id],
          cost: loreCost(LORE[id].age),
          state: learned.includes(id) ? 'learned' : LORE[id].age > age ? 'sealed' : 'available',
        })),
      };
    },
    study: async (id, now) => {
      const state = await settlePouch(store(), await owned(now), now);
      if (!state.keep) return { ok: false, refused: 'no-keep' };
      const learned = await readLore(store());
      const check = canStudy(id, learned, state.pool.wisdom);
      if (!check.ok) return check;
      await writePouch(store(), { ...state.pool, wisdom: state.pool.wisdom - check.cost }, now);
      const next = [...learned, id];
      await store().set(K.lore, next);
      await writeLogEntry(store(), { at: now, kind: 'research', ref: id });
      return { ok: true, age: ageOf(next) };
    },
  };
}
