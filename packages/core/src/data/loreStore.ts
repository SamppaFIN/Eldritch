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
import type { Cell, RevealedPlace } from '../types/domain.js';
import { eurekaCost, eurekaFor } from '../rules/eureka.js';
import type { Eureka, EurekaState } from '../rules/eureka.js';

export interface LoreRow {
  id: LoreId;
  name: string;
  age: Age;
  path: LorePath;
  unlocks: readonly Unlock[];
  lore: string;
  cost: number;
  state: 'learned' | 'available' | 'sealed';
  /** What would halve the price, and how far along it is (BRDC-EUREKA-001). */
  eureka: Eureka;
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
  /** Eurekas met since the last call, each said once (BRDC-EUREKA-001). Empty on Season 1. */
  announce(now: number): Promise<{ id: LoreId; name: string; eureka: Eureka }[]>;
}

export async function readLore(store: KeyValueStore): Promise<LoreId[]> {
  return (await store.get<LoreId[]>(K.lore)) ?? [];
}

export function loreApi(
  store: () => KeyValueStore,
  owned: (now: number) => Promise<readonly Cell[]>,
  places: () => Promise<readonly RevealedPlace[]> = async () => [],
): LoreApi {
  /** What the eurekas read: held ground, temples found, hexes revealed. */
  const eurekaState = async (now: number): Promise<EurekaState> => {
    const [cells, found, revealed] = await Promise.all([owned(now), places(), store().get<Record<string, number>>(K.revealed)]);
    return { owned: cells, temples: found.filter((p) => p.kind === 'temple').length, revealed: Object.keys(revealed ?? {}).length };
  };
  const price = (id: LoreId, s: EurekaState) => eurekaCost(loreCost(LORE[id].age), eurekaFor(id, s).met);
  return {
    view: async (now) => {
      const state = await settlePouch(store(), await owned(now), now);
      if (!state.keep) return null;
      const learned = await readLore(store());
      const age = ageOf(learned);
      const e = await eurekaState(now);
      return {
        age,
        ageName: AGE_NAMES[age],
        wisdom: state.pool.wisdom,
        learned,
        techs: LORE_IDS.map((id) => ({
          id,
          ...LORE[id],
          cost: price(id, e),
          state: learned.includes(id) ? 'learned' : LORE[id].age > age ? 'sealed' : 'available',
          eureka: eurekaFor(id, e),
        })),
      };
    },
    study: async (id, now) => {
      const state = await settlePouch(store(), await owned(now), now);
      if (!state.keep) return { ok: false, refused: 'no-keep' };
      const learned = await readLore(store());
      const check = canStudy(id, learned, state.pool.wisdom, price(id, await eurekaState(now)));
      if (!check.ok) return check;
      await writePouch(store(), { ...state.pool, wisdom: state.pool.wisdom - check.cost }, now);
      const next = [...learned, id];
      await store().set(K.lore, next);
      await writeLogEntry(store(), { at: now, kind: 'research', ref: id });
      return { ok: true, age: ageOf(next) };
    },
    announce: async (now) => {
      const state = await settlePouch(store(), await owned(now), now);
      if (!state.keep) return [];
      const [learned, seen, e] = await Promise.all([readLore(store()), store().get<LoreId[]>(K.eurekaSeen), eurekaState(now)]);
      const fresh = LORE_IDS.filter((id) => !learned.includes(id) && !(seen ?? []).includes(id) && eurekaFor(id, e).met);
      if (fresh.length === 0) return [];
      await store().set(K.eurekaSeen, [...(seen ?? []), ...fresh]);
      return fresh.map((id) => ({ id, name: LORE[id].name, eureka: eurekaFor(id, e) }));
    },
  };
}
