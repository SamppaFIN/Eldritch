/**
 * The stranger's masks, in the store (BRDC-MASKS-001): which have been met (a rumour faced,
 * pass or fail), the naming once three are, and the choice the true name opens.
 */
import { MASKS_TO_NAME, MASK_CARDS, STRANGER_CHOICES, STRANGER_NAMES, TRUE_NAME, WRONG_NAME_SANITY } from '../rules/masks.js';
import type { StrangerChoice, StrangerName } from '../rules/masks.js';
import { FIRST_INVESTIGATOR, addClues, afterTest, recover, sanityCap } from '../rules/investigator.js';
import type { Investigator } from '../rules/investigator.js';
import { gainCondition } from '../rules/condition.js';
import { commit } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';

interface MaskBook {
  met: string[];
  wrong: number;
  namedAt?: number;
  chosen?: StrangerChoice;
}

export interface MaskView {
  /** The guises met so far: "the fisherman", "the pilot"… */
  met: readonly string[];
  /** Three met and not yet named: the Keep offers the names. */
  names: readonly { id: StrangerName; name: string }[];
  named: boolean;
  /** Named and not yet chosen: the two ways it can go. */
  choices: readonly { id: StrangerChoice; name: string; text: string }[];
  chosen: StrangerChoice | null;
}

export type MaskOutcome = { ok: true; said: string } | { ok: false; refused: 'not-yet' | 'named' | 'not-named' | 'chosen' | 'unknown' };

export interface MaskApi {
  view(now: number): Promise<MaskView>;
  name(id: StrangerName, now: number): Promise<MaskOutcome>;
  choose(id: StrangerChoice, now: number): Promise<MaskOutcome>;
}

const read = async (store: KeyValueStore): Promise<MaskBook> => (await store.get<MaskBook>(K.masks)) ?? { met: [], wrong: 0 };

/** A rumour card was faced: if it was one of his masks, it is met. */
export async function noteMask(store: KeyValueStore, cardId: string): Promise<void> {
  if (!MASK_CARDS.some((c) => c.id === cardId)) return;
  const b = await read(store);
  if (!b.met.includes(cardId)) await store.set(K.masks, { ...b, met: [...b.met, cardId] });
}

export function maskApi(store: () => KeyValueStore): MaskApi {
  const inv = async (now: number) => recover((await store().get<Investigator>(K.investigator)) ?? FIRST_INVESTIGATOR(now), now);
  return {
    async view() {
      const b = await read(store());
      const named = b.namedAt !== undefined;
      return {
        met: b.met.map((id) => MASK_CARDS.find((c) => c.id === id)?.mask ?? id),
        names: !named && b.met.length >= MASKS_TO_NAME ? STRANGER_NAMES : [],
        named,
        choices: named && !b.chosen ? (Object.keys(STRANGER_CHOICES) as StrangerChoice[]).map((id) => ({ id, ...STRANGER_CHOICES[id] })) : [],
        chosen: b.chosen ?? null,
      };
    },

    async name(id, now) {
      const b = await read(store());
      if (b.namedAt !== undefined) return { ok: false, refused: 'named' };
      if (b.met.length < MASKS_TO_NAME) return { ok: false, refused: 'not-yet' };
      if (!STRANGER_NAMES.some((n) => n.id === id)) return { ok: false, refused: 'unknown' };
      if (id !== TRUE_NAME) {
        await store().set(K.investigator, afterTest(await inv(now), 0, WRONG_NAME_SANITY, now));
        await store().set(K.masks, { ...b, wrong: b.wrong + 1 });
        return { ok: true, said: 'He laughs, in every voice you have heard him use. That is not his name.' };
      }
      await store().set(K.masks, { ...b, namedAt: now });
      await writeLogEntry(store(), { at: now, kind: 'anomaly', ref: 'stranger-named' });
      return { ok: true, said: 'Every mask turns to you at once. He bows. Now he wants to deal.' };
    },

    async choose(id, now) {
      const b = await read(store());
      if (b.namedAt === undefined) return { ok: false, refused: 'not-named' };
      if (b.chosen) return { ok: false, refused: 'chosen' };
      if (!STRANGER_CHOICES[id]) return { ok: false, refused: 'unknown' };
      const i = await inv(now);
      if (id === 'bargain') {
        await store().set(K.investigator, gainCondition(addClues(i, 3), 'dark-pact', now));
      } else {
        await store().set(K.investigator, { ...i, sanity: sanityCap(i) });
        await commit(store(), now, (cur) => ({ ...cur, pool: { ...cur.pool, mana: cur.pool.mana + 100 } }));
      }
      await store().set(K.masks, { ...b, chosen: id });
      return { ok: true, said: STRANGER_CHOICES[id].text };
    },
  };
}
