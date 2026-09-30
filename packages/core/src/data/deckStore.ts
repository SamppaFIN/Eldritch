/**
 * Rumours on the ground, in the store (BRDC-DOOM-003).
 *
 * The cards are pure (`rules/deck.ts`). A hex's rumour is faced once: roll the card's
 * test standing on it, spend clues on rerolls, then take the result — clues, resources or
 * a raised skill on a pass, stamina or sanity on a fail. It shares the investigator with
 * the gates (`K.investigator`) and never touches a gate roll that is still pending there.
 * Season 2 saves only.
 */
import { cardById, rumourAt } from '../rules/deck.js';
import type { DeckCard } from '../rules/deck.js';
import { FIRST_INVESTIGATOR, addClues, afterTest, diceFor, isHome, luckFor, recover, reroll, rollTest } from '../rules/investigator.js';
import type { Investigator, Roll } from '../rules/investigator.js';
import { terrainOf } from '../rules/terrain.js';
import type { ResourceKind } from '../rules/terrain.js';
import { commit, settlePouch } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index } from '../types/domain.js';

interface RumourBook {
  done: H3Index[];
  pending?: { h3: H3Index; cardId: string; roll: Roll };
}

export interface RumourView {
  card: DeckCard;
  investigator: Investigator & { home: boolean };
  roll: Roll | null;
}

export type RumourOutcome =
  | { ok: true; roll: Roll; said?: string }
  | { ok: false; refused: 'no-keep' | 'none-here' | 'not-there' | 'home' | 'no-clues' | 'nothing-pending' };

export interface RumourApi {
  /** The rumour on a hex this season, not yet faced — or null. */
  at(h3: H3Index, seed: string, now: number): Promise<RumourView | null>;
  face(h3: H3Index, standing: H3Index | null, seed: string, now: number, rng?: () => number): Promise<RumourOutcome>;
  reroll(index: number, now: number, rng?: () => number): Promise<RumourOutcome>;
  accept(now: number): Promise<RumourOutcome>;
}

const SKILL_MAX = 5;

export function rumourApi(store: () => KeyValueStore, owned: (now: number) => Promise<readonly Cell[]>): RumourApi {
  const book = async () => (await store().get<RumourBook>(K.rumours)) ?? { done: [] };
  /** The whole investigator record, gate `pending` and all, brought up to now. */
  const readInv = async (now: number): Promise<Investigator & { pending?: unknown }> =>
    recover((await store().get<Investigator>(K.investigator)) ?? FIRST_INVESTIGATOR(now), now); // `recover` spreads, so a gate's `pending` rides along
  const hasKeep = async (now: number) => (await settlePouch(store(), await owned(now), now)).keep !== undefined;
  const cardHere = async (h3: H3Index, seed: string) => {
    if ((await book()).done.includes(h3)) return null;
    return rumourAt(seed, h3, terrainOf(h3).kind);
  };

  return {
    at: async (h3, seed, now) => {
      if (!(await hasKeep(now))) return null;
      const card = await cardHere(h3, seed);
      if (!card) return null;
      const inv = await readInv(now);
      const b = await book();
      const { pending: _gate, ...stats } = inv;
      return { card, investigator: { ...stats, home: isHome(inv, now) }, roll: b.pending?.h3 === h3 ? b.pending.roll : null };
    },

    face: async (h3, standing, seed, now, rng = Math.random) => {
      if (!(await hasKeep(now))) return { ok: false, refused: 'no-keep' };
      const card = await cardHere(h3, seed);
      if (!card) return { ok: false, refused: 'none-here' };
      if (standing !== h3) return { ok: false, refused: 'not-there' };
      const inv = await readInv(now);
      if (isHome(inv, now)) return { ok: false, refused: 'home' };
      const roll = rollTest(diceFor(inv, card.skill, now), card.need, luckFor(inv, now), rng);
      await store().set(K.investigator, afterTest(inv, 1, 0, now));
      await store().set(K.rumours, { ...(await book()), pending: { h3, cardId: card.id, roll } });
      return { ok: true, roll };
    },

    reroll: async (index, now, rng = Math.random) => {
      const b = await book();
      if (!b.pending) return { ok: false, refused: 'nothing-pending' };
      const inv = await readInv(now);
      if (inv.clues < 1) return { ok: false, refused: 'no-clues' };
      const roll = reroll(b.pending.roll, index, rng);
      await store().set(K.investigator, addClues(inv, -1));
      await store().set(K.rumours, { ...b, pending: { ...b.pending, roll } });
      return { ok: true, roll };
    },

    accept: async (now) => {
      const b = await book();
      if (!b.pending) return { ok: false, refused: 'nothing-pending' };
      const { h3, cardId, roll } = b.pending;
      const card = cardById(cardId);
      if (!card) return { ok: false, refused: 'none-here' };
      let inv = await readInv(now);
      if (roll.pass) {
        inv = addClues(inv, card.pass.clues ?? 0);
        const up = card.pass.skillUp;
        if (up) inv = { ...inv, skills: { ...inv.skills, [up]: Math.min(SKILL_MAX, inv.skills[up] + 1) } };
        const gain = card.pass.gain ?? {};
        if (Object.keys(gain).length > 0) {
          await commit(store(), now, (cur) => {
            const pool = { ...cur.pool };
            for (const [k, v] of Object.entries(gain) as [ResourceKind, number][]) pool[k] += v;
            return { ...cur, pool };
          });
        }
      } else {
        inv = afterTest(inv, card.fail.stamina ?? 0, card.fail.sanity ?? 0, now);
      }
      await store().set(K.investigator, inv);
      await store().set(K.rumours, { done: [...b.done, h3] });
      await writeLogEntry(store(), { at: now, kind: 'anomaly', ref: roll.pass ? 'rumour-pass' : 'rumour-fail' });
      return { ok: true, roll, said: roll.pass ? card.pass.text : card.fail.text };
    },
  };
}
