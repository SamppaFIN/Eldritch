/**
 * The night's dream, in the store (BRDC-DREAM-001).
 *
 * The walk writer notes the waking: the reading before the night and the first one after
 * it meet there, and nowhere else. A dream is faced once, on Will, on the investigator's
 * own dice (Season 2 realms — it needs a Keep and an investigator), and one is drawn a day.
 */
import { DREAM_NEED, dreamById, dreamFor, dreamt } from '../rules/dream.js';
import type { DreamCard } from '../rules/dream.js';
import { FIRST_INVESTIGATOR, addClues, afterTest, diceFor, luckFor, recover, rollTest } from '../rules/investigator.js';
import type { Investigator } from '../rules/investigator.js';
import type { DwellReading } from '../rules/dwell.js';
import type { ResourceKind, ResourceState } from '../rules/terrain.js';
import { mythosDice } from '../rules/doom.js';
import { mythosToday } from './mythosStore.js';
import { commit } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';

interface DreamRecord {
  /** The local day it was dreamt, `YYYY-MM-DD`. */
  day: string;
  cardId: string;
  /** How it ended, once faced. */
  outcome?: { pass: boolean; text: string };
}

export interface DreamView {
  card: DreamCard;
  outcome: { pass: boolean; text: string } | null;
}

export type DreamOutcome = { ok: true; pass: boolean; text: string } | { ok: false; refused: 'none' | 'faced' };

export interface DreamApi {
  /** Last night's dream, if one was drawn and is not yet faced — or its ending, once. */
  waiting(now: number): Promise<DreamView | null>;
  face(now: number, rng?: () => number): Promise<DreamOutcome>;
}

const localDay = (t: number): string => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Called by the walk writer with the readings either side of the gap: draws the dream, once a day. */
export async function noteWaking(store: KeyValueStore, previous: DwellReading | null, next: DwellReading): Promise<void> {
  if (!dreamt(previous, next, new Date(next.t).getHours())) return;
  const day = localDay(next.t);
  if ((await store.get<DreamRecord>(K.dream))?.day === day) return;
  if (!(await store.get<ResourceState>('resources'))?.keep) return;
  await store.set<DreamRecord>(K.dream, { day, cardId: dreamFor(day).id });
}

export function dreamApi(store: () => KeyValueStore): DreamApi {
  const read = async (now: number) => {
    const r = await store().get<DreamRecord>(K.dream);
    const card = r && r.day === localDay(now) ? dreamById(r.cardId) : null;
    return r && card ? { r, card } : null;
  };

  return {
    async waiting(now) {
      const d = await read(now);
      return d ? { card: d.card, outcome: d.r.outcome ?? null } : null;
    },

    async face(now, rng = Math.random) {
      const d = await read(now);
      if (!d) return { ok: false, refused: 'none' };
      if (d.r.outcome) return { ok: false, refused: 'faced' };
      const inv = recover((await store().get<Investigator>(K.investigator)) ?? FIRST_INVESTIGATOR(now), now);
      const roll = rollTest(diceFor(inv, 'will', now) + mythosDice(await mythosToday(store(), now), 'will'), DREAM_NEED, luckFor(inv, now), rng);
      const { pass, fail } = d.card;
      if (roll.pass) {
        await store().set(K.investigator, addClues(inv, pass.clues ?? 0));
        const gain = pass.gain ?? {};
        if (Object.keys(gain).length > 0) {
          await commit(store(), now, (cur) => {
            const pool = { ...cur.pool };
            for (const [k, v] of Object.entries(gain) as [ResourceKind, number][]) pool[k] += v;
            return { ...cur, pool };
          });
        }
      } else {
        await store().set(K.investigator, afterTest(inv, 0, fail.sanity, now));
      }
      const outcome = { pass: roll.pass, text: roll.pass ? pass.text : fail.text };
      await store().set<DreamRecord>(K.dream, { ...d.r, outcome });
      await writeLogEntry(store(), { at: now, kind: 'anomaly', ref: roll.pass ? 'dream-pass' : 'dream-fail' });
      return { ok: true, ...outcome };
    },
  };
}
